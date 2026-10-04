import { generalFields } from '@/common/validation';
import { appConfig } from '@/config';
import { sortOrderEnum } from '@/providers/database';
import z from 'zod';

const { defaultLimit = 10, defaultOrder = sortOrderEnum.DESC } = appConfig().review || {};

const reviewFields = {
	title: z
		.string('Title is required')
		.min(2, 'Title must be at least 2 characters long')
		.max(50, 'Title must be at most 50 characters long'),

	comment: z
		.string('Comment is required')
		.min(2, 'Comment must be at least 2 characters long')
		.max(250, 'Comment must be at most 250 characters long'),
	rating: z.coerce.number().min(1).max(5),

	images: z.array(generalFields.file).optional(),
};

export const reviewParamIdSchema = {
	params: z.strictObject({
		reviewId: generalFields.id,
	}),
};
export type ReviewParamIdDTO = z.infer<typeof reviewParamIdSchema.params>;

export const reviewParamProductIdOptSchema = {
	params: z.strictObject({
		productId: generalFields.id.optional(),
	}),
};
export type ReviewParamsProductIdOptDTO = z.infer<typeof reviewParamProductIdOptSchema.params>;

export const createReviewSchema = {
	body: z.strictObject({
		title: reviewFields.title,
		comment: reviewFields.comment,
		rating: reviewFields.rating,
	}),
	params: z.strictObject({ productId: generalFields.id }),
	files: reviewFields.images.optional(),
};
export type CreateReviewDTO = z.infer<typeof createReviewSchema.body>;
export type ReviewParamsProductIdDTO = z.infer<typeof createReviewSchema.params>;

export const vDBImageSchema = z.object({
	id: z.string().min(1, 'Image id is required'),
	url: z.string().min(1, 'Image url is required'),
});

export const updateReviewSchema = {
	body: createReviewSchema.body.extend({ images: z.array(vDBImageSchema).optional() }).partial(),
	files: reviewFields.images.optional(),
	params: z.strictObject({
		reviewId: generalFields.id,
	}),
};
export type UpdateReviewDTO = z.infer<typeof updateReviewSchema.body>;

export const reviewQuerySchema = {
	query: z.object({
		page: generalFields.page.default(1),
		limit: generalFields.limit.default(defaultLimit),
		order: generalFields.order.default(defaultOrder),
		search: generalFields.search.optional(),
		author: generalFields.id.optional(),
	}),
};

export type ReviewQueryDTO = z.infer<typeof reviewQuerySchema.query>;
