import { type Id } from '@/common/types';
import { DBImage, DBImageSchema, schemaOptions } from '@/providers/database/schemas';
import { MongooseModule, Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Schema as MongooseSchema } from 'mongoose';
import mongooseLeanVirtuals from 'mongoose-lean-virtuals';
import { User } from '../user/user.model';
import { Field, ID, ObjectType } from '@nestjs/graphql';

@ObjectType(Category.name)
@Schema(schemaOptions)
export class Category {
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

	@Field(() => Category, { nullable: true })
	@Prop({
		type: MongooseSchema.Types.ObjectId,
		ref: Category.name,
		required: false,
		default: null,
	})
	parentId?: Id | null;

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

const categorySchema = SchemaFactory.createForClass(Category);
// use mongoose-lean-virtuals to get virtuals in lean queries
categorySchema.plugin(mongooseLeanVirtuals);

// Indexes -------------------------------------------------
// Indexes for query performance and hierarchy lookups
categorySchema.index({ name: 1, parentId: 1 });
categorySchema.index({ parentId: 1, publishedAt: 1, order: 1 });

// Virtual populate for sub-categories tree navigation ------
categorySchema.virtual('children', {
	ref: Category.name,
	localField: '_id',
	foreignField: 'parentId',
});

export const categoryModel = MongooseModule.forFeature([{ name: Category.name, schema: categorySchema }]);
