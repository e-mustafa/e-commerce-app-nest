import { z } from 'zod';
import { formatZodErrors } from '../common/validation';
import { StorageDiskEnum, StorageProviderEnum } from '@/providers/upload';

export const envSchema = z.object({
	APP_NAME: z.string().default('Social Media'),
	APP_PORT: z.coerce.number().default(3500),
	APP_URL: z.string().optional(),
	NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
	API_BASE_URL: z.string().default('/api/v1'),
	FRONTEND_URL: z.string().default('http://localhost:3000'),
	ALLOWED_ORIGIN: z.string().default(''),

	// Required infrastructure - Fail-Fast if missing
	DATABASE_URL: z.string().min(1, 'DATABASE_URL is required for Mongoose connection'),
	DATABASE_NAME: z.string().min(1, 'DATABASE_NAME is required').optional(),
	REDIS_URL: z.string().optional(),

	// Upload Storage
	UPLOAD_STORAGE_PROVIDER: z.enum(Object.values(StorageProviderEnum)).default(StorageProviderEnum.LOCAL),
	UPLOAD_STORAGE_DISK: z.enum(Object.values(StorageDiskEnum)).default(StorageDiskEnum.DISK_STORAGE),

	// Security & Encryption Keys
	SALT_ROUND: z.coerce.number().default(10),
	ENCRYPTION_KEY: z.string().min(32, 'ENCRYPTION_KEY must be at least 32 characters'),
	IV_LENGTH: z.coerce.number().default(16),

	// JWT Tokens Requirements
	ACCESS_TOKEN_USER_LEVEL: z.string().min(1, 'USER Access Token Secret is required'),
	REFRESH_TOKEN_USER_LEVEL: z.string().min(1, 'USER Refresh Token Secret is required'),
	ACCESS_TOKEN_USER_EXPIRES_IN: z.string().default('15m'),
	REFRESH_TOKEN_USER_EXPIRES_IN: z.string().default('7d'),

	ACCESS_TOKEN_ADMIN_LEVEL: z.string().optional(),
	REFRESH_TOKEN_ADMIN_LEVEL: z.string().optional(),
	ACCESS_TOKEN_ADMIN_EXPIRES_IN: z.string().default('10m'),
	REFRESH_TOKEN_ADMIN_EXPIRES_IN: z.string().default('3d'),

	// Third party providers
	GOOGLE_CLIENT_ID: z.string().optional(),
	GOOGLE_CLIENT_SECRET: z.string().optional(),
	GOOGLE_REDIRECT_URI: z.string().optional(),

	// Cloudinary
	CLOUDINARY_NAME: z.string().optional(),
	CLOUDINARY_API_KEY: z.string().optional(),
	CLOUDINARY_API_SECRET: z.string().optional(),

	// AWS
	AWS_REGION: z.string().optional(),
	AWS_BUCKET_NAME: z.string().optional(),
	AWS_ACCESS_KEY_ID: z.string().optional(),
	AWS_SECRET_ACCESS_KEY: z.string().optional(),

	// mail - Gmail
	MAIL_SERVICE: z.string().optional(),
	GOOGLE_APP_PASSWORD: z.string().optional(),
	GOOGLE_APP_EMAIL: z.string().optional(),

	// Firebase
	FIREBASE_SERVICE_ACCOUNT_DATA: z.string().optional(),
});

export type EnvConfig = z.infer<typeof envSchema>;

// Validation function passed directly to ConfigModule
export const validateEnv = (config: Record<string, unknown>) => {
	const result = envSchema.safeParse(config);
	if (!result.success) {
		const errors = formatZodErrors(result.error.issues);
		console.error('Invalid environment variables:', errors);
		//TODO - Add error handling
		throw new Error('Environment validation failed');
	}
	return result.data;
};
