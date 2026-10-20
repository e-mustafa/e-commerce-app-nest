import { PaginatedResponse } from '@/common/graphql';
import { SortOrderEnum } from '@/providers/database';
import { ArgsType, Field, Int, ObjectType } from '@nestjs/graphql';
import { CouponParamIdDTO, CouponQueryDTO } from '../coupon.dto';
import { Coupon } from '../coupon.model';

@ObjectType()
export class PaginatedCoupons extends PaginatedResponse(Coupon) {}

@ArgsType()
export class CouponQueryArgs implements CouponQueryDTO {
	@Field(() => Int, { nullable: true, defaultValue: 1 })
	page?: number;

	@Field(() => Int, { nullable: true, defaultValue: 10 })
	limit?: number;

	@Field(() => String, { nullable: true, defaultValue: 'asc' })
	order?: SortOrderEnum;

	@Field(() => String, { nullable: true })
	search?: string;

	@Field(() => Boolean, { nullable: true })
	isPublished?: boolean;

	@Field(() => Boolean, { nullable: true })
	isActive?: boolean;
}

@ArgsType()
export class CouponParamsArgs implements CouponParamIdDTO {
	@Field(() => String)
	couponId: string;
}
