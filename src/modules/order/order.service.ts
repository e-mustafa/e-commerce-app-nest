import { BadRequestException, NotFoundException } from '@/common/exceptions';
import { IPaginatedResult, IUserBody } from '@/common/types';
import { sortOrderEnum } from '@/providers/database';
import { cachePrefix } from '@/providers/redis/interceptors';
import { RedisService } from '@/providers/redis/redis.service';
import { Injectable } from '@nestjs/common';
import { QueryFilter } from 'mongoose';
import { ICart } from '../cart';
import { CartRepository } from '../cart/cart.repository';
import { CartService } from '../cart/cart.service';
import { ICouponValidationResult } from '../coupon';
import { CouponRepository } from '../coupon/coupon.repository';
import { CouponService } from '../coupon/coupon.service';
import { productGeneralSelect } from '../product';
import { invalidations } from '../product/product.controller.admin';
import { ProductRepository } from '../product/product.repository';
import { AdminRoleEnum, AdminRoles, selectGeneralUserInfo } from '../user';
import { OrderNumberGeneratorService } from './order-number-generator';
import * as I from './order-service.interface';
import { OrderStatusEnum, PaymentMethodEnum } from './order.enums';
import { OrderRepository } from './order.repository';
import type { IOrder, IOrderItem, IOrderWData } from './order.types';

const selectOrderProduct = productGeneralSelect || 'title excerpt images slug price';
const selectOrderItem = `code type value maxDiscountAmount`;

const orderPopulates = [
	{ path: 'user', select: selectGeneralUserInfo },
	{ path: 'items.product', select: selectOrderProduct },
	{ path: 'appliedCoupon', select: selectOrderItem },
];

@Injectable()
export class OrderService {
	constructor(
		private readonly productRepo: ProductRepository,
		private readonly orderRepo: OrderRepository,
		private readonly cartRepo: CartRepository,
		private readonly couponService: CouponService,
		private readonly couponRepo: CouponRepository,
		private readonly cartService: CartService,
		private readonly redisService: RedisService,
		private readonly orderNumberService: OrderNumberGeneratorService,
	) {}

	/**
	 * Create a new user order with full database transaction safety
	 */
	async createOrder({ userId, shippingAddress, couponCode, paymentMethod }: I.ICreateOrderPayload): Promise<IOrderWData> {
		// 1. Retrieve user cart
		const cart: ICart | null = await this.cartRepo.findOne({ user: userId }).lean().exec();
		if (!cart || !cart.items || cart.items.length === 0) {
			throw new NotFoundException('Your cart is empty.');
		}

		// 2. Fetch products associated with cart items
		const products = await this.productRepo.find({ _id: { $in: cart.items.map((i) => i.product) } }).exec();
		if (products.length === 0 || products.length !== cart.items.length) {
			throw new NotFoundException('One or more products were not found.');
		}

		// 3. Verify stock availability
		const unavailableProducts = products.filter((p) => {
			const cartQty = cart.items.find((i) => i.product.toString() === p._id.toString())?.quantity || 1;
			return p.stock === 0 || p.stock < cartQty;
		});

		if (unavailableProducts.length > 0) {
			const productsTitles = unavailableProducts.map((p) => p.title).join(', ');
			throw new BadRequestException(`Insufficient stock for product(s): ${productsTitles}.`);
		}

		const shippingCost = 0;
		const taxAmount = 0;

		// 4. Map cart items to order snapshots
		const itemsToAdd: IOrderItem[] = products.map((p) => {
			const quantity = cart.items.find((i) => i.product.toString() === p._id.toString())?.quantity || 1;
			const priceSnapshot = p.discountPrice || p.price;
			return {
				product: p._id.toString(),
				quantity,
				priceSnapshot,
				subTotal: quantity * priceSnapshot,
			};
		});

		const total = itemsToAdd.reduce((acc, item) => acc + item.subTotal, 0);
		const orderNumber: string = await this.orderNumberService.generateOrderNumber();

		const orderDoc = this.orderRepo.build({
			orderNumber,
			user: userId,
			items: itemsToAdd,
			shippingAddress,
			paymentMethod,
			shippingCost,
			discountAmount: 0,
			taxAmount,
			finalTotal: Number((total + shippingCost + taxAmount).toFixed(2)),
		});

		let couponDiscount: ICouponValidationResult | null = null;
		if (couponCode) {
			couponDiscount = await this.couponService.validateAndCalculateDiscount(userId, couponCode, cart, shippingCost);
			orderDoc.appliedCoupon = couponDiscount.couponId;
			orderDoc.discountAmount = couponDiscount.discountAmount;
			orderDoc.finalTotal = Number((couponDiscount.finalTotal + taxAmount).toFixed(2));
		}

		if (paymentMethod !== PaymentMethodEnum.COD) {
			// TODO: Handle online payment integration
		}

		let createdOrderId: string = '';

		// 5. Perform atomic database write operations within transaction
		await this.orderRepo.withTransaction(async (session) => {
			// Save the order document first
			const savedOrder = await this.orderRepo.save(orderDoc, { session });
			createdOrderId = savedOrder._id.toString();

			// Prepare bulk update operations array
			const stockBulkOperations = itemsToAdd.map((item) => ({
				updateOne: {
					filter: { _id: item.product },
					update: { $inc: { stock: -item.quantity } },
				},
			}));

			// 2. Prepare all async mutation tasks
			const tasks: Promise<unknown>[] = [
				// Clear user cart
				this.cartService.clearCart(userId, session),

				// Stock decrement tasks
				this.productRepo.bulkWrite(stockBulkOperations, { session }),
			];

			// Add coupon increment task if applicable
			if (couponDiscount && couponDiscount.discountAmount > 0) {
				tasks.push(
					this.couponRepo.updateOne(
						{ _id: couponDiscount.couponId },
						{ $inc: { usedCount: 1 }, $push: { usedBy: userId } },
						{ session },
					),
				);
			}

			// 3. Execute all mutation operations concurrently over the transaction session
			await Promise.all(tasks);
		});

		// 4. Invalidate redis cache for all products that were added to the order
		Promise.all(
			itemsToAdd.map((item) => this.redisService.delete(`${cachePrefix}${invalidations}${item.product.toString()}`)),
		);

		// 5. Return fully populated created order
		const newOrder = await this.orderRepo
			.findOne({ _id: createdOrderId, user: userId })
			.lean()
			.populate<IOrderWData>(orderPopulates)
			.exec();

		if (!newOrder) throw new NotFoundException('Order not found after creation.');

		return newOrder;
	}

