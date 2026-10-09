import { ConflictException, NotFoundException } from '@/common/exceptions';
import { Id, IUserBody } from '@/common/types';
import { slugify } from '@/common/utils';
import { DBImage, sortOrderEnum } from '@/providers/database';
import { type IUploadService, TDeleteAttachment, UPLOAD_SERVICE, UploadPathBuilder } from '@/providers/upload';
import { Inject, Injectable } from '@nestjs/common';
import { QueryFilter, Types } from 'mongoose';
import { BrandRepository } from '../brand/brand.repository';
import { CategoryRepository } from '../category/category.repository';
import { AdminRoleEnum, AdminRoles } from '../user';
import type * as I from './product-service.interface';
import { ProductRepository } from './product.repository';
import { HProduct, IProduct } from './product.types';

@Injectable()
export class ProductService {
	constructor(
		private readonly productRepo: ProductRepository,
		private readonly categoryRepo: CategoryRepository,
		private readonly brandRepo: BrandRepository,
		@Inject(UPLOAD_SERVICE) private readonly uploadService: IUploadService,
	) {}

	async listProducts({ user, ...query }: I.IListProductPayload) {
		const isAdmin = AdminRoles.includes((user?.role as AdminRoleEnum) || 0);
		const filter: QueryFilter<HProduct> = {};

		// Safely handle boolean check for published status
		if (typeof query.isPublished === 'boolean' && isAdmin) {
			filter.publishedAt = query.isPublished ? ({ $type: 'date' } as unknown as Date) : null;
		}

		if (query.createdBy && isAdmin) filter.createdBy = query.createdBy;
		if (query.category) filter.category = query.category;
		if (query.brand) filter.brand = query.brand;

		if (query.search?.trim()) {
			// Escape special characters to prevent regex injection attacks
			const escapedSearch = query.search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
			const searchRegex = { $regex: escapedSearch, $options: 'i' };
			filter.$or = [
				{ title: searchRegex },
				{ slug: searchRegex },
				{ description: searchRegex },
				{ excerpt: searchRegex },
				{ model: searchRegex },
				{ tags: searchRegex },
			];
		}

		const products = await this.productRepo
			.find(filter, { ignoreDefaultFilters: isAdmin })
			.lean()
			.sort({ [query.sortBy || 'createdAt']: query.order === sortOrderEnum.ASC ? 1 : -1 })
			.paginate(query.page, query.limit)
			.exec();

		return products;
	}

	async getProduct(user: IUserBody, identifier: Id) {
		const isAdmin = AdminRoles.includes((user?.role as AdminRoleEnum) || 0);
		const product = await this.productRepo.findByIdOrSlug(identifier, { ignoreDefaultFilters: isAdmin });
		if (!product) throw new NotFoundException('Product not found.');

		return product;
	}

	async createProductAdmin(payload: I.ICreateProductPayload) {
		const { userId, files, ...body } = payload;

		// Validate Category & Brand existence BEFORE processing file uploads
		if (body.category) {
			const categoryExists = await this.categoryRepo.findById(body.category).lean().exec();
			if (!categoryExists) throw new NotFoundException('Category not found.');
		}

		if (body.brand) {
			const brandExists = await this.brandRepo.findById(body.brand).lean().exec();
			if (!brandExists) throw new NotFoundException('Brand not found.');
		}

		// Generate slug using common utility function
		let slug = body.slug ? slugify(body.slug) : slugify(body.title);

		// Check existence
		const isExist = await this.productRepo.isExist(slug, body.title);
		if (isExist) {
			if (!body.slug) {
				slug = `${slug}-${Math.random().toString(36).substring(2, 7)}`;
			} else {
				throw new ConflictException('Product title or slug already exists.');
			}
		}

		const _id = new Types.ObjectId();
		let uploadImages: DBImage[] = [];
		let newFiles: TDeleteAttachment[] = [];

		if (files && files.length > 0) {
			const location = UploadPathBuilder.getProductLocation(_id.toString(), 'main');
			const uploaded = await this.uploadService.uploadMultipleFiles(files, location.folder);
			uploadImages = uploaded.map((file) => ({ id: file.id, url: file.url }));
			newFiles = uploaded;
		}

		const publishedAt = body.isPublished ? body.publishedAt || new Date() : null;

		try {
			const product = await this.productRepo.create({
				_id,
				createdBy: userId,
				slug,
				publishedAt,
				images: uploadImages,
				title: body.title,
				excerpt: body.excerpt,
				price: body.price,
				stock: body.stock,
				brand: body.brand,
				category: body.category,
				order: body.order,
				description: body.description,
				discountPrice: body.discountPrice,
				costPrice: body.costPrice,
				stockType: body.stockType,
				maxOrderSell: body.maxOrderSell,
				lowStockAlert: body.lowStockAlert,
				sku: body.sku,
				tags: body.tags,
			});

			return product;
		} catch (error) {
			if (newFiles.length > 0) await this.uploadService.deleteMultipleFiles(newFiles);
			throw error;
		}
	}

