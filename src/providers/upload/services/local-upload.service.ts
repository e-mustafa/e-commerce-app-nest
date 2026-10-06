import { safeMoveFile } from '@/common/utils';
import { BadRequestException, Injectable } from '@nestjs/common';
import fs from 'node:fs/promises';
import path, { extname } from 'node:path';
import {
	CloudinaryResourceType,
	IFile,
	IUploadService,
	TAttachment,
	TDeleteAttachment,
	TUploadFileOptions,
} from '../upload.type';

@Injectable()
export class LocalUploadService implements IUploadService {
	private readonly baseUploadDir: string;

	constructor() {
		// Define base local storage folder relative to project root
		this.baseUploadDir = path.join(__dirname, '../../../', 'uploads');
	}

	private getResourceType(mimetype: string): CloudinaryResourceType {
		if (mimetype.startsWith('image/')) return 'image';
		if (mimetype.startsWith('video/')) return 'video';
		return 'raw';
	}

	/**
	 * Uploads a single file to local disk under the target directory structure
	 */
	async uploadFile(options: TUploadFileOptions): Promise<TAttachment> {
		const { file, folder = 'general', prefix, filename } = options;

		if (!file?.buffer && !file?.path) {
			throw new BadRequestException('File buffer or path is required for local storage upload');
		}

		// Extract original file extension
		const fileExt = extname(file.originalname || '');
		let generatedName = filename;

		// Ensure extension is always appended to custom or generated filename
		if (generatedName) {
			if (!extname(generatedName) && fileExt) {
				generatedName = `${generatedName}${fileExt}`;
			}
		} else {
			generatedName = `${filename || prefix || file.fieldname}_${Date.now()}_${Math.round(Math.random() * 1e9)}${fileExt}`;
		}

		// Resolve full directory path dynamically (e.g., /app/uploads/users/123/profile)
		const targetDir = path.join(this.baseUploadDir, folder);

		// Create folder hierarchy recursively if it does not exist
		await fs.mkdir(targetDir, { recursive: true });

		// Relative path to be stored as the resource ID (e.g., users/123/profile/avatar_123.webp)
		const relativeFilePath = path.join(folder, generatedName).replace(/\\/g, '/');
		const destinationPath = path.join(this.baseUploadDir, relativeFilePath);

		// Save file from buffer or safely move existing file from temp disk location
		if (file.buffer) {
			await fs.writeFile(destinationPath, file.buffer);
		} else if (file.path) {
			await safeMoveFile(file.path, destinationPath);
		}

		const fileUrl = `uploads/${relativeFilePath}`;

		return {
			id: relativeFilePath,
			url: fileUrl,
			resourceType: this.getResourceType(file.mimetype || ''),
		};
	}

	/**
	 * Uploads multiple files sequentially or concurrently to local disk
	 */
	async uploadMultipleFiles(files: IFile[], folder = 'general'): Promise<TAttachment[]> {
		return Promise.all(files.map((file) => this.uploadFile({ file, folder })));
	}

	/**
	 * Deletes a single file from local disk by relative path ID
	 */
	async deleteFile(id: string): Promise<void> {
		const fullPath = path.join(this.baseUploadDir, id);
		try {
			await fs.unlink(fullPath);
		} catch (error: unknown) {
			// Silently ignore if file already does not exist
		}
	}

	/**
	 * Deletes multiple files from local disk
	 */
	async deleteMultipleFiles(files: TDeleteAttachment[]): Promise<void> {
		if (!files.length) return;
		await Promise.all(files.map((file) => this.deleteFile(file.id)));
	}
}
