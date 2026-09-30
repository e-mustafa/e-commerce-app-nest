import { InternalException } from '@/common/exceptions';
import { type EnvConfig, envConfig } from '@/config';
import { Inject, Injectable } from '@nestjs/common';
import { v2 as cloudinary, UploadApiOptions } from 'cloudinary';
import streamifier from 'streamifier';
import { CloudinaryResourceType, IFile, IUploadService, TAttachment, TUploadFileOptions } from '../upload.type';
import fs from 'node:fs';

@Injectable()
export class CloudinaryService implements IUploadService {
	constructor(@Inject(envConfig.KEY) private readonly ENV: EnvConfig) {
		cloudinary.config({
			cloud_name: this.ENV.cloudinary.name,
			api_key: this.ENV.cloudinary.apiKey,
			api_secret: this.ENV.cloudinary.apiSecret,
			secure: true,
		});
	}

	private getResourceType(mimetype: string): CloudinaryResourceType {
		if (mimetype.startsWith('image/')) return 'image';
		if (mimetype.startsWith('video/')) return 'video';
		return 'raw';
	}

	/**
	 * Uploads a single file buffer or stream to Cloudinary
	 */
	async uploadFile(options: TUploadFileOptions): Promise<TAttachment> {
		const { file, folder = 'general', prefix = 'file', filename } = options;

		if (!file?.buffer && !file?.path) {
			throw new InternalException('File buffer or path is required for Cloudinary upload');
		}

		return new Promise((resolve, reject) => {
			const publicId = filename || `${prefix}_${Date.now()}_${Math.round(Math.random() * 1e5)}`;
			const resourceType = this.getResourceType(file.mimetype || '');

			const uploadOptions: UploadApiOptions = {
				folder,
				public_id: publicId,
				overwrite: true,
				invalidate: true,
				resource_type: resourceType,
			};

			const uploadStream = cloudinary.uploader.upload_stream(uploadOptions, (error, result) => {
				if (error || !result) {
					return reject(new InternalException(error?.message || 'Cloudinary upload failed'));
				}

				resolve({
					id: result.public_id,
					url: result.secure_url,
					resourceType: result.resource_type as CloudinaryResourceType,
				});
			});

			if (file.buffer) {
				streamifier.createReadStream(file.buffer).pipe(uploadStream);
			} else if (file.path) {
				fs.createReadStream(file.path).pipe(uploadStream);
			}
		});
	}

	/**
	 * Uploads multiple files concurrently with rollback on error
	 */
	async uploadMultipleFiles(files: IFile[], folder: string = 'general'): Promise<TAttachment[]> {
		const results = await Promise.allSettled(files.map((file) => this.uploadFile({ file, folder })));

		const successful = results
			.filter((res): res is PromiseFulfilledResult<TAttachment> => res.status === 'fulfilled')
			.map((res) => res.value);

		const failedCount = results.filter((res) => res.status === 'rejected').length;

		if (failedCount > 0) {
			await this.deleteMultipleFiles(successful);
			throw new InternalException(`Failed to upload ${failedCount} file(s). Upload rolled back.`);
		}

		return successful;
	}

	/**
	 * Deletes a single resource from Cloudinary
	 */
	async deleteFile(id: string, resourceType: CloudinaryResourceType = 'image'): Promise<void> {
		await cloudinary.uploader.destroy(id, { resource_type: resourceType, invalidate: true });
	}

	/**
	 * Deletes multiple resources grouped by resource type
	 */
	async deleteMultipleFiles(files: TAttachment[]): Promise<void> {
		if (!files.length) return;
		const grouped = files.reduce<Record<CloudinaryResourceType, string[]>>(
			(acc, file) => {
				acc[file.resourceType].push(file.id);
				return acc;
			},
			{ image: [], video: [], raw: [] },
		);

		for (const [type, ids] of Object.entries(grouped)) {
			if (ids.length > 0) {
				await cloudinary.api.delete_resources(ids, { resource_type: type as CloudinaryResourceType });
			}
		}
	}
}

// TODO - add remove files from local desk if local upload used
