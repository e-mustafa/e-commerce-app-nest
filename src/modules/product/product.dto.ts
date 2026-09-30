import { generalFields } from '@/common/validation';
import { appConfig } from '@/config';
import { sortOrderEnum } from '@/providers/database/query.enum';
import z from 'zod';

const { defaultLimit = 10, defaultOrder = sortOrderEnum.DESC } = appConfig().product || {};

const productFields = {
	title: z
		.string({ error: 'Title is required' })
		.min(2, 'Title must be at least 2 characters long')
		.max(100, 'Title must be at most 100 characters long'),

	slug: generalFields.slug.optional(),

	sku: z
		.string({ error: 'Product SKU is required' })
		.min(2, 'Product SKU must be at least 2 characters long')
		.max(100, 'Product SKU must be at most 100 characters long')
		.optional(),

	excerpt: z
		.string({ error: 'Short Description is required' })
		.min(3, 'Short Description must be at least 3 characters long')
		.max(200, 'Short Description must be at most 200 characters long'),

	description: z
		.string({ error: 'Description is required' })
		.min(3, 'Description must be at least 3 characters long')
		.max(50000, 'Description must be at most 50000 characters long')
		.optional(),

	model: z
		.string({ error: 'Short Description is required' })
		.min(2, 'Short Description must be at least 2 characters long')
		.max(100, 'Short Description must be at most 100 characters long')
		.optional(),

	price: z.coerce.number({ error: 'Price is required' }).min(0, 'Price cannot be negative'),
	discountPrice: z.number({ error: 'Discount Price is required' }).min(0, 'Discount Price cannot be negative').optional(),
	costPrice: z.number({ error: 'Cost Price is required' }).min(0, 'Cost Price cannot be negative').optional(),

	stock: z.number({ error: 'Stock is required' }).min(0, 'Stock cannot be negative'),
	// stockType: z.enum(['fixed', 'percentage'], { error: 'Stock Type is required' }),
	stockType: z.string('Stock Type is required').min(1, 'Stock Type is required').optional(),

	maxOrderSell: z.number({ error: 'Max Order Sell is required' }).min(0, 'Max Order Sell cannot be negative').optional(),
	minWarnQuantity: z
		.number({ error: 'Min Warn Quantity is required' })
		.min(0, 'Min Warn Quantity cannot be negative')
		.optional(),

	brand: generalFields.id,
	category: generalFields.id,
	tags: z.array(z.string().min(1, 'Tag is required')).optional(),

	isPublished: z.boolean().default(true),
	publishedAt: z.coerce.date().nullable().optional(),

	order: z.number().default(0),

	cover: generalFields.file,
	images: z.array(generalFields.file).optional(),
};

export const productParamIdSchema = {
	params: z.strictObject({
		productId: generalFields.id,
	}),
};
export type ProductParamIdDTO = z.infer<typeof productParamIdSchema.params>;

export const productParamIdentifierSchema = {
	params: z.strictObject({
		// Identifier can be either a valid Mongo ObjectId or a valid Slug
		identifier: z.union([generalFields.id, generalFields.slug], {
			error: 'Product parameter must be a valid MongoDB ObjectId or Slug',
		}),
	}),
};

export type ProductParamIdentifierDTO = z.infer<typeof productParamIdentifierSchema.params>;

export const createProductSchema = {
	body: z.strictObject({
		title: productFields.title,
		slug: productFields.slug,
		sku: productFields.sku,
		// model: productFields.model,
		excerpt: productFields.excerpt,
		description: productFields.description,

		price: productFields.price,
		discountPrice: productFields.discountPrice,
		costPrice: productFields.costPrice,

		stock: productFields.stock,
		stockType: productFields.stockType,
		maxOrderSell: productFields.maxOrderSell,
		minWarnQuantity: productFields.minWarnQuantity,

		brand: productFields.brand,
		category: productFields.category,
		tags: productFields.tags,

		publishedAt: productFields.publishedAt,
		isPublished: productFields.isPublished,
		order: productFields.order,

		// parentId: generalFields.id.optional(),
	}),
	files: {
		cover: productFields.cover,
		images: productFields.images.optional(),
	},
};
export type CreateProductDTO = z.infer<typeof createProductSchema.body>;

export const updateProductSchema = {
	body: createProductSchema.body.partial(),
	files: {
		images: productFields.images.optional(),
	},
	params: z.strictObject({
		productId: generalFields.id,
	}),
};
export type UpdateProductDTO = z.infer<typeof updateProductSchema.body>;

export const productQuerySchema = {
	query: z.object({
		page: generalFields.page.default(1),
		limit: generalFields.limit.default(defaultLimit),
		order: generalFields.order.default(defaultOrder),
		search: generalFields.search.optional(),
		isPublished: z.coerce.boolean().optional(),
		category: generalFields.id.optional(),
		brand: generalFields.id.optional(),
		tag: productFields.tags.optional(),

		price: productFields.price.optional(),
		stock: productFields.stock.optional(),
		stockType: productFields.stockType.optional(),

		createdBy: generalFields.id.optional(), // only for admin
	}),
};

export type ProductQueryDTO = z.infer<typeof productQuerySchema.query>;
