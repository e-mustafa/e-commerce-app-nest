import { AppException, BadRequestException, InternalException } from '@/common/exceptions';
import { AppConfig } from '@/config';
import { Request } from 'express';
import { diskStorage, FileFilterCallback, memoryStorage, StorageEngine } from 'multer';
import fs from 'node:fs/promises';
import path from 'node:path';
import { StorageDiskEnum, StorageDiskFileEnum } from './upload.enum';
import { TFileType, TUploadDirOption } from './upload.type';
import { resolveFileTypes } from './utils/mime-types';

export const setMulterStorage = (config: AppConfig, dir: TUploadDirOption = 'general'): StorageEngine => {
	const { disk, diskFile, localFolderName = 'uploads' } = config.uploadStorage || {};

	// Memory Storage
	if (disk === StorageDiskEnum.MEMORY_STORAGE) return memoryStorage();

	const saveInTemp = diskFile === StorageDiskFileEnum.TEMP;

	// Disk Storage
	return diskStorage({
		destination: async (req, _file, cb) => {
			try {
				// Resolve dynamic directory if a function is provided
				const resolvedDir = typeof dir === 'function' ? dir(req) : dir;

				// Normalize resolved directory and strip redundant leading 'temp' prefix
				const cleanResolvedDir = resolvedDir.replace(/^(\/?temp\/?)/i, '');

				const baseDir = saveInTemp
					? path.resolve(process.cwd(), localFolderName, 'temp', cleanResolvedDir)
					: path.resolve(process.cwd(), localFolderName, resolvedDir);

				// ? path.join(os.tmpdir(), localFolderName, resolvedDir)

				await fs.mkdir(baseDir, { recursive: true });
				cb(null, baseDir);
			} catch (err) {
				cb(new InternalException(`Server failed to allocate upload space: ${(err as AppException).message || ''}`), '');
			}
		},
		filename: (_req, file, cb) => {
			const fileExt = path.extname(file.originalname);
			const uniqueFilename = `${file.fieldname}-${Date.now()}-${Math.round(Math.random() * 1e9)}${fileExt}`;
			cb(null, uniqueFilename);
		},
	});
};

export const createFileFilter = (typeInput: TFileType | TFileType[]) => {
	return (_req: Request, file: Express.Multer.File, cb: FileFilterCallback) => {
		const { allowedList, friendlyMsg } = resolveFileTypes(typeInput);

		if (!allowedList) {
			return cb(
				new InternalException(`Developer Error: Invalid file type category provided: ${JSON.stringify(typeInput)}`),
			);
		}

		const isAll = Array.isArray(typeInput) ? typeInput.includes('all') : typeInput === 'all';

		if (isAll || allowedList.includes(file.mimetype)) {
			cb(null, true);
		} else {
			cb(new BadRequestException(`Invalid file format! Allowed formats: ${friendlyMsg}`));
		}
	};
};
