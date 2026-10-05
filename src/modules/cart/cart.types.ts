import { Id } from '@/common/types';
import { HydratedDocument, Model } from 'mongoose';
import { IProductGeneral } from '../product';
import { Cart } from './cart.model';

export interface ICart extends Cart {
	_id: Id;
	id?: string;
	createdAt: Date;
	updatedAt?: Date;
	deletedAt?: Date;
}

export type ICartItem = ICart['items'][0];
export type HCart = HydratedDocument<ICart>;
export type CartModel = Model<HCart>;

export type ICartWProduct = ICart & {
	items: ICartItem[] & { product: IProductGeneral }[];
};

export type HCartWProduct = HydratedDocument<
	ICart & {
		items: ICartItem[] & { product: IProductGeneral }[];
	}
>;

export interface ICartResponse {
	cart: ICart;
	hasPriceChanged: boolean;
	priceChangeMessages: string[];
}
