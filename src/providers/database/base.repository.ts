import {
	Aggregate,
	AggregateOptions,
	ClientSession,
	HydratedDocument,
	InsertManyOptions,
	Model,
	MongooseUpdateQueryOptions,
	PipelineStage,
	QueryFilter,
	SaveOptions,
	UpdateQuery,
} from 'mongoose';
import { CountDocumentsOptions, Id, IQueryOptions, RepositoryQueryBuilder } from './query-builder';

export interface IUpdateOptions extends MongooseUpdateQueryOptions {
	session?: ClientSession;
	runValidators?: boolean;
	ignoreDefaultFilters?: boolean;
}

export interface IDeleteOptions {
	session?: ClientSession;
	strict?: boolean | string;
	ignoreDefaultFilters?: boolean;
}

export interface IUpdateResult {
	exist: boolean;
	success: boolean;
	modifiedCount: number;
}

export interface IDeleteResult {
	exist: boolean;
	success: boolean;
	deletedCount: number;
}

export abstract class BaseRepository<T> {
	constructor(protected readonly Model: Model<T>) {}

	protected getDefaultFilter(): QueryFilter<T> {
		return {} as QueryFilter<T>;
	}

	protected combineFilters(filter: QueryFilter<T>, ignoreDefaultFilters: boolean): QueryFilter<T> {
		if (ignoreDefaultFilters) return filter;

		const defaultFilter = this.getDefaultFilter();
		const hasDefault = defaultFilter && Object.keys(defaultFilter).length > 0;
		const hasUserFilter = filter && Object.keys(filter).length > 0;

		if (!hasDefault) return filter;
		if (!hasUserFilter) return defaultFilter;

		return { $and: [defaultFilter, filter] };
	}

	find(filter: QueryFilter<T> = {}, options?: IQueryOptions): RepositoryQueryBuilder<T, HydratedDocument<T>[]> {
		const finalFilter = this.combineFilters(filter, !!options?.ignoreDefaultFilters);
		const query = this.Model.find(finalFilter);
		return new RepositoryQueryBuilder<T, HydratedDocument<T>[]>(this.Model, query, filter);
	}

	findOne(filter: QueryFilter<T>, options?: IQueryOptions): RepositoryQueryBuilder<T, HydratedDocument<T> | null> {
		const finalFilter = this.combineFilters(filter, !!options?.ignoreDefaultFilters);
		const query = this.Model.findOne(finalFilter, '', options);
		return new RepositoryQueryBuilder<T, HydratedDocument<T> | null>(this.Model, query, filter);
	}

	findById(id: Id, options?: IQueryOptions): RepositoryQueryBuilder<T, HydratedDocument<T> | null> {
		const filter = { _id: id } as QueryFilter<T>;
		const finalFilter = this.combineFilters(filter, !!options?.ignoreDefaultFilters);
		const query = this.Model.findOne(finalFilter);
		return new RepositoryQueryBuilder<T, HydratedDocument<T> | null>(this.Model, query, filter);
	}

	findOneAndUpdate(
		filter: QueryFilter<T>,
		update: UpdateQuery<T>,
		queryOptions?: IQueryOptions,
	): RepositoryQueryBuilder<T, HydratedDocument<T> | null> {
		const finalFilter = this.combineFilters(filter, !!queryOptions?.ignoreDefaultFilters);
		const query = this.Model.findOneAndUpdate(finalFilter, update, {
			returnDocument: 'after',
			runValidators: true,
			...queryOptions,
		});
		return new RepositoryQueryBuilder<T, HydratedDocument<T> | null>(this.Model, query, filter);
	}

	findOneAndDelete(
		filter: QueryFilter<T>,
		queryOptions?: IQueryOptions,
	): RepositoryQueryBuilder<T, HydratedDocument<T> | null> {
		const finalFilter = this.combineFilters(filter, !!queryOptions?.ignoreDefaultFilters);
		const query = this.Model.findOneAndDelete(finalFilter, queryOptions);
		return new RepositoryQueryBuilder<T, HydratedDocument<T> | null>(this.Model, query, filter);
	}

	findByIdAndUpdate(
		id: Id,
		update: UpdateQuery<T>,
		queryOptions?: IQueryOptions,
	): RepositoryQueryBuilder<T, HydratedDocument<T> | null> {
		const filter = { _id: id } as QueryFilter<T>;
		const finalFilter = this.combineFilters(filter, !!queryOptions?.ignoreDefaultFilters);
		const query = this.Model.findOneAndUpdate(finalFilter, update, {
			returnDocument: 'after',
			runValidators: true,
			...queryOptions,
		});
		return new RepositoryQueryBuilder<T, HydratedDocument<T> | null>(this.Model, query, filter);
	}

