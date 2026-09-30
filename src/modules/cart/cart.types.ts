import { Id } from '@/common/types';
import { HydratedDocument, Model } from 'mongoose';
import { Cart } from './cart.model';

export interface ICart extends Cart {
	_id: Id;
	id?: string;
	createdAt: Date;
	updatedAt?: Date;
	deletedAt?: Date;
}

export type CartItem = ICart['items'][0];
export type HCart = HydratedDocument<ICart>;
export type CartModel = Model<HCart>;
