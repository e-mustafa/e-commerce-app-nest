import { type ConfigType, registerAs } from '@nestjs/config';
import { sortOrderEnum } from '../providers/database/query.enum';
import { StorageDiskEnum, StorageDiskFileEnum, StorageProviderEnum } from '../providers/upload';

export type AppConfig = ConfigType<typeof appConfig>;

export const appConfig = registerAs('app', () => ({
	app: {
		name: process.env.APP_NAME || 'E-commerce App',
		version: '1.0.0',
		description: 'E-commerce App Main API Service',
	},
	auth: {
		password: {
			minLength: 8,
			maxLength: 128,
		},
		resetPasswordLogoutAll: true,
		changePasswordLogoutAll: true,

		refreshToken: {
			expiresIn: 60 * 60 * 24 * 7, // 7 days in seconds
		},
		accessToken: {
			expiresIn: 1000 * 60 * 15, // 15 minutes in milliseconds
		},
	},
	security: {
		jwt: {
			payloadFields: ['id', '_id', 'email', 'firstName', 'remembered'],
		},
	},
	otp: {
		resetPassword: {
			expiresIn: 60 * 10, // 10 minutes
		},
		changeEmail: {
			expiresIn: 60 * 10,
			cooldownPeriod: 60 * 1, // 1 minute
			sendAttempts: 5,
			attemptsExpiration: 3600, // 1 hour
			failedAttempts: 5,
		},
		reactivateAccount: {
			expiresIn: 60 * 10,
		},
		verifyEmail: {
			expiresIn: 60 * 10,
			cooldownPeriod: 60 * 1, // 1 minute
			sendAttempts: 5,
			attemptsExpiration: 3600, // 1 hour
			failedAttempts: 5,
		},
		revertEmail: {
			expiresIn: 60 * 60 * 24 * 7, // 7 days
		},
	},
	uploadStorage: {
		localFolderName: 'uploads',
		// type: (process.env.UPLOAD_STORAGE_TYPE || UploadTypeEnum.CLOUD) as UploadTypeEnum,
		disk: (process.env.UPLOAD_STORAGE_DISK || StorageDiskEnum.DISK_STORAGE) as StorageDiskEnum,
		diskFile: StorageDiskFileEnum.TEMP as StorageDiskFileEnum,
		provider: (process.env.UPLOAD_STORAGE_PROVIDER || StorageProviderEnum.CLOUDINARY) as StorageProviderEnum,
	},
	cache: {
		defaultTTL: 60 * 10, // 10 minutes
	},
	user: {
		avatar: {
			maxSize: 2 * 1024 * 1024, // 2MB
		},
		cover: {
			maxSize: 3 * 1024 * 1024, // 3MB
			maxCovers: 1,
		},
	},
	category: {
		attachments: {
			maxSize: 5 * 1024 * 1024, // 5MB
			icon: { name: 'icon', maxCount: 1 },
			cover: { name: 'cover', maxCount: 1 },
		},
		defaultOrder: sortOrderEnum.DESC,
		defaultLimit: 10,
	},
	brand: {
		attachments: {
			maxSize: 5 * 1024 * 1024, // 5MB
			icon: { name: 'icon', maxCount: 1 },
			cover: { name: 'cover', maxCount: 1 },
		},
		defaultOrder: sortOrderEnum.DESC,
		defaultLimit: 10,
	},
	product: {
		attachments: {
			maxSize: 15 * 1024 * 1024, // 15MB
			maxCount: 10,
		},
		defaultOrder: sortOrderEnum.ASC,
		defaultLimit: 10,
		cacheTTL: 60 * 5,
	},
	review: {
		attachments: {
			maxSize: 10 * 1024 * 1024, // 10MB
			maxCount: 4,
		},
		defaultOrder: sortOrderEnum.ASC,
		defaultLimit: 10,
	},
	cart: {
		defaultOrder: sortOrderEnum.DESC,
		defaultLimit: 10,
	},
	coupon: {
		defaultOrder: sortOrderEnum.DESC,
		defaultLimit: 10,
	},
	notification: {
		defaultOrder: sortOrderEnum.DESC,
		defaultLimit: 10,
	},
	chat: {
		defaultOrder: sortOrderEnum.DESC,
		defaultLimit: 10,
	},
	socket: {
		expiresIn: 60 * 60 * 24 * 7, // 7 days
	},
	routes: {
		frontend: {
			resetPassword: '/auth/reset-password',
			revertEmail: '/auth/revert-email',
		},
	},
}));