	/**
	 * List orders with filtering, pagination, and role checks
	 */
	async listOrders({
		user,
		page,
		limit,
		order,
		search,
		userId,
		status,
		paymentMethod,
		paymentStatus,
	}: I.IListOrderPayload): Promise<IPaginatedResult<IOrderWData>> {
		const isAdmin = AdminRoles.includes((user?.role as AdminRoleEnum) || 0);

		const filter: QueryFilter<IOrder> = {};
		if (!isAdmin) {
			filter.user = user._id;
		} else if (userId) {
			filter.user = userId;
		}

		if (status) filter.status = status;
		if (paymentMethod) filter.paymentMethod = paymentMethod;
		if (paymentStatus) filter.paymentStatus = paymentStatus;

		if (search?.trim()) {
			const escapedSearch = search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
			const searchRegex = new RegExp(escapedSearch, 'i');
			filter.$or = [{ orderNumber: searchRegex }, { note: searchRegex }];
		}

		const orders = await this.orderRepo
			.find(filter, { ignoreDefaultFilters: isAdmin })
			.lean()
			.sort({ createdAt: order === sortOrderEnum.ASC ? 1 : -1 })
			.paginate(page, limit)
			.populate<IOrderWData>(orderPopulates)
			.exec();

		return orders;
	}

	/**
	 * Get single order by ID
	 */
	async getOrder(user: IUserBody, orderId: string): Promise<IOrderWData> {
		const isAdmin = AdminRoles.includes((user?.role as AdminRoleEnum) || 0);
		const order = await this.orderRepo
			.findOne({ _id: orderId, ...(isAdmin ? {} : { user: user._id }) }, { ignoreDefaultFilters: isAdmin })
			.lean()
			.populate<IOrderWData>(orderPopulates)
			.exec();

		if (!order) throw new NotFoundException('Order not found.');

		return order;
	}