	findByIdAndDelete(id: Id, queryOptions?: IQueryOptions): RepositoryQueryBuilder<T, HydratedDocument<T> | null> {
		const filter = { _id: id } as QueryFilter<T>;
		const finalFilter = this.combineFilters(filter, !!queryOptions?.ignoreDefaultFilters);
		const query = this.Model.findOneAndDelete(finalFilter, queryOptions);
		return new RepositoryQueryBuilder<T, HydratedDocument<T> | null>(this.Model, query, filter);
	}

	build(data: Partial<T>): HydratedDocument<T> {
		return new this.Model(data);
	}

	async save(doc: HydratedDocument<T>, options?: SaveOptions): Promise<HydratedDocument<T>> {
		return (await doc.save(options)) as unknown as HydratedDocument<T>;
	}

	async create(data: Partial<T>, options?: SaveOptions): Promise<HydratedDocument<T>> {
		const doc = this.build(data as T);
		return await this.save(doc, options);
	}

	async createMany(data: Partial<T>[], options: InsertManyOptions = {}): Promise<HydratedDocument<T>[]> {
		const docs = await this.Model.insertMany(data, options);
		return docs as unknown as HydratedDocument<T>[];
	}

	async updateOne(filter: QueryFilter<T>, update: UpdateQuery<T>, options?: IUpdateOptions): Promise<IUpdateResult> {
		const finalFilter = this.combineFilters(filter, !!options?.ignoreDefaultFilters);
		const res = await this.Model.updateOne(finalFilter, update, {
			runValidators: true,
			...options,
		});

		return {
			exist: res.matchedCount > 0,
			success: Boolean(res.acknowledged) && res.matchedCount > 0,
			modifiedCount: res.modifiedCount,
		};
	}

	async updateMany(filter: QueryFilter<T>, update: UpdateQuery<T>, options?: IUpdateOptions): Promise<IUpdateResult> {
		const finalFilter = this.combineFilters(filter, !!options?.ignoreDefaultFilters);
		const res = await this.Model.updateMany(finalFilter, update, {
			runValidators: true,
			...options,
		});

		return {
			exist: res.matchedCount > 0,
			success: Boolean(res.acknowledged) && res.matchedCount > 0,
			modifiedCount: res.modifiedCount,
		};
	}

	async deleteOne(filter: QueryFilter<T>, options?: IDeleteOptions): Promise<IDeleteResult> {
		const finalFilter = this.combineFilters(filter, !!options?.ignoreDefaultFilters);
		const res = await this.Model.deleteOne(finalFilter, options);
		return {
			exist: res.deletedCount > 0,
			success: Boolean(res.acknowledged) && res.deletedCount > 0,
			deletedCount: res.deletedCount,
		};
	}

	async deleteMany(filter: QueryFilter<T>, options?: IDeleteOptions): Promise<IDeleteResult> {
		const finalFilter = this.combineFilters(filter, !!options?.ignoreDefaultFilters);
		const res = await this.Model.deleteMany(finalFilter, options);
		return {
			exist: res.deletedCount > 0,
			success: Boolean(res.acknowledged) && res.deletedCount > 0,
			deletedCount: res.deletedCount,
		};
	}

	async countDocuments(filter: QueryFilter<T> = {}, options: CountDocumentsOptions<T> = {}): Promise<number> {
		return await this.Model.countDocuments(filter, options);
	}

	async exists(filter: QueryFilter<T>, options?: IQueryOptions): Promise<boolean> {
		const finalFilter = this.combineFilters(filter, !!options?.ignoreDefaultFilters);
		const res = await this.Model.exists(finalFilter);
		return res !== null;
	}

	async distinct<K = unknown>(key: string, filter: QueryFilter<T>, options?: IQueryOptions): Promise<K[]> {
		const finalFilter = this.combineFilters(filter, !!options?.ignoreDefaultFilters);
		return (await this.Model.distinct(key, finalFilter, options)) as unknown as K[];
	}

	aggregate<K = Record<string, unknown>>(pipeline?: PipelineStage[], options?: AggregateOptions): Aggregate<K[]> {
		return this.Model.aggregate(pipeline, options) as Aggregate<K[]>;
	}

	async startSession(): Promise<ClientSession> {
		return await this.Model.db.startSession();
	}

	async withTransaction<R>(action: (session: ClientSession) => Promise<R>): Promise<R> {
		const session = await this.Model.db.startSession();
		session.startTransaction();

		try {
			const result = await action(session);
			await session.commitTransaction();
			return result;
		} catch (error) {
			await session.abortTransaction();
			throw error;
		} finally {
			await session.endSession();
		}
	}
}
