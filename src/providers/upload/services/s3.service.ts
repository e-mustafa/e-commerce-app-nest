import { InternalException } from '@/common/exceptions';
import { type AppConfig, appConfig, type EnvConfig, envConfig } from '@/config';
import { DeleteObjectCommand, DeleteObjectsCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { Inject, Injectable } from '@nestjs/common';
import { extname } from 'node:path';
import { CloudinaryResourceType, IFile, IUploadService, TAttachment, TUploadFileOptions } from '../upload.type';

@Injectable()
export class S3Service implements IUploadService {
	private client: S3Client;
	private bucket: string;
	private region: string;

	constructor(
		@Inject(envConfig.KEY) private readonly ENV: EnvConfig,
		@Inject(appConfig.KEY) private readonly APP: AppConfig,
	) {
		this.region = this.ENV.aws.region;
		this.bucket = this.ENV.aws.bucket;
		this.client = new S3Client({
			region: this.region,
			credentials: {
				accessKeyId: this.ENV.aws.accessKeyId,
				secretAccessKey: this.ENV.aws.secretAccessKey,
			},
		});
	}

	private getResourceType(mimetype: string): CloudinaryResourceType {
		if (mimetype.startsWith('image/')) return 'image';
		if (mimetype.startsWith('video/')) return 'video';
		return 'raw';
	}

	async uploadFile(options: TUploadFileOptions): Promise<TAttachment> {
		const { file, folder = 'general', prefix = 'file', filename } = options;
		const appName = this.APP.app.name.replace(/\s+/g, '_');
		const generatedName =
			filename || `${prefix}_${Date.now()}_${Math.round(Math.random() * 1e9)}${extname(file.originalname)}`;
		const key = `${appName}/${folder}/${generatedName}`;
		const contentType = options.contentType || file.mimetype || 'application/octet-stream';

		try {
			await this.client.send(
				new PutObjectCommand({
					Bucket: this.bucket,
					Key: key,
					Body: file.buffer,
					ContentType: contentType,
				}),
			);

			return {
				id: key,
				url: `https://${this.bucket}.s3.${this.region}.amazonaws.com/${key}`,
				resourceType: this.getResourceType(contentType),
			};
		} catch (error) {
			throw new InternalException(`S3 Upload failed: ${(error as Error).message}`);
		}
	}

	async uploadMultipleFiles(files: IFile[], folder = 'general'): Promise<TAttachment[]> {
		return Promise.all(files.map((file) => this.uploadFile({ file, folder })));
	}

	async deleteFile(key: string): Promise<void> {
		await this.client.send(new DeleteObjectCommand({ Bucket: this.bucket, Key: key }));
	}

	async deleteMultipleFiles(files: TAttachment[]): Promise<void> {
		if (!files.length) return;
		await this.client.send(
			new DeleteObjectsCommand({
				Bucket: this.bucket,
				Delete: { Objects: files.map((f) => ({ Key: f.id })) },
			}),
		);
	}
}
