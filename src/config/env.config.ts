import { type ConfigType, registerAs } from '@nestjs/config';

export type EnvConfig = ConfigType<typeof envConfig>;

// Helper function to parse numeric env variables safely
const parseEnvNumber = (value: string | undefined, fallback: number): number => {
	if (!value) return fallback;
	const parsed = Number(value);
	return Number.isNaN(parsed) ? fallback : parsed;
};

export const envConfig = registerAs('env', () => {
	const port: number = parseEnvNumber(process.env.APP_PORT, 3500);
	const baseUrl: string = process.env.APP_URL ? `${process.env.APP_URL}:${port}` : `http://localhost:${port}`;

	return {
		appName: process.env.APP_NAME || 'E-Commerce App',
		port,
		environment: process.env.NODE_ENV || 'development',
		isDev: (process.env.NODE_ENV || 'development') === 'development',
		appUrl: baseUrl,
		apiBaseUrl: process.env.API_BASE_URL || '/api/v1',
		apiBaseUrlVersion: process.env.API_BASE_URL_VERSION || '1',
		apiBaseUrlPrefix: process.env.API_BASE_URL_PREFIX || 'api',
		frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
		allowedOrigin: process.env.ALLOWED_ORIGIN || '',
		db: {
			dbUrl: process.env.DATABASE_URL || '',
			dbName: process.env.DATABASE_NAME || '',
			redisUrl: process.env.REDIS_URL || '',
		},
		security: {
			hashing: {
				salt: parseEnvNumber(process.env.SALT_ROUND, 12),
			},

			encryption: {
				algorithm: 'aes-256-cbc',
				encKey: process.env.ENCRYPTION_KEY || '',
				iv: parseEnvNumber(process.env.IV_LENGTH, 16),
			},
		},
		jwt: {
			user: {
				accessTokenSecret: process.env.ACCESS_TOKEN_USER_LEVEL || '',
				refreshTokenSecret: process.env.REFRESH_TOKEN_USER_LEVEL || '',
				accessTokenExpires: parseEnvNumber(process.env.ACCESS_TOKEN_USER_EXPIRES_IN, 900), // 15 mins in seconds
				refreshTokenExpires: parseEnvNumber(process.env.REFRESH_TOKEN_USER_EXPIRES_IN, 604800), // 7 days in seconds
			},
			admin: {
				accessTokenSecret: process.env.ACCESS_TOKEN_ADMIN_LEVEL || '',
				refreshTokenSecret: process.env.REFRESH_TOKEN_ADMIN_LEVEL || '',
				accessTokenExpires: parseEnvNumber(process.env.ACCESS_TOKEN_ADMIN_EXPIRES_IN, 600), // 10 mins in seconds
				refreshTokenExpires: parseEnvNumber(process.env.REFRESH_TOKEN_ADMIN_EXPIRES_IN, 259200), // 3 days in seconds
			},
		},
		providers: {
			google: {
				clientId: process.env.GOOGLE_CLIENT_ID || '',
				clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
				redirectUri: process.env.GOOGLE_REDIRECT_URI || '',
			},
		},
		cloudinary: {
			name: process.env.CLOUDINARY_NAME || '',
			apiKey: process.env.CLOUDINARY_API_KEY || '',
			apiSecret: process.env.CLOUDINARY_API_SECRET || '',
		},
		aws: {
			region: process.env.AWS_REGION || '',
			bucket: process.env.AWS_BUCKET_NAME || '',
			accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
			secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
		},
		mail: {
			// host: process.env.MAIL_HOST || '',
			// port: parseEnvNumber(process.env.MAIL_PORT, 587),
			// user: process.env.MAIL_USER || '',
			// password: process.env.MAIL_PASSWORD || '',
			// from: process.env.MAIL_FROM || '',

			service: process.env.MAIL_SERVICE,
			googleEmail: process.env.GOOGLE_APP_EMAIL,
			googleAppPassword: process.env.GOOGLE_APP_PASSWORD,
		},
		firebase: {
			// accountFile: process.env.FIREBASE_SERVICE_ACCOUNT_File || '',
			accountData: process.env.FIREBASE_SERVICE_ACCOUNT_DATA || '',
		},
	};
});
