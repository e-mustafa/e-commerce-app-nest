import { Id } from '@/common/types';
import { HydratedDocument, Model } from 'mongoose';
import { Review } from './review.model';

export interface IUserImg {
	id: string;
	url: string;
}

export interface IReview extends Review {
	_id: Id;
	id?: string;
	createdAt: Date;
	updatedAt?: Date;
	deletedAt?: Date;
}

export type HReview = HydratedDocument<IReview>;
export type ReviewModel = Model<HReview>;
