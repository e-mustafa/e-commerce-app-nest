import { AUser, Auth } from '@/common/decorators';
import type { IUserBody } from '@/common/types';
import { Controller, Get, Param } from '@nestjs/common';
import type * as dto from './coupon.dto';
import * as S from './coupon.dto';
import { CouponService } from './coupon.service';

const routes = {
	base: 'coupons',

	listCoupons: '/',
	getCoupon: '/:couponId',
	validateCoupon: '/validate/:code',
};

// TODO - add receptor to add domain to uploaded file url - if used local upload
@Controller(routes.base)
export class CouponController {
	constructor(private readonly service: CouponService) {}

	@Auth(true)
	@Get(routes.validateCoupon)
	async validateCoupon(
		@AUser() user: IUserBody,
		@Param({ schema: S.couponParamCodeSchema.params }) params: dto.CouponParamCodeDTO,
	) {
		const data = await this.service.validateCoupon(user, params.code);
		return { data };
	}

	@Get(routes.getCoupon)
	async getCoupon(@AUser() user: IUserBody, @Param({ schema: S.couponParamIdSchema.params }) params: dto.CouponParamIdDTO) {
		const data = await this.service.getCoupon(user, params.couponId);
		return { data };
	}
}