	/**
	 * Cancel order and restock items via database transaction
	 */
	async cancelOrder(user: IUserBody, orderId: string): Promise<IOrderWData> {
		const isAdmin = AdminRoles.includes((user?.role as AdminRoleEnum) || 0);
		const order = await this.orderRepo
			.findOne({
				_id: orderId,
				deletedAt: null,
				...(isAdmin ? {} : { user: user._id }),
			})
			.exec();

		if (!order) throw new NotFoundException('Order not found.');

		if (
			order.status === OrderStatusEnum.CANCELLED ||
			order.status === OrderStatusEnum.DELIVERED ||
			order.status === OrderStatusEnum.SHIPPED
		) {
			throw new BadRequestException(`Order cannot be cancelled in its current state (${order.status}).`);
		}

		await this.orderRepo.withTransaction(async (session) => {
			order.status = OrderStatusEnum.CANCELLED;
			await this.orderRepo.save(order, { session });

			// Restock product inventory
			if (order.items && order.items.length > 0) {
				const bulkOps = order.items.map((item) => ({
					updateOne: {
						filter: { _id: item.product },
						update: { $inc: { stock: item.quantity || 1 } },
					},
				}));

				await this.productRepo.bulkWrite(bulkOps, { session });
				// 4. Invalidate redis cache for all products that were added to the order
				Promise.all(
					order.items.map((item) =>
						this.redisService.delete(`${cachePrefix}${invalidations}${item.product.toString()}`),
					),
				);
			}
		});

		const updatedOrder = await this.orderRepo
			.findOne({ _id: orderId })
			.lean()
			.populate<IOrderWData>(orderPopulates)
			.exec();

		if (!updatedOrder) throw new NotFoundException('Order not found.');

		return updatedOrder;
	}

	/**
	 * Update order details (Admin)
	 */
	async updateOrderAdmin({ user, orderId, ...body }: I.IUpdateOrderPayload): Promise<IOrderWData> {
		const isAdmin = AdminRoles.includes((user?.role as AdminRoleEnum) || 0);
		const order = await this.orderRepo
			.findOne({ _id: orderId, ...(isAdmin ? {} : { user: user._id }) }, { ignoreDefaultFilters: isAdmin })
			.exec();

		if (!order) throw new NotFoundException('Order not found.');
		if (order.deletedAt) throw new NotFoundException('Order was deleted. Cannot update before recovering.');

		const updatedOrder = await this.orderRepo
			.findOneAndUpdate(
				{ _id: orderId },
				{
					$set: {
						...(body.status !== undefined && { status: body.status }),
						...(body.shippingAddress !== undefined && { shippingAddress: body.shippingAddress }),
						...(body.paymentMethod !== undefined && { paymentMethod: body.paymentMethod }),
						...(body.paymentStatus !== undefined && { paymentStatus: body.paymentStatus }),
						...(body.paymentIntentId !== undefined && { paymentIntentId: body.paymentIntentId }),
						...(body.shippingStatus !== undefined && { shippingStatus: body.shippingStatus }),
						...(body.shippingCost !== undefined && { shippingCost: body.shippingCost }),
						...(body.shippingMethod !== undefined && { shippingMethod: body.shippingMethod }),
						...(body.shippingCarrier !== undefined && { shippingCarrier: body.shippingCarrier }),
						...(body.shippingTrackingNumber !== undefined && { shippingTrackingNumber: body.shippingTrackingNumber }),
					},
				},
			)
			.lean()
			.populate<IOrderWData>(orderPopulates)
			.exec();

		if (!updatedOrder) throw new NotFoundException('Error occurred while updating order, please try again.');
		return updatedOrder;
	}

	/**
	 * Soft delete order (Admin)
	 */
	async deleteOrderAdmin(user: IUserBody, orderId: string): Promise<IOrderWData> {
		const isAdmin = AdminRoles.includes((user?.role as AdminRoleEnum) || 0);
		const order = await this.orderRepo
			.findOne({ _id: orderId, ...(isAdmin ? {} : { user: user._id }) }, { ignoreDefaultFilters: isAdmin })
			.exec();

		if (!order) throw new NotFoundException('Order not found.');
		if (order.deletedAt) throw new NotFoundException('Order is already deleted.');

		const updatedOrder = await this.orderRepo
			.findOneAndUpdate({ _id: orderId, ...(isAdmin ? {} : { user: user._id }) }, { $set: { deletedAt: new Date() } })
			.lean()
			.populate<IOrderWData>(orderPopulates)
			.exec();

		if (!updatedOrder) throw new NotFoundException('Order not found.');

		return updatedOrder;
	}

	/**
	 * Recover soft-deleted order (Admin)
	 */
	async recoverOrderAdmin(user: IUserBody, orderId: string): Promise<IOrderWData> {
		const isAdmin = AdminRoles.includes((user?.role as AdminRoleEnum) || 0);
		const order = await this.orderRepo
			.findOneAndUpdate(
				{
					_id: orderId,
					...(isAdmin ? {} : { user: user._id }),
					$or: [{ deletedAt: { $ne: null } }, { deletedAt: { $exists: false } }],
				},
				{ $set: { deletedAt: null } },
				{ ignoreDefaultFilters: isAdmin },
			)
			.lean()
			.populate<IOrderWData>(orderPopulates)
			.exec();

		if (!order) throw new NotFoundException('Order not found.');

		return order;
	}
}
