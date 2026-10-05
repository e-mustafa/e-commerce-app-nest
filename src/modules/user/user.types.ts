import { Id } from '@/common/types';
import { HydratedDocument, Model } from 'mongoose';
import { User } from './user.model';

export interface IUserImg {
	id: string;
	url: string;
}

export interface IUser extends User {
	_id: Id;
	id?: string;
	createdAt: Date;
	updatedAt?: Date;
	name?: string;
}

export type HUser = HydratedDocument<IUser>;
export type UserModel = Model<HUser>;

export interface IUserGeneral extends Pick<
	IUser,
	'_id' | 'id' | 'firstName' | 'lastName' | 'username' | 'bio' | 'gender' | 'avatar' | 'cover'
> {}

export interface ISessionInfo {
	ip: string | undefined;
	device: string | undefined;
	createdAt: Date | string;
}

export interface ISessionResponse extends ISessionInfo {
	active: boolean;
}

export interface IRedisSessionList {
	key: string;
	value: ISessionInfo;
}
