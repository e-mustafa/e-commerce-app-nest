import { Id } from '@/common/types';
import { HydratedDocument, Model } from 'mongoose';
import { Product } from './product.model';

export interface IProduct extends Product {
	_id: Id;
	id?: string;
	createdAt: Date;
	updatedAt?: Date;
	deletedAt?: Date;
}

export type HProduct = HydratedDocument<IProduct>;
export type ProductModel = Model<IProduct>;

export interface IProductGeneral extends Pick<
	IProduct,
	'_id' | 'id' | 'slug' | 'title' | 'images' | 'price' | 'discountPrice' | 'category' | 'brand' | 'publishedAt'
> {}

export interface IProductMin extends Pick<IProduct, '_id' | 'id' | 'slug' | 'title' | 'images'> {}