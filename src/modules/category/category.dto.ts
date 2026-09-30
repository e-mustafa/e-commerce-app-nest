import { generalFields } from '@/common/validation';
import { appConfig } from '@/config';
import { sortOrderEnum } from '@/providers/database/query.enum';
import z from 'zod';

const { defaultLimit = 10, defaultOrder = sortOrderEnum.DESC } = appConfig().category || {};

const categoryFields = {
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

	images: z.array(generalFields.file).optional(),
};

export const categoryParamIdSchema = {
	params: z.strictObject({
		categoryId: generalFields.id,
	}),
};
export type CategoryParamIdDTO = z.infer<typeof categoryParamIdSchema.params>;

export const createCategorySchema = {
	body: z.strictObject({
		name: categoryFields.name,
		slug: categoryFields.slug.optional(),
		description: categoryFields.description.optional(),
		// createdBy: categoryFields.createdBy,
		isPublished: categoryFields.isPublished,
		publishedAt: categoryFields.publishedAt,
		order: categoryFields.order,

		parentId: generalFields.id.optional(),
	}),
	files: {
		icon: generalFields.file.optional(),
		cover: generalFields.file.optional(),
	},
};
export type CreateCategoryDTO = z.infer<typeof createCategorySchema.body>;

export const DBImageSchema = z.object({
	id: z.string().min(1, 'Image id is required'),
	url: z.string().min(1, 'Image url is required'),
});

export const updateCategorySchema = {
	body: createCategorySchema.body
		.extend({
			icon: DBImageSchema.optional(),
			cover: DBImageSchema.optional(),
		})
		.partial(),
	files: {
		icon: generalFields.file.optional(),
		cover: generalFields.file.optional(),
	},
	params: z.strictObject({
		categoryId: generalFields.id,
	}),
};
export type UpdateCategoryDTO = z.infer<typeof updateCategorySchema.body>;

export const categoryQuerySchema = {
	query: z.object({
		page: generalFields.page.default(1),
		limit: generalFields.limit.default(defaultLimit),
		order: generalFields.order.default(defaultOrder),
		search: generalFields.search.optional(),
		parentId: generalFields.id.optional(),
		isPublished: z.coerce.boolean().optional(),
	}),
};

export type CategoryQueryDTO = z.infer<typeof categoryQuerySchema.query>;
