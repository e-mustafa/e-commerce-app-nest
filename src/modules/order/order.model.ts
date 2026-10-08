import { type Id } from '@/common/types';
import { MongooseModule, Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Schema as MongooseSchema } from 'mongoose';
import { Coupon } from '../coupon/coupon.model';
import { Product } from '../product/product.model';
import { User } from '../user/user.model';
import { OrderStatusEnum, PaymentMethodEnum, PaymentStatusEnum, ShippingStatusEnum } from './order.enums';

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



@Schema({ _id: true })
export class OrderItem {
	@Prop({ type: MongooseSchema.Types.ObjectId, ref: Product.name, required: true })
	product: Id;

	@Prop({ type: Number, required: true, min: [1, 'Quantity must be at least 1'], default: 1 })
	quantity: number;

	@Prop({ type: Number, required: true, min: [0, 'Price Per Unit must be at least 0'] })
	priceSnapshot: number;

	@Prop({ type: Number, required: true, min: [0, 'Sub Total must be at least 0'], default: 1 })
	subTotal: number;
}

@Schema({
	timestamps: true,
	toJSON: { virtuals: true },
	toObject: { virtuals: true },
 })
export class Order {
	@Prop({ type: MongooseSchema.Types.ObjectId, ref: User.name, required: true })
	user: Id;

	@Prop({ type: String, required: true, unique: true, index: true })
	orderNumber: string;

	@Prop({ type: String, maxLength: [200, 'Note must be at most 200 characters'], trim: true })
	note?: string;

	@Prop({ type: [OrderItem], default: [] })
	items: OrderItem[];

	@Prop({ type: Number, default: 0 })
	subTotal: number;

	@Prop({ type: Number, default: 0 })
	shippingCost: number;

	@Prop({ type: Number, default: 0 })
	discountAmount: number;

	@Prop({ type: Number, default: 0 })
	taxAmount: number;

	@Prop({ type: MongooseSchema.Types.ObjectId, ref: Coupon.name })
	appliedCoupon?: Id;

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
export const orderModel = MongooseModule.forFeature([{ name: Order.name, schema: orderSchema }]);
