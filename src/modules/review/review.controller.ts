import { AUser, Auth } from '@/common/decorators';
import type { Id, IFile, IUserBody } from '@/common/types';
import { appConfig } from '@/config';
import { Cache, InvalidateCache } from '@/providers/redis/decorators';
import { UseUpload } from '@/providers/upload';
import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UploadedFiles } from '@nestjs/common';
import type * as dto from './review.dto';
import * as S from './review.dto';
import { ReviewService } from './review.service';

export const routes = {
	base: '/',

	createReview: '/products/:productId/reviews',
	listProductReviews: '/products/:productId/reviews',

	listReviews: '/reviews/:productId', // admin

	getReview: 'reviews/:reviewId',
	updateReview: 'reviews/:reviewId',
	deleteReview: 'reviews/:reviewId',
} as const;

export const invalidations = ['/reviews/', '/products/:productId/reviews', '/reviews/:reviewId'];

@Controller(routes.base)
export class ReviewController {
	constructor(private readonly service: ReviewService) {}

	@Auth(true)
	@Get(['/reviews/', routes.listReviews, routes.listProductReviews]) // optional productId param
	@Cache()
	async listReviews(
		@AUser() user: IUserBody,
		@Param({ schema: S.reviewParamProductIdOptSchema.params }) params: dto.ReviewParamsProductIdOptDTO,
		@Query({ schema: S.reviewQuerySchema.query }) query: dto.ReviewQueryDTO,
	) {
		const { data, metadata } = await this.service.listReviews({ user, productId: params.productId, ...query });
		return { metadata, data };
	}

	@Get(routes.getReview)
	@Cache()
	async getReview(@Param({ schema: S.reviewParamIdSchema.params }) params: dto.ReviewParamIdDTO) {
		const data = await this.service.getReview(params.reviewId);
		return { data };
	}

	@Auth()
	@Post(routes.createReview)
	@InvalidateCache(...invalidations)
	@UseUpload({
		fieldName: 'images',
		maxCount: appConfig().review.attachments.maxCount | 2,
		maxSize: appConfig().review.attachments.maxSize,
	})
	async createReview(
		@AUser('_id') userId: Id,
		@Param({ schema: S.createReviewSchema.params }) params: dto.ReviewParamsProductIdDTO,
		@Body({ schema: S.createReviewSchema.body }) body: dto.CreateReviewDTO,
		@UploadedFiles() files: IFile[],
	) {
		const data = await this.service.createReview({
			...(body || {}),
			userId,
			files,
			productId: params.productId,
		});
		return { message: 'Review created successfully', data };
	}

	@Auth()
	@Patch(routes.updateReview)
	@InvalidateCache(...invalidations)
	@UseUpload({
		fieldName: 'images',
		maxCount: appConfig().review.attachments.maxCount | 2,
		maxSize: appConfig().review.attachments.maxSize,
	})
	@Patch(routes.updateReview)
	async updateReview(
		@AUser() userId: Id,
		@Param({ schema: S.updateReviewSchema.params }) params: dto.ReviewParamIdDTO,
		@Body({ schema: S.updateReviewSchema.body }) body: dto.UpdateReviewDTO,
		@UploadedFiles() files: IFile[],
	) {
		console.log({ files });
		const data = await this.service.updateReview({
			...body,
			reviewId: params.reviewId,
			userId,
			files,
		});
		return { message: 'Review Updated successfully', data };
	}

	@Auth()
	@Delete(routes.deleteReview)
	@InvalidateCache(...invalidations)
	async deleteReview(@AUser() user: IUserBody, @Param('reviewId') reviewId: Id) {
		await this.service.deleteReview(user, reviewId);
		return { message: 'Review deleted successfully' };
	}
}
