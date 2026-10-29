import { NotFoundException } from '@/common/exceptions';
import { Id } from '@/common/types';
import { IQueryOptions } from '@/providers/database/query-builder';
import { Injectable } from '@nestjs/common';
import { IProduct, productGeneralSelect } from '../product';
import { ProductRepository } from '../product/product.repository';
import type { IAddToFavoritePayload, ISyncFavoritePayload } from './favorite-service.interface';
import { FavoriteRepository } from './favorite.repository';
import type { HFavorite, IFavoriteWProduct } from './favorite.types';

const selectFavoriteProduct = productGeneralSelect || 'title excerpt images slug price';

@Injectable()
export class FavoriteService {
	constructor(
		private readonly productRepo: ProductRepository,
		private readonly favoriteRepo: FavoriteRepository,
	) {}

	private async getRawFavorite(userId: Id): Promise<HFavorite> {
		let favorite = await this.favoriteRepo.findOne({ user: userId }).exec();
		if (!favorite) {
			return await this.favoriteRepo.create({ user: userId });
		}
		return favorite;
	}

	/**
	 * Retrieves favorite and dynamically updates item prices against database state.
	 */
	async getFavorite(userId: Id): Promise<IFavoriteWProduct | null> {
		const favorite = await this.favoriteRepo
			.findOne({ user: userId })
			.populate<IFavoriteWProduct>({
				path: 'products',
				select: selectFavoriteProduct,
			})
			.exec();

		if (!favorite) {
			// throw new NotFoundException('Favorite is empty.');
			return null; // frontend should show empty state for favorite list
		}

		return favorite;
	}

	async addToFavorite({ userId, productId }: IAddToFavoritePayload) {
		const product = await this.productRepo.findById(productId).lean<IProduct>().exec();
		if (!product) throw new NotFoundException('Product not found.');

		const favorite = await this.getRawFavorite(userId);
		const newFavorite = await this.favoriteRepo
			.findByIdAndUpdate(favorite._id, { $addToSet: { products: productId } })
			.lean()
			.populate({ path: 'products', select: selectFavoriteProduct })
			.exec();

		return newFavorite;
	}

	async removeProduct(userId: Id, productId: Id) {
		const updated = await this.favoriteRepo
			.findOneAndUpdate({ user: userId }, { $pull: { products: productId } })
			.lean()
			.populate({ path: 'products', select: selectFavoriteProduct })
			.exec();

		if (!updated) throw new NotFoundException('Favorite list is empty.');
		return updated;
	}

	async syncFavorite({ userId, products }: ISyncFavoritePayload) {
		const productsData = await this.productRepo
			.find({ _id: { $in: products } })
			.lean<IProduct[]>()
			.exec();

		if (productsData.length === 0) throw new NotFoundException('Products not found.');

		const favorite = await this.getRawFavorite(userId);

		const newFavorite = await this.favoriteRepo
			.findByIdAndUpdate(favorite._id, { $addToSet: { products } })
			.lean()
			.populate({ path: 'products', select: selectFavoriteProduct })
			.exec();

		if (!newFavorite) throw new NotFoundException('Favorite list is empty.');
		return newFavorite;
	}

	async clearFavorite(userId: Id, options?: IQueryOptions) {
		console.log(userId);
		const favorite = await this.favoriteRepo.findOne({ user: userId }, options).exec();
		console.log({ favorite });
		if (!favorite) return true;
		favorite.products = [];
		return await favorite.save();
	}
}
