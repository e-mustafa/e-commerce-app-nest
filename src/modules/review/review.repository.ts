import { Id } from '@/common/types';
import { BaseRepository } from '@/providers/database/base.repository';
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Review } from './review.model';
import { HReview, RatingAggregateResult, type ReviewModel } from './review.types';

@Injectable()
export class ReviewRepository extends BaseRepository<HReview> {
	constructor(@InjectModel(Review.name) reviewModel: ReviewModel) {
		super(reviewModel);
	}

	async calcAverageRatings(productId: Id): Promise<RatingAggregateResult | null> {
		const stats = await this.aggregate<RatingAggregateResult>([
			// match product
			{ $match: { product: productId } },

			// group by product
			{
				$group: {
					_id: '$product',
					ratingCount: { $sum: 1 },
					ratingsAverage: { $avg: '$rating' },
				},
			},
		]);

		console.log('stats', stats);
		return stats[0] || null;
	}
}
