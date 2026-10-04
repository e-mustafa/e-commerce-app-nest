import { type Id } from '@/common/types';
import { DBImage, DBImageSchema } from '@/providers/database/schemas';
import { MongooseModule, Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Schema as MongooseSchema } from 'mongoose';
import { User } from '../user/user.model';

@Schema({
	timestamps: true,
	toObject: { virtuals: true },
	toJSON: { virtuals: true },
})
export class Brand {
	@Prop({
		type: String,
		required: true,
		minLength: [2, 'Name must be at least 2 characters'],
		maxLength: [100, 'Name must be at most 100 characters'],
		trim: true,
		unique: true,
	})
	name: string;

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

	@Prop({
		type: String,
		minLength: [3, 'Description must be at least 3 characters'],
		maxLength: [1000, 'Description must be at most 1000 characters'],
		trim: true,
	})
	description: string;

	@Prop({ type: DBImageSchema, nullable: true })
	icon: DBImage | null;

	@Prop({ type: DBImageSchema, nullable: true })
	cover: DBImage | null;

	@Prop({ type: MongooseSchema.Types.ObjectId, ref: User.name, required: true })
	createdBy: Id;

	@Prop({ type: Date, default: Date.now }) // default published
	publishedAt?: Date | null;

	// Sequence order for navigation bar and lists
	@Prop({ type: Number, default: 0 })
	order: number;

	// Soft delete flag
	@Prop({ type: Date, default: null })
	deletedAt?: Date | null;
}

const brandSchema = SchemaFactory.createForClass(Brand);

// Indexes -------------------------------------------------
// Indexes for query performance and hierarchy lookups
brandSchema.index({ publishedAt: 1, order: 1 });

export const brandModel = MongooseModule.forFeature([{ name: Brand.name, schema: brandSchema }]);
