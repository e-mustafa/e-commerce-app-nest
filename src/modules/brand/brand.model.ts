import type { Id } from '@/common/types';
import { DBImage, DBImageSchema, schemaOptions } from '@/providers/database/schemas';
import { MongooseModule, Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Schema as MongooseSchema } from 'mongoose';
import mongooseLeanVirtuals from 'mongoose-lean-virtuals';
import { User } from '../user/user.model';
import { Field, ID, ObjectType } from '@nestjs/graphql';

@ObjectType(Brand.name)
@Schema(schemaOptions)
export class Brand {
	@Field(() => ID)
	_id: Id;

	@Field(() => String)
	@Prop({
		type: String,
		required: true,
		minLength: [2, 'Name must be at least 2 characters'],
		maxLength: [100, 'Name must be at most 100 characters'],
		trim: true,
		unique: true,
	})
	name: string;

	@Field(() => String)
	@Prop({
		type: String,
		required: true,
		minLength: [2, 'slug must be at least 2 characters'],
		maxLength: [100, 'slug must be at most 100 characters'],
		trim: true,
		lowercase: true,
		unique: true,
	})
	slug: string;

	@Field(() => String, { nullable: true })
	@Prop({
		type: String,
		minLength: [3, 'Description must be at least 3 characters'],
		maxLength: [1000, 'Description must be at most 1000 characters'],
		trim: true,
	})
	description: string;

	@Field(() => DBImage, { nullable: true })
	@Prop({ type: DBImageSchema, nullable: true })
	icon: DBImage | null;

	@Field(() => DBImage, { nullable: true })
	@Prop({ type: DBImageSchema, nullable: true })
	cover: DBImage | null;

	@Field(() => User)
	@Prop({ type: MongooseSchema.Types.ObjectId, ref: User.name, required: true })
	createdBy: Id;

	@Field(() => Date, { nullable: true })
	@Prop({ type: Date, default: Date.now }) // default published
	publishedAt?: Date | null;

	// Sequence order for navigation bar and lists
	@Field(() => Number)
	@Prop({ type: Number, default: 0 })
	order: number;

	// Soft delete flag
	@Field(() => Date, { nullable: true })
	@Prop({ type: Date, default: null })
	deletedAt?: Date | null;
}

const brandSchema = SchemaFactory.createForClass(Brand);

// use mongoose-lean-virtuals to get virtuals in lean queries
brandSchema.plugin(mongooseLeanVirtuals);

// Indexes -------------------------------------------------
// Indexes for query performance and hierarchy lookups
brandSchema.index({ publishedAt: 1, order: 1 });

export const brandModel = MongooseModule.forFeature([{ name: Brand.name, schema: brandSchema }]);
