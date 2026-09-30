import { AUser } from '@/common/decorators/request.decorator';
import type { Id } from '@/common/types';
import { Body, Controller, Param, Post, Query } from '@nestjs/common';
import { NotificationService } from './notification.service';
import {
	type AddDeviceTokenDTO,
	type GetNotificationsQueryDTO,
	type ParamsIdSchemaDTO,
	addDeviceTokenSchema,
	getNotificationsSchema,
	paramsIdSchema,
} from './notification.validation';

export const routes = {
	base: '/notifications',
	deviceToken: '/device-token',
	general: '/',
	unreadCount: '/unread-count',
	byId: '/:notificationId',
};

@Controller(routes.base)
export class NotificationController {
	constructor(private readonly service: NotificationService) {}

	@Post()
	async addDeviceToken(@AUser('_id') userId: Id, @Body({ schema: addDeviceTokenSchema.body }) body: AddDeviceTokenDTO) {
		await this.service.addDeviceToken(userId, body);
		return { message: 'Device registered successfully' };
	}

	async removeDeviceToken(@AUser('_id') userId: Id, @Body({ schema: addDeviceTokenSchema.body }) body: AddDeviceTokenDTO) {
		await this.service.removeDeviceToken(userId, body);
		return { message: 'Device unregistered successfully' };
	}

	// Notifications -------------------------------------------
	async listNotifications(
		@AUser('_id') userId: Id,
		@Query({ schema: getNotificationsSchema.query }) query: GetNotificationsQueryDTO,
	) {
		const result = await this.service.listNotifications(userId, query);
		return { ...result };
	}

	async unreadCount(@AUser('_id') userId: Id) {
		const unread = await this.service.unreadCount(userId);
		return { data: unread };
	}

	async markAsRead(@AUser('_id') userId: Id, @Param({ schema: paramsIdSchema.params }) params: ParamsIdSchemaDTO) {
		const data = await this.service.markAsRead(userId, params);
		return { data };
	}

	async markAllAsRead(@AUser('_id') userId: Id) {
		await this.service.markAllAsRead(userId);
		return { message: 'All notifications marked as read successfully' };
	}

	async deleteNotification(@AUser('_id') userId: Id, @Param({ schema: paramsIdSchema.params }) params: ParamsIdSchemaDTO) {
		await this.service.deleteNotification(userId, params);
		return { message: 'Notification deleted successfully' };
	}

	async deleteAllNotifications(@AUser('_id') userId: Id) {
		await this.service.deleteAllNotifications(userId);
		return { message: 'All notifications deleted successfully' };
	}
}
