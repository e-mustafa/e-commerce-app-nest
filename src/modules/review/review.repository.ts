import { BaseRepository } from '@/providers/database/base.repository';
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Review } from './review.model';
import { HReview, type ReviewModel } from './review.types';

@Injectable()
export class ReviewRepository extends BaseRepository<HReview> {
	constructor(@InjectModel(Review.name) reviewModel: ReviewModel) {
		super(reviewModel);
	}
}
