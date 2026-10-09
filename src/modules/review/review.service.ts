import { ConflictException, NotFoundException } from '@/common/exceptions';
import { Id, IUserBody } from '@/common/types';
import { sortOrderEnum } from '@/providers/database/query.enum';
import { DBImage } from '@/providers/database/schemas';
import { type IUploadService, TDeleteAttachment, UPLOAD_SERVICE, UploadPathBuilder } from '@/providers/upload';
import { Inject, Injectable } from '@nestjs/common';
import { QueryFilter } from 'mongoose';
import { ProductRepository } from '../product/product.repository';
import { AdminRoleEnum, AdminRoles } from '../user';
import type * as I from './review-service.interface';
import { ReviewRepository } from './review.repository';
import { IReview } from './review.types';

@Injectable()
export class ReviewService {
	constructor(
		private readonly reviewRepo: ReviewRepository,
		private readonly productRepo: ProductRepository,
		@Inject(UPLOAD_SERVICE) private readonly uploadService: IUploadService,
	) {}

	/**
	 * Recalculates product rating statistics and synchronizes with Product document.
	 */
	private async syncProductRatingStats(productId: Id): Promise<void> {
		const stats = await this.reviewRepo.calcAverageRatings(productId);
		if (!stats) return;
		await this.productRepo.updateRatingStats(productId, stats);
	}

	async listReviews({ user, productId, page, limit, order, search, author }: I.IListReviewPayload) {
		const isAdmin = AdminRoles.includes((user?.role as AdminRoleEnum) || 0);

		if (!productId && !isAdmin) {
			throw new ConflictException('Product ID is required to list reviews.');
		}

		const filter: QueryFilter<IReview> = {};
		if (productId) filter.product = productId;
		if (author && isAdmin) filter.author = author;

		if (search?.trim()) {
			// Escape special regex characters to prevent regex injection (ReDoS)
			const escapedSearch = search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
			const searchRegex = { $regex: escapedSearch, $options: 'i' };
			filter.$or = [{ title: searchRegex }, { comment: searchRegex }];
		}

		const reviews = await this.reviewRepo
			.find(filter)
			.lean()
			.sort({ createdAt: order === sortOrderEnum.ASC ? 1 : -1 })
			.paginate(page, limit)
			.exec();

		return reviews;
	}

	async getReview(reviewId: Id) {
		const review = await this.reviewRepo.findById(reviewId).lean<IReview>().exec();
		if (!review) throw new NotFoundException('Review not found.');

		return review;
	}

	async createReview(payload: I.ICreateReviewPayload) {
		const { userId, productId, files, ...body } = payload;
		const isExist = await this.reviewRepo.exists({ product: productId, author: userId });
		if (isExist) {
			throw new ConflictException('You have already submitted a review for this product.');
		}

		let uploadImages: DBImage[] = [];
		let newFiles: TDeleteAttachment[] = [];

		if (files && files.length > 0) {
			const location = UploadPathBuilder.getProductLocation(productId, 'reviews');
			const uploaded = await this.uploadService.uploadMultipleFiles(files, location.folder);
			uploadImages = uploaded.map((file) => ({ id: file.id, url: file.url }));
			newFiles = uploaded;
		}

		try {
			const review = await this.reviewRepo.create({
				rating: body.rating || 0,
				title: body.title,
				comment: body.comment,
				author: userId,
				product: productId,
				images: uploadImages,
			});

			// Recalculate and update ratings after creation
			await this.syncProductRatingStats(productId);

			return review;
		} catch (error) {
			if (newFiles.length > 0) {
				await this.uploadService.deleteMultipleFiles(
					newFiles?.map((file) => ({ ...file, resourceType: 'image' as const })),
				);
			}
			throw error;
		}
	}

	async updateReview(payload: I.IUpdateReviewPayload) {
		const { userId, reviewId, files, ...body } = payload;
		const { title, comment, rating, images } = body || {};
		console.log({ files });

		const review = await this.reviewRepo.findOne({ _id: reviewId, author: userId }).lean().exec();
		if (!review) {
			throw new NotFoundException('Review not found.');
		}

		let uploadImages: DBImage[] = [];
		let newFiles: TDeleteAttachment[] = [];
		let removeFiles: TDeleteAttachment[] = [];

		if (files && files.length > 0) {
			removeFiles = review.images?.map((img) => ({ ...img, resourceType: 'image' as const })) || [];
		}

		if (files && files.length > 0) {
			const location = UploadPathBuilder.getProductLocation(review.product.toString(), 'reviews');
			const uploaded = await this.uploadService.uploadMultipleFiles(files, location.folder, 'reviews');
			uploadImages = uploaded.map((file) => ({ id: file.id, url: file.url }));
			newFiles = uploaded;
		}

		try {
			const updatedReview = await this.reviewRepo
				.findOneAndUpdate(
					{ _id: reviewId },
					{
						$set: {
							...(title !== undefined && { title }),
							...(comment !== undefined && { comment }),
							...(rating !== undefined && { rating }),
							...(images !== undefined && { images }),
							...(uploadImages.length > 0 && { images: [...(images || []), ...uploadImages] }),
						},
					},
				)
				.lean<IReview>()
				.exec();

			if (removeFiles.length > 0) await this.uploadService.deleteMultipleFiles(removeFiles);

			// Recalculate and update ratings after creation
			await this.syncProductRatingStats(updatedReview.product);

			return updatedReview;
		} catch (error) {
			if (newFiles.length > 0) await this.uploadService.deleteMultipleFiles(newFiles);
			throw error;
		}
	}

	async deleteReview(user: IUserBody, reviewId: Id) {
		const review = await this.reviewRepo.findById(reviewId).lean().exec();
		if (
			!review ||
			(review.author.toString() !== user._id.toString() && !AdminRoles.includes((user?.role as AdminRoleEnum) || 0))
		) {
			throw new NotFoundException('Review not found.');
		}

		const deleteTask: Promise<void>[] = [];
		if (review.images && review.images.length > 0) {
			const removeFiles = review.images?.map((img) => ({ ...img, resourceType: 'image' as const })) || [];
			deleteTask.push(this.uploadService.deleteMultipleFiles(removeFiles));
		}

		const [deleted] = await Promise.all([this.reviewRepo.deleteOne({ _id: reviewId }), ...deleteTask]);

		// Recalculate and update ratings after creation
		await this.syncProductRatingStats(review.product);
		return deleted;
	}
}
