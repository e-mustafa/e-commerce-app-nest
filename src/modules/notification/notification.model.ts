import { type Id } from '@/common/types';
import { MongooseModule, Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Types } from 'mongoose';
import { User } from '../user/user.model';
import { NotificationTypeEnum } from './notification.enum';

@Schema({
	timestamps: true,
	toObject: { virtuals: true },
	toJSON: { virtuals: true },
})
export class Notification {
	@Prop({ type: Types.ObjectId, ref: User.name, required: true })
	sendTo: Id;

	@Prop({ type: Types.ObjectId, ref: User.name, required: true })
	sendBy: Id;

	@Prop({
		type: String,
		enum: Object.values(NotificationTypeEnum),
		required: true,
	})
	type: string;

	@Prop({
		type: String,
		required: true,
		maxLength: [100, 'Title must be at most 100 characters'],
		minLength: [3, 'Title must be at least 3 characters'],
		trim: true,
	})
	title: string;

	@Prop({
		type: String,
		required: true,
		maxLength: [1000, 'Body must be at most 1000 characters'],
		minLength: [3, 'Body must be at least 3 characters'],
		trim: true,
	})
	body: string;

	@Prop(Date)
	readAt: Date;

	// @Prop({ type: Types.ObjectId, ref: Friend.name })
	// requestId?: Id;
}

const notificationSchema = SchemaFactory.createForClass(Notification);

notificationSchema.index({ sendTo: 1, createdAt: 1 });
notificationSchema.index({ sendTo: 1, readAt: 1 });
notificationSchema.index({ createdAt: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 45 }); // Delete notifications older than 45 days

export const notificationModel = MongooseModule.forFeature([{ name: Notification.name, schema: notificationSchema }]);
