import { type Id } from '@/common/types';
import {
	DBImage,
	LocalizedText,
	LocalizedTextOptional,
	LocalizedTextOptionalSchema,
	LocalizedTextSchema,
	SeoMetadata,
	SeoMetadataSchema,
	validateAtLeastOneLanguage,
} from '@/providers/database';
import { MongooseModule, Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Schema as MongooseSchema } from 'mongoose';
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
	// Translatable primary title (requires at least one language)
	@Prop({
		type: LocalizedTextSchema,
		required: true,
		validate: {
			validator: validateAtLeastOneLanguage,
			message: 'Product title must contain at least one language (ar or en)',
		},
	})
	title: LocalizedText;

	// Unique URL Slug (shared across application and SEO canonical URLs)
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

	// Translatable short description
	@Prop({ type: LocalizedTextOptionalSchema, required: false })
	excerpt?: LocalizedTextOptional;

	// Translatable detailed description (requires at least one language)
	@Prop({
		type: LocalizedTextSchema,
		required: true,
		validate: {
			validator: validateAtLeastOneLanguage,
			message: 'Product description must contain at least one language (ar or en)',
		},
	})
	description: LocalizedText;

	// Pricing & Stock Attributes
	@Prop({ type: Number, required: true, min: [0, 'Price cannot be negative'] })
	price: number;

	@Prop({ type: Number, min: [0, 'Discount price cannot be negative'], default: 0 })
	discountPrice?: number;

	@Prop({ type: Number, min: [0, 'Discount price cannot be negative'], default: 0 })
	costPrice?: number;

	@Prop({ type: Number, required: true, min: [0, 'Stock cannot be negative'], default: 0 })
	stock: number;

	@Prop({ type: String, required: true,  })
	stockType: string;

	@Prop({ type: Number, required: true, min: [0, 'Maximum order quantity cannot be negative'], default: 1 })
	maxOrderQuantity: number;

	// Categorization Relations
	@Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Category', required: true })
	category: MongooseSchema.Types.ObjectId;

	@Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Brand', required: false })
	brand?: MongooseSchema.Types.ObjectId;

	// Media
	@Prop({ type: DBImage, default: null })
	cover?: DBImage | null;

	@Prop({ type: [DBImage], default: [] })
	images: DBImage[];

	// Embedded Optional SEO Configurations
	@Prop({ type: SeoMetadataSchema, required: false })
	seo?: SeoMetadata;

	// Ratings & Metrics
	@Prop({ type: Number, default: 0, min: 0, max: 5 })
	ratingsAverage: number;

	@Prop({ type: Number, default: 0 })
	ratingsQuantity: number;

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

// -----------------------------------------------------------------------------
// Virtuals for SEO Fallback
// -----------------------------------------------------------------------------

// Virtual field to dynamically return SEO metadata with fallback values
productSchema.virtual('metaSeo').get(function (this: Product) {
	return {
		title: {
			ar: this.seo?.title?.ar || this.title?.ar || '',
			en: this.seo?.title?.en || this.title?.en || '',
		},
		description: {
			ar: this.seo?.description?.ar || this.excerpt?.ar || this.description?.ar || '',
			en: this.seo?.description?.en || this.excerpt?.en || this.description?.en || '',
		},
		image: this.cover || (this.images && this.images.length > 0 ? this.images[0] : null),
		keywords: this.seo?.keywords || [],
	};
});

// -----------------------------------------------------------------------------
// Indexes for Performance
// -----------------------------------------------------------------------------

productSchema.index({ category: 1, publishedAt: -1 });
productSchema.index({ price: 1, ratingsAverage: -1 });
productSchema.index({ publishedAt: 1, order: 1 });
productSchema.index({ deletedAt: 1 });

export const productModel = MongooseModule.forFeature([{ name: Product.name, schema: productSchema }]);
