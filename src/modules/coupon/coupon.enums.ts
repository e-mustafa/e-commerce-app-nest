export const CouponTypeEnum = {
	FIXED: 'FIXED',
	PERCENTAGE: 'PERCENTAGE',
	FREE_SHIPPING: 'FREE_SHIPPING',
} as const;

export type CouponTypeEnum = (typeof CouponTypeEnum)[keyof typeof CouponTypeEnum];
export const couponTypes = Object.values(CouponTypeEnum);

export const CouponStatusEnum = {
	ACTIVE: 'ACTIVE',
	INACTIVE: 'INACTIVE',
	EXPIRED: 'EXPIRED',
} as const;

export type CouponStatusEnum = (typeof CouponStatusEnum)[keyof typeof CouponStatusEnum];

export const CouponApplicableOnEnum = {
	ALL_PRODUCTS: 'ALL_PRODUCTS',
	SPECIFIC_PRODUCTS: 'SPECIFIC_PRODUCTS',
	SPECIFIC_BRANDS: 'SPECIFIC_BRANDS',
	SPECIFIC_CATEGORIES: 'SPECIFIC_CATEGORIES',
	// SPECIFIC_COLLECTIONS: 'SPECIFIC_COLLECTIONS',
	MINIMUM_PURCHASE: 'MINIMUM_PURCHASE',
} as const;

export type CouponApplicableOnEnum = (typeof CouponApplicableOnEnum)[keyof typeof CouponApplicableOnEnum];

export const couponApplicableOnTypes = Object.values(CouponApplicableOnEnum);

