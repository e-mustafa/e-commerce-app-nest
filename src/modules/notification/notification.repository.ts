import { BaseRepository } from '@/providers/database/base.repository';
import { InjectModel } from '@nestjs/mongoose';
import { Notification } from './notification.model';
import type { HNotification, NotificationModel } from './notification.types';

export class NotificationRepository extends BaseRepository<HNotification> {
	constructor(@InjectModel(Notification.name) Notification: NotificationModel) {
		super(Notification);
	}
}
