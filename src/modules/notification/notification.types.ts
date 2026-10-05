import { Id } from '@/common/types';
import { HydratedDocument, Model } from 'mongoose';
import { IUserGeneral } from '../user';
import { NotificationTypeEnum } from './notification.enum';
import { Notification } from './notification.model';

export interface INotification extends Notification {
	_id: Id;
	id?: string;
	createdAt: Date;
	updatedAt?: Date;
}

export type HNotification = HydratedDocument<INotification>;
export type NotificationModel = Model<HNotification>;
export type INotificationWSender = INotification & { sendBy: IUserGeneral };

export type NotificationPayload = {
	sendTo: Id;
	sendBy: Id;
	type: NotificationTypeEnum;
	title: string;
	body: string;
	requestId?: Id;
	postId?: Id;
	commentId?: Id;
	replyId?: Id;
	reactionId?: Id;
};
