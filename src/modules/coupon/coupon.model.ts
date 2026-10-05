import { type Id } from '@/common/types';
import { MongooseModule, Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { Brand } from '../brand/brand.model';
import { Category } from '../category/category.model';
import { User } from '../user/user.model';
import { CouponApplicableOnEnum, CouponTypeEnum, couponTypes } from './coupon.enums';

export type CouponDocument = Coupon & Document;

@Schema({
	timestamps: true,
	toObject: { virtuals: true },
	toJSON: { virtuals: true },
})
export class Coupon {
	@Prop({
		type: String,
		required: true,
		minLength: [2, 'Name must be at least 2 characters'],
		maxLength: [100, 'Name must be at most 100 characters'],
		trim: true,
		uppercase: true,
		unique: true,
	})
	code: string;

	@Prop({ type: Number, required: true, min: [0, 'Value cannot be negative'] })
	value: number;

	@Prop({
		type: String,
		required: true,
		enum: couponTypes,
	})
	type: CouponTypeEnum;

	@Prop({
		type: String,
		minLength: [3, 'Description must be at least 3 characters'],
		maxLength: [1000, 'Description must be at most 1000 characters'],
		trim: true,
	})
	description?: string;

	@Prop({ type: String, enum: Object.values(CouponApplicableOnEnum), required: true })
	applicableOn: CouponApplicableOnEnum;

	@Prop({ type: MongooseSchema.Types.ObjectId, ref: User.name, required: true })
	createdBy: Id;

	@Prop({ type: Number, default: 0 })
	minPurchaseAmount?: number;

	@Prop({ type: Number })
	maxDiscountAmount?: number;

	@Prop({ type: Number })
	usageLimit?: number;

	@Prop({ type: Number, default: 0 })
	usedCount: number;

	@Prop({ type: Number, default: 1 })
	usagePerUser?: number;

	@Prop([{ type: MongooseSchema.Types.ObjectId, ref: User.name }])
	usedBy: Id[];

	@Prop({ type: Date, default: Date.now, required: true })
	startDate: Date;

	@Prop({ type: Date, default: null })
	endDate?: Date | null;

	@Prop([{ type: MongooseSchema.Types.ObjectId, ref: 'Product' }])
	products?: Id[];

	@Prop([{ type: MongooseSchema.Types.ObjectId, ref: Category.name }])
	categories?: Id[];

	@Prop([{ type: MongooseSchema.Types.ObjectId, ref: Brand.name }])
	brands?: Id[];

	@Prop({ type: Boolean, default: true })
	isActive: boolean;

	@Prop({ type: Number, default: 0 })
	order: number;

	@Prop({ type: Date, default: null })
	deletedAt?: Date | null;
}

export const couponSchema = SchemaFactory.createForClass(Coupon);

// Database Indexes for query optimization
couponSchema.index({ code: 1, isActive: 1 });
couponSchema.index({ startDate: 1, endDate: 1 });
couponSchema.index({ isActive: 1, order: 1 });

export const couponModel = MongooseModule.forFeature([{ name: Coupon.name, schema: couponSchema }]);
