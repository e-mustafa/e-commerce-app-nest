import { generalFields } from '@/common/validation';
import { appConfig } from '@/config';
import { sortOrderEnum } from '@/providers/database';
import z from 'zod';
import { couponApplicableOnTypes, CouponTypeEnum, couponTypes } from './coupon.enums';

const { defaultLimit = 10, defaultOrder = sortOrderEnum.DESC } = appConfig().coupon || {};

export const couponFields = {
	code: z
		.string('Code is required')
		.regex(/^[A-Z0-9]+$/, 'Code must be alphanumeric and uppercase')
		.trim()
		.min(2, 'Code must be at least 2 characters long')
		.max(50, 'Code must be at most 50 characters long')
		.uppercase(),

	type: z.enum(couponTypes, 'Type is required'),
	value: z.coerce.number().min(0.1, 'Value must be greater than 0'),

	description: z
		.string('Description is required')
		.min(3, 'Description must be at least 3 characters long')
		.max(200, 'Description must be at most 200 characters long')
		.optional(),

	applicableOn: z.enum(couponApplicableOnTypes, 'Applicable on is required'),

	createdBy: generalFields.id,

	minPurchaseAmount: z.coerce.number().default(0),
	maxDiscountAmount: z.coerce.number(),
	usageLimit: z.coerce.number().default(100),
	usagePerUser: z.coerce.number(),

	// isPublished: z.boolean().default(true),
	// publishedAt: z.coerce.date().nullable().optional(),

	startDate: z.coerce.date().default(new Date()),
	endDate: z.coerce.date(),
	products: z.array(generalFields.id).optional(),
	categories: z.array(generalFields.id).optional(),
	brands: z.array(generalFields.id).optional(),

	isActive: z.boolean().default(true),
	order: z.number().default(0),
};

const couponSchema = z.strictObject({
	code: couponFields.code,
	type: couponFields.type,
	value: couponFields.value,
	description: couponFields.description.optional(),
	applicableOn: couponFields.applicableOn,
	createdBy: couponFields.createdBy,
	minPurchaseAmount: couponFields.minPurchaseAmount,
	maxDiscountAmount: couponFields.maxDiscountAmount,
	usageLimit: couponFields.usageLimit,
	usagePerUser: couponFields.usagePerUser,
	startDate: couponFields.startDate,
	endDate: couponFields.endDate,
	isActive: couponFields.isActive,
	products: couponFields.products,
	categories: couponFields.categories,
	brands: couponFields.brands,
	order: couponFields.order,
});

export const couponParamIdSchema = {
	params: z.strictObject({
		couponId: generalFields.id,
	}),
};
export type CouponParamIdDTO = z.infer<typeof couponParamIdSchema.params>;

export const couponParamCodeSchema = {
	params: z.strictObject({
		code: couponFields.code,
	}),
};
export type CouponParamCodeDTO = z.infer<typeof couponParamCodeSchema.params>;

export const createCouponSchema = {
	body: couponSchema
		.refine(
			(data) => {
				if (data.type === CouponTypeEnum.PERCENTAGE && data.value > 100) {
					return false;
				}
				return true;
			},
			{ message: 'Percentage value cannot exceed 100' },
		)
		.refine(
			(data) => {
				if (data.startDate && data.endDate && data.startDate > data.endDate) {
					return false;
				}
				return true;
			},
			{ error: 'Start date cannot be after end date' },
		)
		.refine(
			(data) => {
				if (data.minPurchaseAmount && data.maxDiscountAmount && data.minPurchaseAmount > data.maxDiscountAmount) {
					return false;
				}
				return true;
			},
			{ error: 'Minimum purchase amount cannot be greater than maximum discount amount' },
		),
};
export type CreateCouponDTO = z.infer<typeof createCouponSchema.body>;

export const updateCouponSchema = {
	body: couponSchema.partial(),
	params: z.strictObject({
		couponId: generalFields.id,
	}),
};
export type UpdateCouponDTO = z.infer<typeof updateCouponSchema.body>;

export const couponQuerySchema = {
	query: z.object({
		page: generalFields.page.default(1),
		limit: generalFields.limit.default(defaultLimit),
		order: generalFields.order.default(defaultOrder),
		search: generalFields.search.optional(),
		isPublished: z.coerce.boolean().optional(),
	}),
};

export type CouponQueryDTO = z.infer<typeof couponQuerySchema.query>;
