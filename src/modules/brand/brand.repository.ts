import { Id } from '@/common/types';
import { BaseRepository } from '@/providers/database/base.repository';
import { IQueryOptions } from '@/providers/database/query-builder';
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { isValidObjectId, QueryFilter } from 'mongoose';
import { Brand } from './brand.model';
import { type BrandModel, IBrand } from './brand.types';

@Injectable()
export class BrandRepository extends BaseRepository<IBrand> {
	protected activeFilter: QueryFilter<IBrand> = {
		publishedAt: { $ne: null, $lt: new Date() },
		$or: [{ deletedAt: { $exists: false } }, { deletedAt: null }],
	};

	constructor(@InjectModel(Brand.name) brandModel: BrandModel) {
		super(brandModel);
	}

	protected override getDefaultFilter(): QueryFilter<IBrand> {
		return this.activeFilter;
	}

	/**
	 * Finds a brand by its ObjectId or unique slug.
	 * Safely checks if the provided id is a valid ObjectId before querying `_id` to avoid CastError.
	 */
	findByIdOrSlug(id: Id, options?: IQueryOptions): Promise<IBrand | null> {
		const isObjectId = isValidObjectId(id);
		const filter: QueryFilter<IBrand> = isObjectId
			? { $or: [{ _id: id }, { slug: id as string }] }
			: { slug: id as string };

		return this.findOne(filter, options).lean().exec();
	}

	/**
	 * Checks whether a brand exists with the given slug or name, bypassing default filters.
	 */
	isExist(slug: string, name: string, options?: IQueryOptions): Promise<IBrand | null> {
		return this.findOne({ $or: [{ slug }, { name }] }, { ...options, ignoreDefaultFilters: true })
			.lean()
			.exec();
	}
}
