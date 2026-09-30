import { Request } from 'express';
import { StorageDiskEnum } from './upload.enum';
import { fileTypes } from './utils/mime-types';

export type IFile = Express.Multer.File;
export type TFileType = keyof typeof fileTypes;
export type TAttachment = {
	id: string;
	url: string;
	resourceType: CloudinaryResourceType;
};

export type TDeleteAttachment = {
	id: string;
	url?: string;
	resourceType: CloudinaryResourceType;
};

export type CloudinaryResourceType = 'image' | 'video' | 'raw';

export interface TUploadFileOptions {
	file: IFile;
	folder?: string;
	filename?: string;
	prefix?: string;
	contentType?: string;
	storageDisk?: StorageDiskEnum;
}

export interface IUploadService {
	uploadFile(options: TUploadFileOptions): Promise<TAttachment>;
	uploadMultipleFiles(files: IFile[], folder?: string): Promise<TAttachment[]>;
	deleteFile(id: string, resourceType?: CloudinaryResourceType): Promise<void>;
	deleteMultipleFiles(files: TDeleteAttachment[]): Promise<void>;
}

export type TUploadDirOption = string | ((req: Request) => string);
export interface IFieldOption {
	name: string;
	maxCount?: number;
}
