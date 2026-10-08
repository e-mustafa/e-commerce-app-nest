import { IUser } from '@/modules/user';
import { ClientSession, MongooseUpdateQueryOptions, Types } from 'mongoose';

export type ObjId = Types.ObjectId;
export type Id = Types.ObjectId | string;

export interface IUserBody extends Omit<IUser, 'password'> {}

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

// Helper type to handle items inside arrays or paginated data
type PopulateItem<R, P> =
	R extends IPaginatedResult<infer Data>
		? IPaginatedResult<Data extends Array<unknown> ? P[] : P>
		: R extends Array<unknown>
			? P[]
			: P;

export type PopulateResult<R, P> = R extends null ? null : PopulateItem<R, P>;
export interface IPaginationMetaData {
	page: number;
	limit: number;
	total: number;
	totalPages: number;
	hasNext: boolean;
	hasPrev: boolean;
}

export interface IPaginatedResult<Data> {
	data: Data;
	metadata: IPaginationMetaData;
}
