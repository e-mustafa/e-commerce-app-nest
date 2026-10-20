import { AUser, AuthAdmin } from '@/common/decorators';
import { ValidationPipe } from '@/common/pipes';
import type { IUserBody } from '@/common/types';
import { Args, Query, Resolver } from '@nestjs/graphql';
import { type CouponParamIdDTO, couponParamIdSchema, couponQuerySchema } from '../coupon.dto';
import { Coupon } from '../coupon.model';
import { CouponService } from '../coupon.service';
import { CouponParamsArgs, CouponQueryArgs, PaginatedCoupons } from './coupon.gql.dto';

@Resolver(() => Coupon)
@AuthAdmin()
export class CouponResolver {
	constructor(private readonly service: CouponService) {}

	@Query(() => PaginatedCoupons, { name: 'listCoupons' })
	async listCoupons(
		@AUser() user: IUserBody,
		@Args({ type: () => CouponQueryArgs }, new ValidationPipe(couponQuerySchema.query)) args: CouponQueryArgs,
	) {
		return this.service.listCoupons({ user, ...args });
	}

	@Query(() => Coupon, { name: 'getCoupon' })
	async getCoupon(
		@AUser() user: IUserBody,
		@Args({ type: () => CouponParamsArgs }, new ValidationPipe(couponParamIdSchema.params)) args: CouponParamIdDTO,
	) {
		return this.service.getCoupon(user, args.couponId);
	}

	// @Mutation(() => Coupon, { name: 'createCoupon' })
	// async createCoupon(
	// 	@AUser('_id') userId: Id,
	// 	@Args({ type: () => Coupon }, new ValidationPipe(createCouponSchema.body)) args: CreateCouponDTO,
	// ) {
	// 	return this.service.createCouponAdmin({ userId, ...args });
	// }
}
