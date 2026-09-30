import { Id } from '@/common/types';
import { IUser } from '@/modules/user/user.types';
import { JwtPayload } from 'jsonwebtoken';

export type TTokens = {
	accessToken: string;
	refreshToken: string;
	accessExpiration: number;
	refreshExpiration: number;

	tokenId?: string;
};

export interface IUserPayload extends Pick<IUser, '_id' | 'email' | 'firstName' | 'role' | 'lastName'| 'avatar'> {}

export interface IJwtPayload extends JwtPayload {
	id: string;
	_id: Id;
	email: string;
	name: string;
	remembered: 0 | 1;
	firstName?: string;
	lastName?: string;
	avatar?: string;
}
