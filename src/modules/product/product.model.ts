import type { Id } from '@/common/types';
import { DBImage, schemaOptions } from '@/providers/database';
import { Field, Float, ID, Int, ObjectType } from '@nestjs/graphql';
import { MongooseModule, Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema, Query, UpdateQuery } from 'mongoose';
import mongooseLeanVirtuals from 'mongoose-lean-virtuals';
import { Brand } from '../brand/brand.model';
import { Category } from '../category/category.model';
import { Review } from '../review/review.model';
import { User } from '../user/user.model';

// -----------------------------------------------------------------------------
// Main Product Schema
// -----------------------------------------------------------------------------

@ObjectType(Product.name)
@Schema(schemaOptions)
export class Product {
	@Field(() => ID)
	_id: Id;

	@Field(() => String)
	@Prop({
		type: String,
		minLength: [2, 'Title must be at least 2 characters'],
		maxLength: [150, 'Title must be at most 150 characters'],
		trim: true,
		required: true,
		unique: true,
	})
	title: string;

	@Field(() => String)
	@Prop({
		type: String,
		required: true,
		minLength: [2, 'Slug must be at least 2 characters'],
		maxLength: [150, 'Slug must be at most 150 characters'],
		trim: true,
		lowercase: true,
		unique: true,
	})
	slug: string;

	@Field(() => String, { nullable: true })
	@Prop({
		type: String,
		minLength: [2, 'sku must be at least 2 characters'],
		maxLength: [100, 'sku must be at most 100 characters'],
		trim: true,
	})
	sku?: string;

	@Field(() => String)
	@Prop({
		type: String,
		minLength: [3, 'Short Description must be at least 3 characters'],
		maxLength: [200, 'Short Description must be at most 200 characters'],
		trim: true,
	})
	excerpt: string;

	@Field(() => String, { nullable: true })
	@Prop({
		type: String,
		minLength: [3, 'Description must be at least 3 characters'],
		maxLength: [50000, 'Description must be at most 50000 characters'],
		trim: true,
	})
	description: string;

	@Field(() => String, { nullable: true })
	@Prop({
		type: String,
		minLength: [2, 'model must be at least 2 characters'],
		maxLength: [100, 'model must be at most 100 characters'],
		trim: true,
	})
	model?: string;

	// Pricing & Stock Attributes
	@Field(() => Float)
	@Prop({ type: Number, required: true, min: [0, 'Price cannot be negative'] })
	price: number;

	@Field(() => Number, { nullable: true })
	@Prop({ type: Number, min: [0, 'Discount amount cannot be negative'], default: 0 })
	discount: number;

	@Field(() => Float)
	@Prop({ type: Number, required: true, index: true })
	finalPrice: number;

	// @Field(() => Float)
	@Prop({ type: Number, min: [0, 'Cost price cannot be negative'], default: 0 })
	costPrice?: number;

	@Field(() => Int)
	@Prop({ type: Number, required: true, min: [0, 'Stock cannot be negative'], default: 1 })
	stock: number;

	@Field(() => String, { nullable: true })
	@Prop({ type: String })
	stockType?: string;

	@Field(() => Int, { nullable: true })
	@Prop({
		type: Number,
		required: true,
		min: [0, 'Maximum order sell cannot be negative, set to 0 for unlimited'],
		default: 0,
	})
	maxOrderSell?: number;

	@Field(() => Int, { nullable: true })
	@Prop({ type: Number, required: true, min: [0, 'Minimum warn quantity cannot be negative'], default: 5 })
	lowStockAlert?: number; // for waring users about low quantity

	// Categorization Relations
	@Field(() => Category, { nullable: true })
	@Prop({ type: MongooseSchema.Types.ObjectId, ref: Category.name, required: true })
	category?: Id;

	@Field(() => Brand, { nullable: true })
	@Prop({ type: MongooseSchema.Types.ObjectId, ref: Brand.name, required: false })
	brand?: Id;

	@Field(() => [String])
	@Prop([String])
	tags?: string[];

	// // Media
	// @Prop({ type: DBImage, default: null })
	// cover?: DBImage | null;

	@Field(() => [DBImage])
	@Prop({ type: [DBImage], default: [] })
	images: DBImage[];

	// Ratings & Metrics
	@Field(() => Float)
	@Prop({ type: Number, default: 0, min: 0, max: 5 })
	ratingsAverage?: number;

	@Field(() => Int)
	@Prop({ type: Number, default: 0 })
	ratingCount?: number;

	// System Attributes
	@Field(() => User)
	@Prop({ type: MongooseSchema.Types.ObjectId, ref: User.name, required: true })
	createdBy: Id;

	@Field(() => Date, { nullable: true })
	@Prop({ type: Date, default: Date.now })
	publishedAt?: Date | null;

	@Field(() => Int)
	@Prop({ type: Number, default: 0 })
	order: number;

	@Field(() => Date, { nullable: true })
	@Prop({ type: Date, default: null })
	deletedAt?: Date | null;
}

export const productSchema = SchemaFactory.createForClass(Product);

// use mongoose-lean-virtuals to get virtuals in lean queries
productSchema.plugin(mongooseLeanVirtuals);

// Indexes for Performance --------------------------------------------
productSchema.index({ category: 1, publishedAt: -1 });
productSchema.index({ price: 1, ratingsAverage: -1 });
productSchema.index({ publishedAt: 1, order: 1 });
productSchema.index({ deletedAt: 1 });
productSchema.index({ name: 'text', description: 'text', excerpt: 'text' });

// Virtuals for populate reviews --------------------------------------------
productSchema.virtual('reviews', {
	localField: '_id',
	foreignField: 'product',
	ref: Review.name,
});

productSchema.pre('save', function (this: Product) {
	if (this.discount > 0 && this.discount < this.price) {
		this.finalPrice = Number((this.price - this.discount).toFixed(2));
	} else {
		this.finalPrice = this.price;
		this.discount = 0;
	}
});

productSchema.pre(
	['findOneAndUpdate', 'updateOne', 'updateMany'],
	async function (this: Query<unknown, HydratedDocument<Product>>) {
		const update = this.getUpdate() as UpdateQuery<Product>;

		if (update && update.$set) {
			const $set = update.$set;

			// Check if either price or discount is being modified in the update payload
			if ($set.price !== undefined || $set.discount !== undefined) {
				// Fetch the existing document from database to handle partial updates safely
				const currentDoc = await this.model.findOne(this.getQuery()).lean().exec();

				if (currentDoc) {
					const price = $set.price !== undefined ? $set.price : currentDoc.price;
					const discount = $set.discount !== undefined ? $set.discount : currentDoc.discount;

					if (discount > 0 && discount < price) {
						$set.finalPrice = Number((price - discount).toFixed(2));
					} else {
						$set.finalPrice = price;
						$set.discount = 0;
					}
				}
			}
		}
	},
);

export const productModel = MongooseModule.forFeature([{ name: Product.name, schema: productSchema }]);
