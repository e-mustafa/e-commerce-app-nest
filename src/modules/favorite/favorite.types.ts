import { Id, IUserBody } from '@/common/types';
import { HydratedDocument, Model } from 'mongoose';
import { IProductGeneral } from '../product';
import { Favorite } from './favorite.model';

export interface IFavorite extends Favorite {
	_id: Id;
	id?: string;
	createdAt: Date;
	updatedAt?: Date;
	deletedAt?: Date;
}

export type HFavorite = HydratedDocument<IFavorite>;
export type FavoriteModel = Model<HFavorite>;

export type IFavoriteWProduct = IFavorite & {
	product: IProductGeneral[];
};

export type IFavoriteWData = IFavorite & {
	product: IProductGeneral;
	user: IUserBody;
};
