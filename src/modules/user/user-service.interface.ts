import { IUserBody } from '@/common/types';
import { GetUsersQueryDTO, ParamsUserIdDTO, UpdateUserStatusDTO } from './user.dto';

export interface IUpdateUserStatusPayload extends UpdateUserStatusDTO, ParamsUserIdDTO {
	user: IUserBody;
}

export interface IListUsersPayload extends GetUsersQueryDTO {
	user: IUserBody;
}
