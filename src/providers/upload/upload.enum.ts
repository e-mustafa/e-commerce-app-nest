export const UploadTypeEnum = {
	LOCAL: 'local',
	CLOUD: 'cloud',
} as const;

export type UploadTypeEnum = (typeof UploadTypeEnum)[keyof typeof UploadTypeEnum];

export const StorageDiskEnum = {
	MEMORY_STORAGE: 'memoryStorage',
	DISK_STORAGE: 'diskStorage',
} as const;

export type StorageDiskEnum = (typeof StorageDiskEnum)[keyof typeof StorageDiskEnum];

export const StorageDiskFileEnum = {
	TEMP: 'temp',
	PERMANENT: 'permanent',
} as const;

export type StorageDiskFileEnum = (typeof StorageDiskFileEnum)[keyof typeof StorageDiskFileEnum];

export const StorageProviderEnum = {
	CLOUDINARY: 'cloudinary',
	AWS_S3: 'awsS3',
	LOCAL: 'local',
} as const;

export type StorageProviderEnum = (typeof StorageProviderEnum)[keyof typeof StorageProviderEnum];
