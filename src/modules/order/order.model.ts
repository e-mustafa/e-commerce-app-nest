import type { Id } from '@/common/types';
import { schemaOptions } from '@/providers/database';
import { MongooseModule, Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Schema as MongooseSchema } from 'mongoose';
import mongooseLeanVirtuals from 'mongoose-lean-virtuals';
import { Coupon } from '../coupon/coupon.model';
import { Product } from '../product/product.model';
import { User } from '../user/user.model';
import { OrderStatusEnum, PaymentMethodEnum, PaymentStatusEnum, ShippingStatusEnum } from './order.enums';
import { Field, Float, ID, ObjectType } from '@nestjs/graphql';

@Schema({ _id: false })
export class Address {
	@Prop({ type: String, required: true, trim: true })
	street: string;

	@Prop({ type: String, trim: true })
	street2?: string;

	@Prop({ type: String, required: true, trim: true })
	city: string;

	@Prop({ type: String, trim: true })
	state?: string;

	@Prop({ type: String, required: true, trim: true })
	country: string;

	@Prop({ type: String, required: true, trim: true })
	postalCode: string;

	@Prop({ type: String, required: true, trim: true })
	phone: string;
}

@ObjectType({ description: 'Order item' })
@Schema({ _id: true })
export class OrderItem {
	@Field(() => Product)
	@Prop({ type: MongooseSchema.Types.ObjectId, ref: Product.name, required: true })
	product: Id;

	@Field(() => Number)
	@Prop({ type: Number, required: true, min: [1, 'Quantity must be at least 1'], default: 1 })
	quantity: number;

	@Field(() => Float)
	@Prop({ type: Number, required: true, min: [0, 'Original price must be at least 0'] })
	price: number; // Historical original price snapshot

	@Field(() => Float)
	@Prop({ type: Number, min: [0, 'Discount must be at least 0'], default: 0 })
	discount: number; // Historical product-level discount per unit snapshot

	@Field(() => Float)
	@Prop({ type: Number, required: true, min: [0, 'Final unit price must be at least 0'] })
	finalPrice: number; // Historical final unit price (price - discount)

	@Field(() => Float)
	@Prop({ type: Number, required: true, min: [0, 'Sub total must be at least 0'] })
	subTotal: number; // finalPrice * quantity

	// @Prop({ type: Number, required: true, min: [0, 'Price Per Unit must be at least 0'] })
	// priceSnapshot: number;

	// @Prop({ type: Number, required: true, min: [0, 'Sub Total must be at least 0'], default: 1 })
	// subTotal: number;
}

@ObjectType({ description: 'Order' })
@Schema(schemaOptions)
export class Order {
	@Field(() => ID)
	_id: Id;

	@Field(() => User)
	@Prop({ type: MongooseSchema.Types.ObjectId, ref: User.name, required: true })
	user: Id;

	@Field(() => String)
	@Prop({ type: String, required: true, unique: true, index: true })
	orderNumber: string;

	@Field(() => String, { nullable: true })
	@Prop({ type: String, maxLength: [200, 'Note must be at most 200 characters'], trim: true })
	note?: string;

	@Field(() => [OrderItem])
	@Prop({ type: [OrderItem], default: [] })
	items: OrderItem[];

	@Field(() => Float)
	@Prop({ type: Number, default: 0 })
	subTotal: number;

	@Field(() => Float)
	@Prop({ type: Number, default: 0 })
	shippingCost: number;

	@Field(() => Float)
	@Prop({ type: Number, default: 0 })
	discountAmount: number;

	@Field(() => Float)
	@Prop({ type: Number, default: 0 })
	taxAmount: number;

	@Field(() => Coupon, { nullable: true })
	@Prop({ type: MongooseSchema.Types.ObjectId, ref: Coupon.name })
	appliedCoupon?: Id;

	@Field(() => Float)
	@Prop({ type: Number, required: true, default: 0 })
	finalTotal: number;

	@Prop({ type: String, enum: Object.values(OrderStatusEnum), default: OrderStatusEnum.PENDING })
	status: OrderStatusEnum;

	// Payment fields
	@Prop({ type: String, enum: Object.values(PaymentMethodEnum), required: true })
	paymentMethod: PaymentMethodEnum;

	@Prop({ type: String })
	paymentIntentId?: string;

	@Prop({ type: String, enum: Object.values(PaymentStatusEnum), default: PaymentStatusEnum.PENDING })
	paymentStatus: PaymentStatusEnum;

	@Prop({ type: String, default: 'USD' })
	currency: string;

	// Shipping fields
	@Prop({ type: Address, required: true })
	shippingAddress: Address;

	@Prop({ type: String, default: 'Standard' })
	shippingMethod?: string;

	@Prop({ type: String, enum: Object.values(ShippingStatusEnum), default: ShippingStatusEnum.PENDING })
	shippingStatus: ShippingStatusEnum;

	@Prop({ type: String })
	shippingTrackingNumber?: string;

	@Prop({ type: String })
	shippingCarrier?: string;

	@Prop(Date)
	deletedAt?: Date | string | null;
}

export const orderSchema = SchemaFactory.createForClass(Order);

// use mongoose-lean-virtuals to get virtuals in lean queries
orderSchema.plugin(mongooseLeanVirtuals);

export const orderModel = MongooseModule.forFeature([{ name: Order.name, schema: orderSchema }]);
