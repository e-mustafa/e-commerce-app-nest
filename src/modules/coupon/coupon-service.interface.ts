import { Id, IUserBody } from '@/common/types';
import type * as dto from './coupon.dto';

export interface ICreateCouponPayload extends dto.CreateCouponDTO {
	userId: Id;
}

export interface IUpdateCouponPayload extends dto.UpdateCouponDTO {
	userId: Id;
	couponId: string;
}

export interface IListCouponPayload extends dto.CouponQueryDTO {
	user: IUserBody;
}
