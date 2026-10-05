import { AUser, AuthAdmin } from '@/common/decorators';
import type { Id, IUserBody } from '@/common/types';
import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import type * as dto from './coupon.dto';
import * as S from './coupon.dto';
import { CouponService } from './coupon.service';

const routes = {
	base: 'admin/coupons',

	listCoupons: '/',
	createCoupon: '/',

	getCoupon: '/:couponId',
	updateCoupon: '/:couponId',
	deleteCoupon: '/:couponId',

	togglePublished: '/:couponId/publish',
};

@AuthAdmin() //[RoleEnum.ADMIN, RoleEnum.SUPER_ADMIN]
@Controller(routes.base)
export class CouponAdminController {
	constructor(private readonly service: CouponService) {}

	@Get(routes.listCoupons)
	async listCoupons(@AUser() user: IUserBody, @Query({ schema: S.couponQuerySchema.query }) query: dto.CouponQueryDTO) {
		const { data, metadata } = await this.service.listCoupons({ user, ...query });
		return { metadata, data };
	}

	@Get(routes.getCoupon)
	async getCoupon(@AUser() user: IUserBody, @Param({ schema: S.couponParamIdSchema.params }) params: dto.CouponParamIdDTO) {
		const data = await this.service.getCoupon(user, params.couponId);
		return { data };
	}

	@Post(routes.createCoupon)
	async createCoupon(@AUser('_id') userId: Id, @Body({ schema: S.createCouponSchema.body }) body: dto.CreateCouponDTO) {
		const data = await this.service.createCouponAdmin({ ...body, userId });
		return { message: 'Coupon created successfully', data };
	}

	@Patch(routes.updateCoupon)
	async updateCoupon(
		@AUser('_id') userId: Id,
		@Param('couponId') couponId: string,
		@Body({ schema: S.updateCouponSchema.body }) body: dto.UpdateCouponDTO,
	) {
		const data = await this.service.updateCouponAdmin({ ...body, couponId, userId });
		return { message: 'Coupon Updated successfully', data };
	}

	@Delete(routes.deleteCoupon)
	async deleteCoupon(@Param('couponId') couponId: Id) {
		const data = await this.service.deleteCouponAdmin(couponId);
		return { message: 'Coupon deleted successfully', data };
	}

	@Patch(routes.togglePublished)
	async togglePublished(@Param('couponId') couponId: Id) {
		const data = await this.service.togglePublishedAdmin(couponId);
		return { message: ` ${data?.isActive ? 'Active' : 'Inactive'} Coupon successfully`, data };
	}
}
