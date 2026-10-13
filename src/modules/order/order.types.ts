import { Id } from '@/common/types';
import { HydratedDocument, Model } from 'mongoose';
import { ICouponGeneral } from '../coupon';
import { IProductGeneral } from '../product';
import { IUserGeneral } from '../user';
import { Order } from './order.model';

export interface IOrder extends Order {
	_id: Id;
	id?: string;
	createdAt: Date;
	updatedAt?: Date;
	deletedAt?: Date;
}

export type IOrderItem = IOrder['items'][0];
export type HOrder = HydratedDocument<IOrder>;
export type OrderModel = Model<IOrder>;

export type IOrderWProduct = IOrder & {
	items: IOrderItem[] & { product: IProductGeneral }[];
};

export type HOrderWProduct = HydratedDocument<
	IOrder & {
		items: IOrderItem[] & { product: IProductGeneral }[];
	}
>;

export type IOrderWData = IOrder & {
	items: IOrderItem[] & { product: IProductGeneral }[];
	user: IUserGeneral;
	appliedCoupon: ICouponGeneral | null;
};

export interface IOrderResponse {
	order: IOrder;
	hasPriceChanged: boolean;
	priceChangeMessages: string[];
}
