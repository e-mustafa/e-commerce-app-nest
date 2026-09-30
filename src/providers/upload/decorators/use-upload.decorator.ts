import { UseInterceptors } from '@nestjs/common';
import { DynamicUploadInterceptor } from '../interceptors/dynamic-upload.interceptor';
import { TFileType, TUploadDirOption } from '../upload.type';

/**
 * Custom decorator to handle single-file uploads with dynamic storage,
 * file-size limits, and magic-byte signature verification.
 */
export const UseUpload = (options: {
	fieldName?: string;
	fields?: { name: string; maxCount?: number }[]; // IFieldOption[];
	fileType?: TFileType | TFileType[];
	maxSize?: number;
	maxCount?: number;
	dir?: TUploadDirOption;
}): MethodDecorator & ClassDecorator => UseInterceptors(DynamicUploadInterceptor(options));

// export const UseUpload = (options: IDynamicUploadOptions) => UseInterceptors(DynamicUploadInterceptor(options));
