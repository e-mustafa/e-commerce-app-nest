import type { Id } from '@/common/types';
import { schemaOptions } from '@/providers/database';
import { MongooseModule, Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Schema as MongooseSchema } from 'mongoose';
import mongooseLeanVirtuals from 'mongoose-lean-virtuals';
import { Product } from '../product/product.model';
import { User } from '../user/user.model';

@Schema(schemaOptions)
export class Favorite {
	@Prop({ type: MongooseSchema.Types.ObjectId, ref: User.name, required: true })
	user: Id;

	@Prop([{ type: MongooseSchema.Types.ObjectId, ref: Product.name, required: true }])
	products: Id[];
}

export const favoriteSchema = SchemaFactory.createForClass(Favorite);
// use mongoose-lean-virtuals to get virtuals in lean queries
favoriteSchema.plugin(mongooseLeanVirtuals);

export const favoriteModel = MongooseModule.forFeature([{ name: Favorite.name, schema: favoriteSchema }]);
