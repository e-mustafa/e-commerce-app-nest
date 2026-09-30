import { ZodType } from 'zod';

// Allowed request keys for validation target
export type TSchemaKey = 'body' | 'query' | 'params' | 'cookies' | 'headers' | 'file' | 'files';

// Structure for formatted field validation error messages
export type IFieldErrors = {
	[key in TSchemaKey]?: Record<string, string>;
};

// Map of schema definitions per request key
export type TSchema = Partial<Record<TSchemaKey, ZodType>>;
