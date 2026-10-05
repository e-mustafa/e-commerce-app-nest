import { Id } from '@/common/types';
import { HydratedDocument, Model } from 'mongoose';
import { IBrandMin } from '../brand';
import { ICategoryMin } from '../category';
import { IProductMin } from '../product';
import { IUserGeneral } from '../user';
import { Coupon } from './coupon.model';

export interface ICoupon extends Coupon {
	_id: Id;
	id?: string;
	createdAt: Date;
	updatedAt?: Date;
	deletedAt?: Date;
}

export type HCoupon = HydratedDocument<ICoupon>;
export type CouponModel = Model<ICoupon>;

export type ICouponWData = ICoupon & {
	createdBy: IUserGeneral;
	products: IProductMin[];
	categories: ICategoryMin[];
	brands: IBrandMin[];
};

export interface ICouponValidationResult {
	couponId: string;
	code: string;
	discountAmount: number;
	finalTotal: number;
	applicableItemsCount: number;
}
