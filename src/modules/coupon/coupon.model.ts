import type { Id } from '@/common/types';
import { schemaOptions } from '@/providers/database';
import { Field, ID, Int, ObjectType } from '@nestjs/graphql';
import { MongooseModule, Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Schema as MongooseSchema } from 'mongoose';
import mongooseLeanVirtuals from 'mongoose-lean-virtuals';
import { Brand } from '../brand/brand.model';
import { Category } from '../category/category.model';
import { Product } from '../product/product.model';
import { User } from '../user/user.model';
import { CouponApplicableOnEnum, CouponTypeEnum, couponTypes } from './coupon.enums';

@ObjectType(Coupon.name)
@Schema(schemaOptions)
export class Coupon {
	@Field(() => ID)
	_id: Id;

	@Field(() => String)
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

	@Field(() => Int)
	@Prop({ type: Number, required: true, min: [0, 'Value cannot be negative'] })
	value: number;

	@Field(() => String)
	@Prop({
		type: String,
		required: true,
		enum: couponTypes,
	})
	type: CouponTypeEnum;

	@Field(() => String, { nullable: true })
	@Prop({
		type: String,
		minLength: [3, 'Description must be at least 3 characters'],
		maxLength: [1000, 'Description must be at most 1000 characters'],
		trim: true,
	})
	description?: string;

	@Field(() => String)
	@Prop({ type: String, enum: Object.values(CouponApplicableOnEnum), required: true })
	applicableOn: CouponApplicableOnEnum;

	@Prop({ type: MongooseSchema.Types.ObjectId, ref: User.name, required: true })
	createdBy: Id;

	@Field(() => Int)
	@Prop({ type: Number, default: 0 })
	minPurchaseAmount?: number;

	@Field(() => Int, { nullable: true })
	@Prop({ type: Number })
	maxDiscountAmount?: number;

	@Field(() => Int, { nullable: true })
	@Prop({ type: Number })
	usageLimit?: number;

	@Field(() => Int)
	@Prop({ type: Number, default: 0 })
	usedCount: number;

	@Field(() => Int)
	@Prop({ type: Number, default: 1 })
	usagePerUser?: number;

	@Field(() => Boolean)
	@Prop({ type: Boolean, default: false })
	isStackable: boolean; // is allowed to apply with product discount

	@Field(() => [User], { nullable: 'itemsAndList' })
	@Prop([{ type: MongooseSchema.Types.ObjectId, ref: User.name }])
	usedBy: Id[];

	@Field(() => Date)
	@Prop({ type: Date, default: Date.now, required: true })
	startDate: Date;

	@Field(() => Date, { nullable: true })
	@Prop({ type: Date, default: null })
	endDate?: Date | null;

	@Field(() => [Product], { nullable: 'itemsAndList' })
	@Prop([{ type: MongooseSchema.Types.ObjectId, ref: 'Product' }])
	products?: Id[];

	@Field(() => [Category], { nullable: 'itemsAndList' })
	@Prop([{ type: MongooseSchema.Types.ObjectId, ref: Category.name }])
	categories?: Id[];

	@Field(() => [Brand], { nullable: 'itemsAndList' })
	@Prop([{ type: MongooseSchema.Types.ObjectId, ref: Brand.name }])
	brands?: Id[];

	@Field(() => Boolean)
	@Prop({ type: Boolean, default: true })
	isActive: boolean;

	@Field(() => Date, { nullable: true })
	@Prop({ type: Date, default: Date.now }) // default published
	publishedAt?: Date | null;

	@Field(() => Int)
	@Prop({ type: Number, default: 0 })
	order: number;

	@Field(() => Date, { nullable: true })
	@Prop({ type: Date, default: null })
	deletedAt?: Date | null;
}

export const couponSchema = SchemaFactory.createForClass(Coupon);
// use mongoose-lean-virtuals to get virtuals in lean queries
couponSchema.plugin(mongooseLeanVirtuals);

// Database Indexes for query optimization
couponSchema.index({ code: 1, isActive: 1 });
couponSchema.index({ startDate: 1, endDate: 1 });
couponSchema.index({ isActive: 1, order: 1 });

export const couponModel = MongooseModule.forFeature([{ name: Coupon.name, schema: couponSchema }]);
