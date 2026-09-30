import { generalFields } from '@/common/validation';
import { appConfig } from '@/config';
import { sortOrderEnum } from '@/providers/database';
import z from 'zod';

const { defaultLimit = 10, defaultOrder = sortOrderEnum.DESC } = appConfig().brand || {};

const brandFields = {
	name: z
		.string({ error: 'Name is required' })
		.min(2, 'Name must be at least 2 characters long')
		.max(100, 'Name must be at most 100 characters long'),

	slug: z
		.string({ error: 'Slug is required' })
		.trim()
		.min(2, 'Slug must be at least 2 characters long')
		.max(100, 'Slug must be at most 100 characters long')
		.lowercase(),

	description: z
		.string({ error: 'Description is required' })
		.min(3, 'Description must be at least 3 characters long')
		.max(1000, 'Description must be at most 1000 characters long'),

	createdBy: generalFields.id,
	isPublished: z.boolean().default(true),
	publishedAt: z.coerce.date().nullable().optional(),
	order: z.number().default(0),

	image: generalFields.file,
};

export const brandParamIdSchema = {
	params: z.strictObject({
		brandId: generalFields.id,
	}),
};
export type BrandParamIdDTO = z.infer<typeof brandParamIdSchema.params>;

export const createBrandSchema = {
	body: z.strictObject({
		name: brandFields.name,
		slug: brandFields.slug.optional(),
		description: brandFields.description.optional(),
		// createdBy: brandFields.createdBy,
		isPublished: brandFields.isPublished,
		publishedAt: brandFields.publishedAt,
		order: brandFields.order,

		parentId: generalFields.id.optional(),
	}),
	files: {
		icon: generalFields.file.optional(),
		cover: generalFields.file.optional(),
	},
};
export type CreateBrandDTO = z.infer<typeof createBrandSchema.body>;

export const vDBImageSchema = z.object({
	id: z.string().min(1, 'Image id is required'),
	url: z.string().min(1, 'Image url is required'),
});

export const updateBrandSchema = {
	body: createBrandSchema.body
		.extend({
			icon: vDBImageSchema.optional(),
			cover: vDBImageSchema.optional(),
		})
		.partial(),
	files: {
		icon: generalFields.file.optional(),
		cover: generalFields.file.optional(),
	},
	params: z.strictObject({
		brandId: generalFields.id,
	}),
};
export type UpdateBrandDTO = z.infer<typeof updateBrandSchema.body>;

export const brandQuerySchema = {
	query: z.object({
		page: generalFields.page.default(1),
		limit: generalFields.limit.default(defaultLimit),
		order: generalFields.order.default(defaultOrder),
		search: generalFields.search.optional(),
		isPublished: z.coerce.boolean().optional(),
	}),
};

export type BrandQueryDTO = z.infer<typeof brandQuerySchema.query>;
