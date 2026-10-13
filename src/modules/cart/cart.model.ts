import type { Id } from '@/common/types';
import { schemaOptions } from '@/providers/database';
import { MongooseModule, Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Schema as MongooseSchema } from 'mongoose';
import mongooseLeanVirtuals from 'mongoose-lean-virtuals';
import { Product } from '../product/product.model';
import { User } from '../user/user.model';

@Schema({ _id: true })
export class CartItem {
	@Prop({ type: MongooseSchema.Types.ObjectId, ref: Product.name, required: true })
	product: Id;

	@Prop({ type: Number, required: true, min: [1, 'Quantity must be at least 1'], default: 1 })
	quantity: number;

	@Prop({ type: Number, required: true, min: [0, 'Original price must be at least 0'] })
	price: number; // Original product price at the time of adding to cart

	@Prop({ type: Number, min: [0, 'Discount must be at least 0'], default: 0 })
	discount: number; // Product-level discount per unit

	@Prop({ type: Number, required: true, min: [0, 'Final price per unit must be at least 0'] })
	finalPrice: number; // Price after product discount (price - discount)

	@Prop({ type: Number, required: true, min: [0, 'Subtotal must be at least 0'] })
	subTotal: number; // finalPrice * quantity
}

@Schema(schemaOptions)
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
// use mongoose-lean-virtuals to get virtuals in lean queries
cartSchema.plugin(mongooseLeanVirtuals);

export const cartModel = MongooseModule.forFeature([{ name: Cart.name, schema: cartSchema }]);
