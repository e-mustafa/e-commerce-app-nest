import { generalFields } from '@/common/validation';
import z from 'zod';

// const { defaultLimit = 10, defaultOrder = SortOrderEnum.DESC } = appConfig().favorite || {};

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

// export const favoriteQuerySchema = {
// 	query: z.object({
// 		page: generalFields.page.default(1).optional(),
// 		limit: generalFields.limit.default(defaultLimit).optional(),
// 		order: generalFields.order.default(defaultOrder).optional(),
// 	}),
// };

// export type FavoriteQueryDTO = z.infer<typeof favoriteQuerySchema.query>;
