import { Id } from '@/common/types';
import { BaseRepository } from '@/providers/database/base.repository';
import { IQueryOptions } from '@/providers/database/query-builder';
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { isValidObjectId, QueryFilter } from 'mongoose';
import { Category } from './category.model';
import { type CategoryModel, ICategory } from './category.types';

@Injectable()
export class CategoryRepository extends BaseRepository<ICategory> {
	protected activeFilter: QueryFilter<ICategory> = {
		publishedAt: { $ne: null, $lt: new Date() },
		$or: [{ deletedAt: { $exists: false } }, { deletedAt: null }],
	};

	constructor(@InjectModel(Category.name) categoryModel: CategoryModel) {
		super(categoryModel);
	}

	protected override getDefaultFilter(): QueryFilter<ICategory> {
		return this.activeFilter;
	}

	/**
	 * Finds a category by its ObjectId or unique slug.
	 * Safely checks if the provided id is a valid ObjectId before querying `_id` to avoid CastError.
	 */
	findByIdOrSlug(id: Id, options?: IQueryOptions): Promise<ICategory | null> {
		const isObjectId = isValidObjectId(id);
		const filter: QueryFilter<ICategory> = isObjectId
			? { $or: [{ _id: id }, { slug: id as string }] }
			: { slug: id as string };

		return this.findOne(filter, options).lean<ICategory>().exec();
	}

	/**
	 * Checks whether a category exists with the given slug or name, bypassing default filters.
	 */
	isExist(slug: string, name: string, options?: IQueryOptions): Promise<ICategory | null> {
		return this.findOne({ $or: [{ slug }, { name }] }, { ...options, ignoreDefaultFilters: true })
			.lean<ICategory>()
			.exec();
	}
}
