import { IPaginationMetaData } from '../../providers/database/database.type';

export interface ISuccessResponse<T> {
	success: boolean;
	message?: string;
	data?: T;
	status?: number;
	metadata?: IPaginationMetaData;
	[key: string]: any;
}
