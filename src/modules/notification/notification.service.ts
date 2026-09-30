import { NotFoundException } from '@/common/exceptions';
import { Id, IPaginatedResult } from '@/common/types';
import { Injectable } from '@nestjs/common';
import { QueryFilter } from 'mongoose';
import { selectGeneralUserInfo } from '../user';
import { UserRepository } from '../user/user.repository';
import { NotificationRepository } from './notification.repository';
import { INotification, INotificationWSender } from './notification.types';
import { AddDeviceTokenDTO, GetNotificationsQueryDTO, ParamsIdSchemaDTO } from './notification.validation';

@Injectable()
export class NotificationService {
	constructor(
		private readonly notifyRepo: NotificationRepository,
		private readonly userRepo: UserRepository,
	) {}

	// DeviceToken -------------------------------------------
	addDeviceToken(userId: Id, { token }: AddDeviceTokenDTO) {
		return this.userRepo.updateOne({ _id: userId }, { $addToSet: { deviceTokens: token } });
	}

	removeDeviceToken(userId: Id, { token }: AddDeviceTokenDTO) {
		return this.userRepo.updateOne({ _id: userId }, { $pull: { deviceTokens: token } });
	}

	// Notification -------------------------------------------
	async listNotifications(
		userId: Id,
		{ page = 1, limit = 10, unreadOnly, order }: GetNotificationsQueryDTO,
	): Promise<IPaginatedResult<INotification> & { unread: number }> {
		const filter: QueryFilter<INotification> = { sendTo: userId };
		if (unreadOnly) filter.$or = [{ readAt: { $exists: false } }, { readAt: null }];

		const [result, unread] = await Promise.all([
			this.notifyRepo
				.find(filter)
				.lean()
				.sort({ createdAt: order === 'asc' ? 1 : -1 })
				.paginate(page, limit)
				.populate<INotificationWSender>({ path: 'sendBy', select: selectGeneralUserInfo })
				.exec(),
			// get unread count
			this.notifyRepo.countDocuments({ sendTo: userId, $or: [{ readAt: { $exists: false } }, { readAt: null }] }),
		]);

		return { unread, ...result };
	}

	async unreadCount(userId: Id) {
		return await this.notifyRepo.countDocuments({
			sendTo: userId,
			$or: [{ readAt: { $exists: false } }, { readAt: null }],
		});
	}

	async markAsRead(userId: Id, { notificationId }: ParamsIdSchemaDTO) {
		const updated = await this.notifyRepo
			.findOneAndUpdate({ _id: notificationId, sendTo: userId }, { readAt: new Date() })
			.lean()
			.populate<INotificationWSender>({ path: 'sendBy', select: selectGeneralUserInfo })
			.exec();

		if (!updated) throw new NotFoundException('Notification not found');
		return updated;
	}

	async markAllAsRead(userId: Id) {
		return await this.notifyRepo.updateMany({ sendTo: userId }, { readAt: new Date() });
	}

	async deleteNotification(userId: Id, { notificationId }: ParamsIdSchemaDTO) {
		const deleted = await this.notifyRepo.findOneAndDelete({ _id: notificationId, sendTo: userId }).lean().exec();
		if (!deleted) throw new NotFoundException('Notification not found', 'deleteNotification');
		return true;
	}

	async deleteAllNotifications(userId: Id) {
		return await this.notifyRepo.deleteMany({ sendTo: userId });
	}
}
