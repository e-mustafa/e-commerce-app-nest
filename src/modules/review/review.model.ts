import { type Id } from '@/common/types';
import { DBImage, DBImageSchema } from '@/providers/database/schemas';
import { MongooseModule, Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Schema as MongooseSchema } from 'mongoose';
import { Product } from '../product/product.model';
import { User } from '../user/user.model';

@Schema({
	timestamps: true,
	toObject: { virtuals: true },
	toJSON: { virtuals: true },
})
export class Review {
	@Prop({ type: MongooseSchema.Types.ObjectId, ref: User.name, required: true })
	author: Id;

	@Prop({ type: MongooseSchema.Types.ObjectId, ref: Product.name, required: true })
	product: Id;

	@Prop({
		type: String,
		required: true,
		minLength: [2, 'Title must be at least 2 characters'],
		maxLength: [50, 'Title must be at most 50 characters'],
		trim: true,
	})
	title: string;

	@Prop({
		type: String,
		required: true,
		minLength: [2, 'Comment must be at least 2 characters'],
		maxLength: [250, 'Comment must be at most 250 characters'],
		trim: true,
	})
	comment: string;

	@Prop({
		type: String,
		minLength: [3, 'Description must be at least 3 characters'],
		maxLength: [1000, 'Description must be at most 1000 characters'],
		trim: true,
	})
	description: string;

	@Prop({ type: [DBImageSchema], nullable: true })
	images: DBImage[] | null;

	@Prop({ type: Number, min: 1, max: 5 })
	rating: number;

	@Prop([{ type: MongooseSchema.Types.ObjectId, ref: User.name, required: true }])
	likedBy: Id;
}

const reviewSchema = SchemaFactory.createForClass(Review);

// Indexes -------------------------------------------------
// Indexes for query performance and hierarchy lookups
reviewSchema.index({ author: 1, product: 1 }, { unique: true }); // Ensure a user can only leave one review per product
reviewSchema.index({ publishedAt: 1, order: 1 });

export const reviewModel = MongooseModule.forFeature([{ name: Review.name, schema: reviewSchema }]);
