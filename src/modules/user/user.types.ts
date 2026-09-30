import { Id } from '@/common/types';
import { HydratedDocument, Model } from 'mongoose';
import { User } from './user.model';

export interface IUserImg {
	id: string;
	url: string;
}
// export interface IUser {
// 	_id: Id;
// 	id?: string;

// 	firstName: string;
// 	lastName: string;
// 	username: string;
// 	email: string;
// 	password?: string;
// 	gender: GenderEnum;

// 	bio?: string;
// 	avatar?: IUserImg | null;
// 	cover?: IUserImg | null;

// 	birthdate?: Date;
// 	phone: string;

// 	provider: ProviderEnum;

// 	role: RoleEnum;

// 	verifiedAt?: Date;
// 	loggedOutAllAt?: Date;

// 	status?: UserStatusEnum;
// 	statusReason?: StatusReasonEnum;
// 	statusChangedAt?: Date;

// 	deviceTokens?: string[];
// 	notificationEnabled?: boolean;

// 	deletedAt?: Date;

// 	lastSeenAt?: Date;

// 	createdAt: Date;
// 	updatedAt?: Date;

// 	name?: string;

// 	// Lists -----------
// 	// friends: Id[];
// 	// blockedUsers: Id[];
// 	// friendRequests: Id[]; // Received friend requests
// 	// sentFriendRequests: Id[]; // Sent friend requests
// 	// rejectedFriendRequests: Id[]; // Rejected/ignored requests
// }

export interface IUser extends User {
	_id: Id;
	id?: string;
	createdAt: Date;
	updatedAt?: Date;
	name?: string;
}

export type HUser = HydratedDocument<IUser>;
export type UserModel = Model<HUser>;

export interface IGeneralUser extends Pick<
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
