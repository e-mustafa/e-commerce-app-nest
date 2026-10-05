import { BadRequestException, ConflictException, NotFoundException } from '@/common/exceptions';
import { Id, IUserBody } from '@/common/types';
import { sortOrderEnum } from '@/providers/database/query.enum';
import { Injectable } from '@nestjs/common';
import { QueryFilter } from 'mongoose';
import { brandMinSelect, IBrand } from '../brand';
import { BrandRepository } from '../brand/brand.repository';
import { ICart, ICartItem } from '../cart';
import { categoryMinSelect, ICategory } from '../category';
import { CategoryRepository } from '../category/category.repository';
import { IProduct, IProductGeneral, productMinSelect } from '../product';
import { ProductRepository } from '../product/product.repository';
import { AdminRoleEnum, AdminRoles, selectGeneralUserInfo } from '../user';
import type * as I from './coupon-service.interface';
import { CouponApplicableOnEnum, CouponTypeEnum } from './coupon.enums';
import { CouponRepository } from './coupon.repository';
import { ICoupon, ICouponValidationResult, ICouponWData } from './coupon.types';

const couponPopulates = [
	{ path: 'createdBy', select: selectGeneralUserInfo },
	{ path: 'products', select: productMinSelect },
	{ path: 'categories', select: categoryMinSelect },
	{ path: 'brands', select: brandMinSelect },
];

export interface IPopulatedCartItem extends Omit<ICartItem, 'product'> {
	product: IProductGeneral | Id;
}

export interface IPopulatedCart extends Omit<ICart, 'items'> {
	items: IPopulatedCartItem[];
}

@Injectable()
export class CouponService {
	constructor(
		private readonly couponRepo: CouponRepository,
		private readonly productRepo: ProductRepository,
		private readonly categoryRepo: CategoryRepository,
		private readonly brandRepo: BrandRepository,
	) {}

	/**
	 * Fully validates coupon against user & cart, and calculates applied discount.
	 */
	async validateAndCalculateDiscount(userId: string, code: string, cart: IPopulatedCart): Promise<ICouponValidationResult> {
		// 1. Check coupon existence and basic date validity
		const coupon = await this.couponRepo.findActiveByCode(code);
		if (!coupon) {
			throw new NotFoundException('Invalid or expired coupon code.');
		}

		// 2. Validate global usage limit
		if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
			throw new BadRequestException('This coupon has reached its maximum usage limit.');
		}

		// 3. Validate user specific usage limit
		if (coupon.usagePerUser && coupon.usedBy?.length) {
			const userStr = userId.toString();
			const userUsageCount = coupon.usedBy.filter((id) => id.toString() === userStr).length;

			if (userUsageCount >= coupon.usagePerUser) {
				throw new BadRequestException('You have reached the maximum allowed usage for this coupon.');
			}
		}

		// 4. Validate minimum purchase amount requirement
		if (coupon.minPurchaseAmount && cart.subTotal < coupon.minPurchaseAmount) {
			throw new BadRequestException(
				`Minimum purchase amount of ${coupon.minPurchaseAmount} is required for this coupon.`,
			);
		}

		// 5. Filter items applicable for coupon discount
		const eligibleItems = this.getEligibleCartItems(coupon, cart.items);
		if (eligibleItems.length === 0) {
			throw new BadRequestException('None of the items in your cart are eligible for this coupon.');
		}

		// Calculate total price of eligible items
		const eligibleSubTotal = eligibleItems.reduce((acc, item) => acc + item.pricePerUnit * item.quantity, 0);

		// 6. Calculate discount value based on type
		let discountAmount = 0;

		if (coupon.type === CouponTypeEnum.PERCENTAGE) {
			discountAmount = (eligibleSubTotal * coupon.value) / 100;

			// Cap discount to max limit if configured
			if (coupon.maxDiscountAmount && discountAmount > coupon.maxDiscountAmount) {
				discountAmount = coupon.maxDiscountAmount;
			}
		} else if (coupon.type === CouponTypeEnum.FIXED) {
			discountAmount = Math.min(coupon.value, eligibleSubTotal);
		}

