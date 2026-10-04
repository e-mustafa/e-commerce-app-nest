import { Id, IFile, IUserBody } from '@/common/types';
import type * as dto from './review.dto';

export type ICreateReviewPayload = dto.CreateReviewDTO &
	dto.ReviewParamsProductIdDTO & {
		userId: Id;
		files?: IFile[];
	};

export type IUpdateReviewPayload = dto.UpdateReviewDTO & {
	userId: Id;
	reviewId: string;
	files?: IFile[];
};

export type IListReviewPayload = dto.ReviewQueryDTO & dto.ReviewParamsProductIdOptDTO & {
	user: IUserBody;
};