	async updateProductAdmin(payload: I.IUpdateProductPayload) {
		const { userId, productId, files, ...body } = payload;

		const product = await this.productRepo.findById(productId, { ignoreDefaultFilters: true }).lean().exec();
		if (!product) {
			throw new NotFoundException('Product not found.');
		}

		if ((body.title && body.title !== product.title) || (body.slug && body.slug !== product.slug)) {
			const isExist = await this.productRepo.isExist(body.slug || '', body.title || '', { ignoreDefaultFilters: true });
			if (isExist) {
				throw new ConflictException('Product name or slug already exists.');
			}
		}

		if (body.category && body.category !== product.category) {
			const category = await this.categoryRepo.findById(body.category, { ignoreDefaultFilters: true }).lean().exec();
			if (!category) {
				throw new NotFoundException('Category not found.');
			}
		}

		if (body.brand && body.brand !== product.brand) {
			const brand = await this.brandRepo.findById(body.brand, { ignoreDefaultFilters: true }).lean().exec();
			if (!brand) {
				throw new NotFoundException('Brand not found.');
			}
		}

		let newFiles: TDeleteAttachment[] = [];
		let uploadImages: DBImage[] = [];

		if (files && files.length > 0) {
			const location = UploadPathBuilder.getProductLocation(productId.toString(), 'main');
			const uploaded = await this.uploadService.uploadMultipleFiles(files, location.folder);
			uploadImages = uploaded.map((file) => ({ id: file.id, url: file.url }));
			newFiles = uploaded;
		}

		const setSlug =
			body.slug && body.slug === product.slug ? product.slug : slugify(body.slug || body.title || product.title);
		// console.log('body.publishedAt', body.publishedAt);
		// Determine correct publishedAt timestamp
		let publishedAt = product.publishedAt;
		if (body.isPublished) {
			if (body.publishedAt !== undefined && body.publishedAt !== product.publishedAt) {
				publishedAt = body.publishedAt || new Date();
			}
		} else {
			publishedAt = null;
		}

		try {
			const updatedProduct = await this.productRepo
				.findOneAndUpdate(
					{ _id: productId },
					{
						$set: {
							slug: setSlug,
							publishedAt,
							...(files && files.length > 0 && { images: uploadImages }),
							...(body.title !== undefined && body.title !== product.title && { title: body.title }),
							...(body.excerpt !== undefined && { excerpt: body.excerpt }),
							...(body.price !== undefined && { price: body.price }),
							...(body.stock !== undefined && { stock: body.stock }),
							...(body.brand !== undefined && { brand: body.brand }),
							...(body.category !== undefined && { category: body.category }),
							...(body.order !== undefined && { order: body.order }),
							...(body.description !== undefined && { description: body.description }),
							...(body.discountPrice !== undefined && { discountPrice: body.discountPrice }),
							...(body.costPrice !== undefined && { costPrice: body.costPrice }),
							...(body.stockType !== undefined && { stockType: body.stockType }),
							...(body.maxOrderSell !== undefined && { maxOrderSell: body.maxOrderSell }),
							...(body.lowStockAlert !== undefined && { minWarnQuantity: body.lowStockAlert }),
							...(body.sku !== undefined && { sku: body.sku }),
							...(body.tags !== undefined && { tags: body.tags }),
						},
					},
					{ ignoreDefaultFilters: true },
				)
				.lean()
				.exec();

			return updatedProduct;
		} catch (error) {
			if (newFiles.length > 0) await this.uploadService.deleteMultipleFiles(newFiles);
			throw error;
		}
	}

	async deleteProductAdmin(productId: Id) {
		const product = await this.productRepo.findById(productId, { ignoreDefaultFilters: true }).lean().exec();
		if (!product) throw new NotFoundException('Product not found.');

		if (product.images && product.images.length > 0) {
			const filesToDelete = product.images
				.filter((img) => img?.id)
				.map((image) => ({ id: image.id as string, resourceType: 'image' as const }));

			if (filesToDelete.length > 0) {
				await this.uploadService.deleteMultipleFiles(filesToDelete);
			}
		}

		await this.productRepo
			.findByIdAndUpdate(productId, { $set: { deletedAt: new Date() } })
			.lean()
			.exec();
	}

	async togglePublishedAdmin(productId: Id) {
		const product = await this.productRepo.findById(productId, { ignoreDefaultFilters: true }).lean().exec();
		if (!product) throw new NotFoundException('Product not found.');

		const newState = !product.publishedAt ? new Date() : null;

		const updated = await this.productRepo
			.findOneAndUpdate({ _id: productId }, { $set: { publishedAt: newState } })
			.lean<IProduct>()
			.exec();

		return updated;
	}
}
