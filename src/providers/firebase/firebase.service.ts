import { NotificationPayload } from '@/modules/notification';
import { NotificationRepository } from '@/modules/notification/notification.repository';
import { UserRepository } from '@/modules/user/user.repository';
import { Inject, Injectable } from '@nestjs/common';
import { Message, Messaging } from 'firebase-admin/messaging';
import { Id } from '../../common/types';

export const FIREBASE_SERVICE = Symbol('FIREBASE_SERVICE');

@Injectable()
export class FirebaseService {
	constructor(
		@Inject(FIREBASE_SERVICE) private readonly messaging: Messaging,
		private readonly userRepo: UserRepository,
		private readonly notifyRepo: NotificationRepository,
	) {}

	/**
	 * Builds a clean FCM data payload by excluding notification header fields (title, body, sendTo)
	 * and safely converting remaining attributes (including Mongoose ObjectIds) to plain string key-values.
	 */
	buildNotificationData = (payload: NotificationPayload): Record<string, string> => {
		// Destructure internal fields to prevent duplication in custom data
		const { sendTo, title, body, ...dataPayload } = payload || {};
		const data: Record<string, string> = {};

		Object.entries(dataPayload).forEach(([key, value]) => {
			if (value !== undefined && value !== null) {
				// Convert ObjectIds and non-string primitives safely to string
				data[key] = typeof value === 'object' && typeof value.toString === 'function' ? value.toString() : String(value);
			}
		});

		return data;
	};

	/**
	 * Helper service to dispatch FCM push notifications to a single recipient and auto-clean expired tokens
	 */
	sendPushToUser = async (
		user: { _id: Id; notificationEnabled?: boolean; deviceTokens?: string[] },
		payload: NotificationPayload,
	): Promise<void> => {
		// Skip if recipient disabled push notifications
		if (!user.notificationEnabled) {
			console.log('[Push] skipped - user has disabled notifications');
			return;
		}

		const tokens = user.deviceTokens ?? [];

		// Skip if recipient has no active device tokens
		if (tokens.length === 0) {
			console.log('[Push] skipped - user has no device tokens');
			return;
		}

		const { title, body } = payload;
		const messages: Message[] = tokens.map((token) => ({
			token,
			data: this.buildNotificationData({ ...payload, sendTo: user._id }),
			notification: { title, body },
		}));

		const res = await this.messaging.sendEach(messages);

		if (res.failureCount > 0) {
			console.log('[Push] failed to send some notifications');

			const expiredTokens: string[] = [];

			res.responses.forEach((resp, i) => {
				if (!resp.success && resp.error) {
					if (
						resp.error.code === 'messaging/registration-token-not-registered' ||
						resp.error.code === 'messaging/invalid-registration-token'
					) {
						if (tokens[i]) expiredTokens.push(tokens[i]);
					}
				}
			});

			if (expiredTokens.length > 0) {
				// Pull invalid FCM tokens from database
				await this.userRepo.updateOne({ _id: user._id }, { $pull: { deviceTokens: { $in: expiredTokens } } });
				console.log(`[Push] Successfully cleaned up ${expiredTokens.length} expired token(s) for user ${user._id}`);
			}
		}
	};

	sendNotification = async (payload: NotificationPayload): Promise<void> => {
		const { sendBy, sendTo, type, title, body, requestId, postId, commentId, replyId, reactionId } = payload || {};

		try {
			// Prevent users from sending notifications to themselves
			if (sendBy.toString() === sendTo.toString()) return;

			// Fetch target recipient settings
			const recipient = await this.userRepo.findById(sendTo).lean().select('notificationEnabled deviceTokens').exec();
			if (!recipient) return;

			// Abort if sender is blocked by recipient
			// if (await this.blockRepo.isBlocked(sendBy, sendTo)) return;

			const data: NotificationPayload = { sendBy, sendTo, type, title, body };
			if (requestId) data.requestId = requestId;
			if (postId) data.postId = postId;
			if (commentId) data.commentId = commentId;
			if (replyId) data.replyId = replyId;
			if (reactionId) data.reactionId = reactionId;

			// Persist notification record in database
			await this.notifyRepo.create(data);

			// Dispatch FCM push notification
			await this.sendPushToUser(recipient, payload);
		} catch (error) {
			console.log('[Push] failed to send notification', error);
		}
	};

	sendNotificationToMany = async (userIds: Id[], payload: NotificationPayload): Promise<void> => {
		try {
			const { sendBy, type, title, body, requestId, postId, commentId, replyId, reactionId } = payload || {};

			// Filter out the sender from target recipients list
			const targetUserIds = userIds.filter((id) => id.toString() !== sendBy.toString());
			if (targetUserIds.length === 0) return;

			// Fetch block relations between sender and target recipients
			// const blocked = await this.blockRepo
			// 	.find({
			// 		$or: [
			// 			{ blocker: { $in: targetUserIds }, blocked: sendBy },
			// 			{ blocker: sendBy, blocked: { $in: targetUserIds } },
			// 		],
			// 	})
			// 	.lean()
			// 	.select('blocker blocked')
			// 	.exec();

			// const blockIds = blocked.map((item) =>
			// 	item.blocker.toString() === sendBy.toString() ? item.blocked.toString() : item.blocker.toString(),
			// );

			// Fetch valid recipient users in a single query
			const filteredUsers = await this.userRepo
				.find({ _id: { $in: targetUserIds } })
				.lean()
				.select('_id notificationEnabled deviceTokens')
				.exec();

			if (filteredUsers.length === 0) return;

			// Build notification payload structure
			const baseData: Partial<NotificationPayload> = { sendBy, type, title, body };
			if (requestId) baseData.requestId = requestId;
			if (postId) baseData.postId = postId;
			if (commentId) baseData.commentId = commentId;
			if (replyId) baseData.replyId = replyId;
			if (reactionId) baseData.reactionId = reactionId;

			// Create notification documents for bulk database insertion
			const notificationsToInsert = filteredUsers.map((user) => ({
				...baseData,
				sendTo: user._id,
			}));

			await this.notifyRepo.createMany(notificationsToInsert);

			// Dispatch FCM push notifications concurrently via helper function
			await Promise.all(filteredUsers.map((user) => this.sendPushToUser(user, payload)));
		} catch (error) {
			console.log('[Push] failed to send notification to many', error);
		}
	};
}
