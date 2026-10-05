import {
	ClientSession,
	HydratedDocument,
	LeanOptions,
	Model,
	MongooseBaseQueryOptionKeys,
	PopulateOptions,
	Query,
	QueryFilter,
	QueryOptions,
	Types,
} from 'mongoose';
import { IPaginatedResult, PopulateResult } from '../../common/types';

export type Id = Types.ObjectId | string;

// Helper type to extract the raw entity interface from HydratedDocument
export type UnwrapHydrated<T> = T extends HydratedDocument<infer U> ? U : T;

// Automatically computes the plain Javascript object (POJO) return type for lean queries
export type LeanResult<R, T> =
	R extends Array<unknown>
		? UnwrapHydrated<T>[]
		: R extends IPaginatedResult<infer U>
			? IPaginatedResult<UnwrapHydrated<U>>
			: R extends null
				? UnwrapHydrated<T> | null
				: UnwrapHydrated<T>;

export type ExtractItemType<R> = R extends Array<infer U> ? U : R extends IPaginatedResult<infer V> ? V : R;

export interface IQueryOptions extends QueryOptions {
	returnDocument?: 'after' | 'before';
	runValidators?: boolean;
	session?: ClientSession;
	ignoreDefaultFilters?: boolean;
}

export type CountDocumentsOptions<T> = Pick<QueryOptions<T>, 'lean' | 'timestamps' | MongooseBaseQueryOptionKeys> & {
	[other: string]: unknown;
} & {
	session?: ClientSession;
	ignoreDefaultFilters?: boolean;
};

export class RepositoryQueryBuilder<T, R = HydratedDocument<T>> {
	constructor(
		private readonly Model: Model<T>,
		private readonly query: Query<unknown, T>,
		private readonly filter: QueryFilter<T>,
		private isPagination: boolean = false,
		private pageNum: number = 1,
		private limitNum: number = 10,
	) {}

	select(fields: string | string[] | Record<string, 0 | 1> | Record<string, number | boolean | string | object>): this {
		this.query.select(fields);
		return this;
	}

	populate<P = R>(
		options: string | PopulateOptions | (string | PopulateOptions)[],
	): RepositoryQueryBuilder<T, PopulateResult<R, P>> {
		this.query.populate(options as unknown as PopulateOptions);
		return this as unknown as RepositoryQueryBuilder<T, PopulateResult<R, P>>;
	}

	sort(fields: string | Record<string, 1 | -1>): this {
		this.query.sort(fields);
		return this;
	}

	lean<LeanType = LeanResult<R, T>>(options: LeanOptions = {}): RepositoryQueryBuilder<T, LeanType> {
		this.query.lean({ virtuals: true, ...options });
		return this as unknown as RepositoryQueryBuilder<T, LeanType>;
	}

	session(session: ClientSession): RepositoryQueryBuilder<T, R> {
		this.query.session(session);
		return this;
	}

	paginate(page: number = 1, limit: number = 10): RepositoryQueryBuilder<T, IPaginatedResult<ExtractItemType<R>>> {
		this.isPagination = true;
		this.pageNum = Math.max(1, page);
		this.limitNum = Math.max(1, limit);
		return this as unknown as RepositoryQueryBuilder<T, IPaginatedResult<ExtractItemType<R>>>;
	}

	async exec(): Promise<R> {
		if (this.isPagination) {
			const skip = (this.pageNum - 1) * this.limitNum;
			this.query.skip(skip).limit(this.limitNum);

			const session = this.query.getOptions()?.session as ClientSession | undefined;

			const [data, total] = await Promise.all([
				this.query.exec(),
				this.Model.countDocuments(this.filter, { ...(session ? { session } : undefined) }),
			]);

			const totalPages = Math.ceil(total / this.limitNum);

			return {
				data: data as unknown as R,
				metadata: {
					page: this.pageNum,
					limit: this.limitNum,
					total,
					totalPages,
					hasNext: this.pageNum < totalPages,
					hasPrev: this.pageNum > 1,
				},
			} as R;
		}

		const result = await this.query.exec();
		return result as unknown as R;
	}
}
