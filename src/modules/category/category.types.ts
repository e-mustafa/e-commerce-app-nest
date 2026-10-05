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
export type CategoryModel = Model<ICategory>;

export type ICategoryGeneral = Pick<
	ICategory,
	'_id' | 'name' | 'slug' | 'icon' | 'cover' | 'description' | 'publishedAt' | 'order'
>;

export type ICategoryMin = Pick<ICategory, '_id' | 'name' | 'slug' | 'icon'>;