import { type Id } from '@/common/types';
import { MongooseModule, Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Schema as MongooseSchema } from 'mongoose';
import { Product } from '../product/product.model';
import { User } from '../user/user.model';

@Schema({ _id: true })
export class CartItem {
	@Prop({ type: MongooseSchema.Types.ObjectId, ref: Product.name, required: true })
	product: Id;

	@Prop({ type: Number, required: true, min: [1, 'Quantity must be at least 1'], default: 1 })
	quantity: number;

	@Prop({ type: Number, required: true, min: [0, 'Price Per Unit must be at least 0'], default: 1 })
	pricePerUnit: number;

	@Prop({ type: Number, required: true, min: [0, 'Sub Total must be at least 0'], default: 1 })
	subTotal: number;
}

@Schema({ timestamps: true })
export class Cart {
	@Prop({ type: MongooseSchema.Types.ObjectId, ref: User.name, required: true })
	user: Id;

	@Prop({ type: [CartItem], default: [] })
	items: CartItem[];

	@Prop({ type: Number, default: 0 })
	subTotal: number;

	@Prop({ type: Number, default: 0 })
	totalPrice: number;
}

export const cartSchema = SchemaFactory.createForClass(Cart);

export const cartModel = MongooseModule.forFeature([{ name: Cart.name, schema: cartSchema }]);
