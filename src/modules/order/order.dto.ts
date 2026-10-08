import { generalFields } from '@/common/validation';
import { appConfig } from '@/config';
import { sortOrderEnum } from '@/providers/database';
import z from 'zod';
import { couponFields } from '../coupon/coupon.dto';
import { OrderStatusEnum, PaymentMethodEnum, PaymentStatusEnum, ShippingStatusEnum } from './order.enums';

const { defaultLimit = 10, defaultOrder = sortOrderEnum.DESC } = appConfig().order || {};

const addressSchema = z.strictObject({
	street: z.string().min(1, 'Street is required').max(120, 'Street must be at most 120 characters long'),
	city: z.string().min(1, 'City is required').max(60, 'City must be at most 60 characters long'),
	state: z.string().max(60, 'State must be at most 60 characters long').optional(),
	country: z.string().min(1, 'Country is required').max(60, 'Country must be at most 60 characters long'),
	postalCode: z.string().min(1, 'Postal code is required').max(20, 'Postal code must be at most 20 characters long'),
	phone: z.string().min(1, 'Phone is required').max(20, 'Phone must be at most 20 characters long'),
});

export const createOrderSchema = {
	body: z.strictObject({
		shippingAddress: addressSchema,
		// shippingAddress: z.string().min(1, 'Shipping address is required'),
		couponCode: couponFields.code.optional(),
		paymentMethod: z.enum(Object.values(PaymentMethodEnum)).default(PaymentMethodEnum.COD),
	}),
};
export type CreateOrderDTO = z.infer<typeof createOrderSchema.body>;

export const updateOrderSchema = {
	body: z
		.strictObject({
			shippingAddress: addressSchema,
			// couponCode: couponFields.code.optional(),
			status: z.enum(Object.values(OrderStatusEnum)),
			paymentStatus: z.enum(Object.values(PaymentStatusEnum)),
			paymentMethod: z.enum(Object.values(PaymentMethodEnum)),
			paymentIntentId: z.string().optional(),

			shippingStatus: z.enum(Object.values(ShippingStatusEnum)),
			shippingCost: z.number().optional(),
			shippingMethod: z.string(),
			shippingCarrier: z.string(),
			shippingTrackingNumber: z.string(),
		})
		.partial(),

	params: z.object({
		orderId: generalFields.id,
	}),
};
export type UpdateOrderDTO = z.infer<typeof updateOrderSchema.body>;
export type UpdateOrderParamDTO = z.infer<typeof updateOrderSchema.params>;

export const getOrderQuerySchema = {
	query: z.object({
		page: generalFields.page.default(1),
		limit: generalFields.limit.default(defaultLimit),
		order: generalFields.order.default(defaultOrder),
		search: generalFields.search.optional(),
		userId: generalFields.id.optional(),
		status: z.enum(Object.values(OrderStatusEnum)).optional(),
		paymentStatus: z.enum(Object.values(PaymentStatusEnum)).optional(),
		paymentMethod: z.enum(Object.values(PaymentMethodEnum)).optional(),
	}),
};

export type GetOrderQueryDTO = z.infer<typeof getOrderQuerySchema.query>;
