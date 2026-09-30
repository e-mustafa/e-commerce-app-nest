import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

@Schema({ _id: false })
export class DBImage {
	@Prop({ type: String, trim: true })
	id: string;

	@Prop({ type: String, required: true, trim: true })
	url: string;
}

export const DBImageSchema = SchemaFactory.createForClass(DBImage);

// -----------------------------------------------------------------------------
// Reusable i18n Sub-Schemas & Validation
// -----------------------------------------------------------------------------

// Sub-schema for translatable text fields
@Schema({ _id: false })
export class LocalizedText {
	@Prop({ type: String, trim: true })
	ar?: string;

	@Prop({ type: String, trim: true })
	en?: string;
}
export const LocalizedTextSchema = SchemaFactory.createForClass(LocalizedText);

// Custom validator to ensure at least one language (ar or en) is provided
export const validateAtLeastOneLanguage = (value: LocalizedText): boolean => {
	return !!(value && (value.ar?.trim() || value.en?.trim()));
};

// Sub-schema for fully optional translatable text
@Schema({ _id: false })
export class LocalizedTextOptional {
	@Prop({ type: String, trim: true, default: '' })
	ar?: string;

	@Prop({ type: String, trim: true, default: '' })
	en?: string;
}
export const LocalizedTextOptionalSchema = SchemaFactory.createForClass(LocalizedTextOptional);

// Sub-schema for SEO metadata management
@Schema({ _id: false })
export class SeoMetadata {
	@Prop({ type: LocalizedTextOptionalSchema, required: false })
	title?: LocalizedTextOptional;

	@Prop({ type: LocalizedTextOptionalSchema, required: false })
	description?: LocalizedTextOptional;

	@Prop({ type: [String], default: [] })
	keywords?: string[];
}
export const SeoMetadataSchema = SchemaFactory.createForClass(SeoMetadata);
