import { registerEnumType } from '@nestjs/graphql';
import { CouponApplicableOnEnum, CouponStatusEnum, CouponTypeEnum } from '../coupon.enums';

registerEnumType(CouponTypeEnum, {
	name: 'CouponTypeEnum',
	description: 'Defines the type of discount applied by the coupon',
});

registerEnumType(CouponStatusEnum, {
	name: 'CouponStatusEnum',
	description: 'Defines the status of the coupon',
});

registerEnumType(CouponApplicableOnEnum, {
	name: 'CouponApplicableOnEnum',
	description: 'Defines the applicable scope of the coupon',
});
