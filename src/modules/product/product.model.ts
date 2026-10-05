import { type Id } from '@/common/types';
import { DBImage } from '@/providers/database';
import { MongooseModule, Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Schema as MongooseSchema } from 'mongoose';
import { Brand } from '../brand/brand.model';
import { Category } from '../category/category.model';
import { User } from '../user/user.model';

// -----------------------------------------------------------------------------
// Main Product Schema
// -----------------------------------------------------------------------------

@Schema({
	timestamps: true,
	toObject: { virtuals: true },
	toJSON: { virtuals: true },
})
export class Product {
	@Prop({
		type: String,
		minLength: [2, 'Title must be at least 2 characters'],
		maxLength: [150, 'Title must be at most 150 characters'],
		trim: true,
		required: true,
		unique: true,
	})
	title: string;

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

	@Prop({
		type: String,
		minLength: [2, 'sku must be at least 2 characters'],
		maxLength: [100, 'sku must be at most 100 characters'],
		trim: true,
	})
	sku?: string;

	@Prop({
		type: String,
		minLength: [3, 'Short Description must be at least 3 characters'],
		maxLength: [200, 'Short Description must be at most 200 characters'],
		trim: true,
	})
	excerpt: string;

	@Prop({
		type: String,
		minLength: [3, 'Description must be at least 3 characters'],
		maxLength: [50000, 'Description must be at most 50000 characters'],
		trim: true,
	})
	description: string;

	@Prop({
		type: String,
		minLength: [2, 'model must be at least 2 characters'],
		maxLength: [100, 'model must be at most 100 characters'],
		trim: true,
	})
	model?: string;

	// Pricing & Stock Attributes
	@Prop({ type: Number, required: true, min: [0, 'Price cannot be negative'] })
	price: number;

	@Prop({ type: Number, min: [0, 'Discount price cannot be negative'], default: 0 })
	discountPrice?: number;

	@Prop({ type: Number, min: [0, 'Cost price cannot be negative'], default: 0 })
	costPrice?: number;

	@Prop({ type: Number, required: true, min: [0, 'Stock cannot be negative'], default: 0 })
	stock: number;

	@Prop({ type: String })
	stockType?: string;

	@Prop({ type: Number, required: true, min: [0, 'Maximum order sell cannot be negative'], default: 1 })
	maxOrderSell?: number;

	@Prop({ type: Number, required: true, min: [0, 'Minimum warn quantity cannot be negative'], default: 1 })
	lowStockAlert?: number; // for waring users about low quantity

	// Categorization Relations
	@Prop({ type: MongooseSchema.Types.ObjectId, ref: Category.name, required: true })
	category?: Id;

	@Prop({ type: MongooseSchema.Types.ObjectId, ref: Brand.name, required: false })
	brand?: Id;

	@Prop([String])
	tags?: string[];

	// // Media
	// @Prop({ type: DBImage, default: null })
	// cover?: DBImage | null;

	@Prop({ type: [DBImage], default: [] })
	images: DBImage[];

	// Ratings & Metrics
	@Prop({ type: Number, default: 0, min: 0, max: 5 })
	ratingsAverage?: number;

	@Prop({ type: Number, default: 0 })
	ratingsQuantity?: number;

	// System Attributes
	@Prop({ type: MongooseSchema.Types.ObjectId, ref: User.name, required: true })
	createdBy: Id;

	@Prop({ type: Date, default: Date.now })
	publishedAt?: Date | null;

	@Prop({ type: Number, default: 0 })
	order: number;

	@Prop({ type: Date, default: null })
	deletedAt?: Date | null;
}

export const productSchema = SchemaFactory.createForClass(Product);

// Indexes for Performance --------------------------------------------
productSchema.index({ category: 1, publishedAt: -1 });
productSchema.index({ price: 1, ratingsAverage: -1 });
productSchema.index({ publishedAt: 1, order: 1 });
productSchema.index({ deletedAt: 1 });

export const productModel = MongooseModule.forFeature([{ name: Product.name, schema: productSchema }]);
