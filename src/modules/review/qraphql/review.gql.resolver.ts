import { AUser, AuthAdmin } from '@/common/decorators';
import { ValidationPipe } from '@/common/pipes';
import type { IUserBody } from '@/common/types';
import { Args, Query, Resolver } from '@nestjs/graphql';
import { type ReviewParamIdDTO, reviewParamIdSchema, reviewQuerySchema } from '../review.dto';
import { Review } from '../review.model';
import { ReviewService } from '../review.service';
import { PaginatedReviews, ReviewParamsArgs, ReviewQueryArgs } from './review.gql.dto';

@Resolver(() => Review)
@AuthAdmin()
export class ReviewResolver {
	constructor(private readonly service: ReviewService) {}

	@Query(() => PaginatedReviews, { name: 'listReviews' })
	async listReviews(
		@AUser() user: IUserBody,
		@Args({ type: () => ReviewQueryArgs }, new ValidationPipe(reviewQuerySchema.query)) args: ReviewQueryArgs,
	) {
		return this.service.listReviews({ user, ...args });
	}

	@Query(() => Review, { name: 'getReview' })
	async getReview(
		@Args({ type: () => ReviewParamsArgs }, new ValidationPipe(reviewParamIdSchema.params)) args: ReviewParamIdDTO,
	) {
		return this.service.getReview(args.reviewId);
	}

	// @Mutation(() => Review, { name: 'createReview' })
	// async createReview(
	// 	@AUser('_id') userId: Id,
	// 	@Args({ type: () => Review }, new ValidationPipe(createReviewSchema.body)) args: CreateReviewDTO,
	// ) {
	// 	return this.service.createReviewAdmin({ userId, ...args });
	// }
}
