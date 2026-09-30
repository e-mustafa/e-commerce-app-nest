import { Id } from '@/common/types';
import { BaseRepository } from '@/providers/database/base.repository';
import { IQueryOptions } from '@/providers/database/query-builder';
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { isValidObjectId, QueryFilter } from 'mongoose';
import { Product } from './product.model';
import { type ProductModel, HProduct, IProduct } from './product.types';

@Injectable()
export class ProductRepository extends BaseRepository<HProduct> {
	protected activeFilter: QueryFilter<HProduct> = {
		publishedAt: { $ne: null, $lt: new Date() },
		$or: [{ deletedAt: { $exists: false } }, { deletedAt: null }],
	};

	constructor(@InjectModel(Product.name) productModel: ProductModel) {
		super(productModel);
	}

	protected override getDefaultFilter(): QueryFilter<HProduct> {
		return this.activeFilter;
	}

	/**
	 * Finds a product by its ObjectId or unique slug.
	 * Safely checks if the provided id is a valid ObjectId before querying `_id` to avoid CastError.
	 */
	findByIdOrSlug(id: Id, options?: IQueryOptions): Promise<IProduct | null> {
		const isObjectId = isValidObjectId(id);
		const filter: QueryFilter<HProduct> = isObjectId
			? { $or: [{ _id: id }, { slug: id as string }] }
			: { slug: id as string };

		return this.findOne(filter, options).lean<IProduct>().exec();
	}

	/**
	 * Finds a product by its ObjectId or unique slug.
	 * Safely checks if the provided id is a valid ObjectId before querying `_id` to avoid CastError.
	 */
	// findByIdOrSlug(id: Id, options?: IQueryOptions) {
	// 	const isObjectId = isValidObjectId(id);
	// 	const filter: QueryFilter<HProduct> = isObjectId
	// 		? { $or: [{ _id: id }, { slug: id as string }] }
	// 		: { slug: id as string };

	// 	return this.findOne(filter, options);
	// 	return this;
	// }

	/**
	 * Checks whether a product exists with the given slug or name, bypassing default filters.
	 */
	isExist(slug: string, name: string, options?: IQueryOptions): Promise<IProduct | null> {
		return this.findOne({ $or: [{ slug }, { name }] }, { ...options, ignoreDefaultFilters: true })
			.lean<IProduct>()
			.exec();
	}
}
