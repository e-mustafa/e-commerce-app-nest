import { IUserBody } from '@/common/types';
import { UpdateUserStatusDTO, UserParamIdDTO, UsersQueryDTO } from './user.dto';

export interface IUpdateUserStatusPayload extends UpdateUserStatusDTO, UserParamIdDTO {
	user: IUserBody;
}

export interface IListUsersPayload extends UsersQueryDTO {
	user: IUserBody;
}
