import { Id } from '@/common/types';
import { HydratedDocument, Model } from 'mongoose';
import { Brand } from './brand.model';

export interface IUserImg {
	id: string;
	url: string;
}

export interface IBrand extends Brand {
	_id: Id;
	id?: string;
	createdAt: Date;
	updatedAt?: Date;
	deletedAt?: Date;
}

export type HBrand = HydratedDocument<IBrand>;
export type BrandModel = Model<HBrand>;