		const finalTotal = Math.max(0, cart.subTotal - discountAmount);

		return {
			couponId: coupon._id.toString(),
			code: coupon.code,
			discountAmount: Number(discountAmount.toFixed(2)),
			finalTotal: Number(finalTotal.toFixed(2)),
			applicableItemsCount: eligibleItems.length,
		};
	}

	/**
	 * Safely extracts string ID from either an ObjectId/string or populated document object
	 */
	private extractId(entity: IProductGeneral | Id | { _id: Id } | null | undefined): string | null {
		if (!entity) return null;
		if (typeof entity === 'object' && '_id' in entity) {
			return entity._id.toString();
		}
		return entity.toString();
	}

	/**
	 * Safely extracts Category ID from populated product
	 */
	private extractCategoryId(product: IProductGeneral | Id): string | null {
		if (typeof product === 'object' && 'category' in product && product.category) {
			return this.extractId(product.category as IProductGeneral | Id);
		}
		return null;
	}

	/**
	 * Safely extracts Brand ID from populated product
	 */
	private extractBrandId(product: IProductGeneral | Id): string | null {
		if (typeof product === 'object' && 'brand' in product && product.brand) {
			return this.extractId(product.brand as IProductGeneral | Id);
		}
		return null;
	}

	/**
	 * Filters cart items matching the scope defined in coupon.applicableOn
	 */
	private getEligibleCartItems(coupon: ICoupon, items: IPopulatedCartItem[]): IPopulatedCartItem[] {
		switch (coupon.applicableOn) {
			case CouponApplicableOnEnum.SPECIFIC_PRODUCTS: {
				if (!coupon.products?.length) return items;
				const productIds = new Set(coupon.products.map((id) => id.toString()));
				return items.filter((item) => {
					const productId = this.extractId(item.product);
					return productId ? productIds.has(productId) : false;
				});
			}

			case CouponApplicableOnEnum.SPECIFIC_CATEGORIES: {
				if (!coupon.categories?.length) return items;
				const categoryIds = new Set(coupon.categories.map((id) => id.toString()));
				return items.filter((item) => {
					const categoryId = this.extractCategoryId(item.product);
					return categoryId ? categoryIds.has(categoryId) : false;
				});
			}

			case CouponApplicableOnEnum.SPECIFIC_BRANDS: {
				if (!coupon.brands?.length) return items;
				const brandIds = new Set(coupon.brands.map((id) => id.toString()));
				return items.filter((item) => {
					const brandId = this.extractBrandId(item.product);
					return brandId ? brandIds.has(brandId) : false;
				});
			}

			case CouponApplicableOnEnum.ALL_PRODUCTS:
			default:
				return items;
		}
	}

	async listCoupons({ user, page, limit, order, search, isPublished }: I.IListCouponPayload) {
		const isAdmin = AdminRoles.includes((user?.role as AdminRoleEnum) || 0);
		const filter: QueryFilter<ICoupon> = {};

		// Safely filter by publishedAt date type to prevent Mongoose CastError
		if (typeof isPublished === 'boolean' && isAdmin) {
			if (isPublished) {
				filter.publishedAt = { $type: 'date' } as unknown as Date;
			} else {
				filter.publishedAt = null;
			}
		}

		if (search?.trim()) {
			// Escape special regex characters to prevent regex injection (ReDoS)
			const escapedSearch = search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
			const searchRegex = { $regex: escapedSearch, $options: 'i' };
			filter.$or = [{ name: searchRegex }, { slug: searchRegex }, { description: searchRegex }];
		}

		const coupons = await this.couponRepo
			.find(filter, { ignoreDefaultFilters: isAdmin })
			.lean()
			.sort({ createdAt: order === sortOrderEnum.ASC ? 1 : -1 })
			.paginate(page, limit)
			.populate<ICouponWData>(couponPopulates)
			.exec();

		return coupons;
	}

	async getCoupon(user: IUserBody, couponId: Id) {
		const isAdmin = AdminRoles.includes((user?.role as AdminRoleEnum) || 0);
		const coupon = await this.couponRepo
			.findById(couponId, { ignoreDefaultFilters: isAdmin })
			.lean<ICoupon>()
			.populate<ICouponWData>(couponPopulates)
			.exec();
		if (!coupon) throw new NotFoundException('Coupon not found.');

		return coupon;
	}

	async createCouponAdmin(payload: I.ICreateCouponPayload): Promise<ICouponWData> {
		const { userId, ...body } = payload;

		const isExist = await this.couponRepo
			.findOne({ code: body.code }, { ignoreDefaultFilters: true })
			.lean<ICoupon>()
			.select('_id code')
			.exec();
		if (isExist) {
			throw new ConflictException('Coupon code already exists.');
		}

		if (body.products && body.products.length > 0) {
			const uniqueProductIds = [...new Set(body.products)];
			const products = await this.productRepo
				.find({ _id: { $in: uniqueProductIds } }, { ignoreDefaultFilters: true })
				.lean<IProduct[]>()
				.select('_id')
				.exec();
			if (products.length !== uniqueProductIds.length) {
				throw new NotFoundException('One or more specified products do not exist.');
			}
		}

		if (body.categories && body.categories.length > 0) {
			const uniqueCategoryIds = [...new Set(body.categories)];
			const categories = await this.categoryRepo
				.find({ _id: { $in: uniqueCategoryIds } }, { ignoreDefaultFilters: true })
				.lean<ICategory[]>()
				.select('_id')
				.exec();
			if (categories.length !== uniqueCategoryIds.length) {
				throw new NotFoundException('One or more specified categories do not exist.');
			}
		}

		if (body.brands && body.brands.length > 0) {
			const uniqueBrandIds = [...new Set(body.brands)];
			const brands = await this.brandRepo
				.find({ _id: { $in: uniqueBrandIds } }, { ignoreDefaultFilters: true })
				.lean<IBrand[]>()
				.select('_id')
				.exec();
			if (brands.length !== uniqueBrandIds.length) {
				throw new NotFoundException('One or more specified brands do not exist.');
			}
		}

		const coupon = await this.couponRepo.create({
			code: body.code,
			type: body.type,
			value: body.value,
			applicableOn: body.applicableOn,
			createdBy: userId,
			minPurchaseAmount: body.minPurchaseAmount,
			maxDiscountAmount: body.maxDiscountAmount,
			usageLimit: body.usageLimit,
			usagePerUser: body.usagePerUser,
			startDate: body.startDate,
			endDate: body.endDate,
			isActive: body.isActive,
			order: body.order,
			description: body.description,
			products: body.products,
			categories: body.categories,
			brands: body.brands,
		});

		return coupon.populate<ICouponWData>(couponPopulates);
	}

	async updateCouponAdmin(payload: I.IUpdateCouponPayload): Promise<ICouponWData | null> {
		const { userId, couponId, ...body } = payload;

		const coupon = await this.couponRepo.findById(couponId, { ignoreDefaultFilters: true }).lean().exec();
		if (!coupon) {
			throw new NotFoundException('Coupon not found.');
		}

		if (body.code && body.code !== coupon.code) {
			const isExist = await this.couponRepo
				.findOne({ code: body.code }, { ignoreDefaultFilters: true })
				.lean<ICoupon>()
				.select('_id code')
				.exec();
			if (isExist) {
				throw new ConflictException('Coupon code already exists.');
			}
		}

		if (body.products && body.products.length > 0) {
			const uniqueProductIds = [...new Set(body.products)];
			const products = await this.productRepo
				.find({ _id: { $in: uniqueProductIds } }, { ignoreDefaultFilters: true })
				.lean<IProduct[]>()
				.select('_id')
				.exec();
			if (products.length !== uniqueProductIds.length) {
				throw new NotFoundException('One or more specified products do not exist.');
			}
		}

		if (body.categories && body.categories.length > 0) {
			const uniqueCategoryIds = [...new Set(body.categories)];
			const categories = await this.categoryRepo
				.find({ _id: { $in: uniqueCategoryIds } }, { ignoreDefaultFilters: true })
				.lean<ICategory[]>()
				.select('_id')
				.exec();
			if (categories.length !== uniqueCategoryIds.length) {
				throw new NotFoundException('One or more specified categories do not exist.');
			}
		}

		if (body.brands && body.brands.length > 0) {
			const uniqueBrandIds = [...new Set(body.brands)];
			const brands = await this.brandRepo
				.find({ _id: { $in: uniqueBrandIds } }, { ignoreDefaultFilters: true })
				.lean<IBrand[]>()
				.select('_id')
				.exec();
			if (brands.length !== uniqueBrandIds.length) {
				throw new NotFoundException('One or more specified brands do not exist.');
			}
		}

		const updatedCoupon = await this.couponRepo
			.findOneAndUpdate(
				{ _id: couponId },
				{
					$set: {
						...(body.code !== undefined && { code: body.code }),
						...(body.type !== undefined && { type: body.type }),
						...(body.value !== undefined && { value: body.value }),
						...(body.description !== undefined && { description: body.description }),
						...(body.applicableOn !== undefined && { applicableOn: body.applicableOn }),
						...(body.minPurchaseAmount !== undefined && { minPurchaseAmount: body.minPurchaseAmount }),
						...(body.maxDiscountAmount !== undefined && { maxDiscountAmount: body.maxDiscountAmount }),
						...(body.usageLimit !== undefined && { usageLimit: body.usageLimit }),
						...(body.usagePerUser !== undefined && { usagePerUser: body.usagePerUser }),
						...(body.startDate !== undefined && { startDate: body.startDate }),
						...(body.endDate !== undefined && { endDate: body.endDate }),
						...(body.isActive !== undefined && { isActive: body.isActive }),
						...(body.products !== undefined && { products: body.products }),
						...(body.categories !== undefined && { categories: body.categories }),
						...(body.brands !== undefined && { brands: body.brands }),
						...(body.order !== undefined && { order: body.order }),
					},
				},
			)
			.lean()
			.populate<ICouponWData>(couponPopulates)
			.exec();

		return updatedCoupon;
	}

	async deleteCouponAdmin(couponId: Id) {
		const coupon = await this.couponRepo.findById(couponId, { ignoreDefaultFilters: true }).lean().exec();
		if (!coupon) {
			throw new NotFoundException('Coupon not found.');
		}

		if (coupon.deletedAt) {
			throw new ConflictException('Coupon already deleted.');
		}

		await this.couponRepo.findByIdAndUpdate(couponId, { deletedAt: new Date(), isActive: false }).lean().exec();
	}

	async togglePublishedAdmin(couponId: Id): Promise<ICoupon> {
		const coupon = await this.couponRepo.findById(couponId, { ignoreDefaultFilters: true }).lean().exec();
		if (!coupon) throw new NotFoundException('Coupon not found.');

		const newState = !coupon.isActive;

		const updated = await this.couponRepo
			.findOneAndUpdate({ _id: couponId }, { $set: { isActive: newState } })
			.lean<ICoupon>()
			.exec();

		if (!updated) throw new NotFoundException('Coupon not found.');

		return updated;
	}

	/**
	 * Validates coupon availability for a specific user
	 */
	async validateCoupon(user: IUserBody, code: string): Promise<ICoupon> {
		const coupon = await this.couponRepo.findActiveByCode(code);
		if (!coupon) throw new NotFoundException('Oops! Coupon is invalid or expired.');

		if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
			throw new BadRequestException('Oops! Coupon maximum limit reached.');
		}

		const userStr = user._id.toString();
		if (coupon.usagePerUser && coupon.usedBy?.length) {
			const userUsageCount = coupon.usedBy.filter((userId) => userId.toString() === userStr).length;
			if (userUsageCount >= coupon.usagePerUser) {
				throw new BadRequestException('Oops! You have reached your usage limit for this coupon.');
			}
		}

		return coupon;
	}
}
