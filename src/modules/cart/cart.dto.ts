import { generalFields } from '@/common/validation';
import { appConfig } from '@/config';
import { SortOrderEnum } from '@/providers/database';
import z from 'zod';

const { defaultLimit = 10, defaultOrder = SortOrderEnum.DESC } = appConfig().cart || {};

export const addToCartSchema = {
	body: z.strictObject({
		productId: generalFields.id,
		quantity: z.int('Quantity must be an integer').min(1, 'Quantity must be at least 1').default(1),
	}),
};
export type AddToCartDTO = z.infer<typeof addToCartSchema.body>;

export const syncCartSchema = {
	body: z.strictObject({
		items: z.array(addToCartSchema.body).min(1, 'Cart items is required').max(50, 'Cart cannot exceed 50 items'),
	}),
};
export type SyncCartDTO = z.infer<typeof syncCartSchema.body>;

export const cartQuerySchema = {
	query: z.object({
		page: generalFields.page.default(1).optional(),
		limit: generalFields.limit.default(defaultLimit).optional(),
		order: generalFields.order.default(defaultOrder).optional(),
	}),
};

export type CartQueryDTO = z.infer<typeof cartQuerySchema.query>;
