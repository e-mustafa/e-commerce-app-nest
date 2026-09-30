import { Id } from '@/common/types';
import { HydratedDocument, Model } from 'mongoose';
import { Category } from './category.model';

export interface IUserImg {
	id: string;
	url: string;
}

export interface ICategory extends Category {
	_id: Id;
	id?: string;
	createdAt: Date;
   updatedAt?: Date;
   deletedAt?: Date;
}

export type HCategory = HydratedDocument<ICategory>;
export type CategoryModel = Model<HCategory>;
