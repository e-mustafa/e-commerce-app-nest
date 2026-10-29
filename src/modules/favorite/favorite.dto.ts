import { generalFields } from '@/common/validation';
import { appConfig } from '@/config';
import { SortOrderEnum } from '@/providers/database';
import z from 'zod';

const { defaultLimit = 10, defaultOrder = SortOrderEnum.DESC } = appConfig().favorite || {};

export const addToFavoriteSchema = {
	body: z.strictObject({
		productId: generalFields.id,
	}),
};
export type AddToFavoriteDTO = z.infer<typeof addToFavoriteSchema.body>;

export const syncFavoriteSchema = {
	body: z.strictObject({
		products: z.array(generalFields.id).min(1, 'Favorite products are required'), //.max(50, 'Favorite cannot exceed 50 items'),
	}),
};
export type SyncFavoriteDTO = z.infer<typeof syncFavoriteSchema.body>;

export const getFavoriteQuerySchema = {
	query: z.object({
		page: generalFields.page.default(1),
		limit: generalFields.limit.default(defaultLimit),
		order: generalFields.order.default(defaultOrder),
	}),
};

export type GetFavoriteQueryDTO = z.infer<typeof getFavoriteQuerySchema.query>;
