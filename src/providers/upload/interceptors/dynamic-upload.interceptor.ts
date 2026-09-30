import { BadRequestException } from '@/common/exceptions';
import { type AppConfig, appConfig } from '@/config';
import { CallHandler, ExecutionContext, Inject, Injectable, mixin, NestInterceptor, Type } from '@nestjs/common';
import { Request, Response } from 'express';
import multer from 'multer';
import fs from 'node:fs/promises';
import { Observable } from 'rxjs';
import { createFileFilter, setMulterStorage } from '../multer-options.storage';
import { IFieldOption, TFileType, TUploadDirOption } from '../upload.type';
import { fileTypes } from '../utils/mime-types';
import { verifyFileSignatures } from '../utils/verify-file-signatures';

export interface IDynamicUploadOptions {
	fieldName?: string;
	fields?: IFieldOption[];
	fileType?: TFileType | TFileType[];
	maxSize?: number;
	maxCount?: number;
	dir?: TUploadDirOption;
}

export function DynamicUploadInterceptor(options: IDynamicUploadOptions): Type<NestInterceptor> {
	@Injectable()
	class MixinUploadInterceptor implements NestInterceptor {
		constructor(@Inject(appConfig.KEY) private readonly APP: AppConfig) {}

		async intercept(context: ExecutionContext, next: CallHandler): Promise<Observable<unknown>> {
			const cxt = context.switchToHttp();
			const req = cxt.getRequest<Request>();
			const res = cxt.getResponse<Response>();

			const {
				fieldName,
				fields,
				fileType = fileTypes.images,
				maxCount,
				dir = 'temp',
				maxSize = 2 * 1024 * 1024,
			} = options;

			const storage = setMulterStorage(this.APP, dir);
			const upload = multer({
				storage,
				fileFilter: createFileFilter(fileType),
				limits: { fileSize: maxSize },
			});

			// Standardized type definition to handle standard express middleware functions
			let uploadMiddleware: (req: Request, res: Response, callback: (err?: unknown) => void) => void;

			if (fields && fields.length > 0) {
				const multerFields = fields.map((f) => ({
					name: f.name,
					maxCount: f.maxCount || 1,
				}));
				uploadMiddleware = upload.fields(multerFields);
			} else if (fieldName) {
				// Uses upload.single for single files to attach result to req.file
				uploadMiddleware = maxCount && maxCount > 1 ? upload.array(fieldName, maxCount) : upload.single(fieldName);
			} else {
				throw new BadRequestException('Either fieldName or fields must be provided in upload options.');
			}

			await new Promise<void>((resolve, reject) => {
				uploadMiddleware(req, res, (err: unknown) => {
					if (!err) return resolve();

					if (err instanceof multer.MulterError) {
						let message = `File upload error: ${err.message}`;

						if (err.code === 'LIMIT_FILE_SIZE') {
							const mb = (maxSize / (1024 * 1024)).toFixed(1);
							message = `File size too large. Maximum allowed size is ${mb}MB.`;
							return reject(new BadRequestException(message, undefined, 'multer_limit_file_size'));
						}

						if (err.code === 'LIMIT_UNEXPECTED_FILE') {
							const receivedField = err.field;
							message = receivedField
								? `Unexpected field '${receivedField}' encountered during upload.`
								: `Unexpected file field received.`;

							return reject(new BadRequestException(message, undefined, 'multer_limit_file_count'));
						}

						if (err.code === 'LIMIT_FILE_COUNT') {
							message = `Too many files uploaded for the specified fields.`;
							return reject(new BadRequestException(message, undefined, 'multer_limit_file_count'));
						}

						return reject(new BadRequestException(message, undefined, `multer_${err.code}`));
					}

					return reject(err);
				});
			});

			// Extract all uploaded files for signature verification
			const uploadedFilesList: Express.Multer.File[] = [];

			if (req.file) {
				uploadedFilesList.push(req.file);
			}

			if (req.files) {
				if (Array.isArray(req.files)) {
					uploadedFilesList.push(...req.files);
				} else {
					Object.values(req.files).forEach((fileArray) => {
						if (Array.isArray(fileArray)) {
							uploadedFilesList.push(...fileArray);
						}
					});
				}
			}

			if (uploadedFilesList.length === 0) return next.handle();

			try {
				await verifyFileSignatures(uploadedFilesList, fileType);
			} catch (error) {
				// Clean up all uploaded files if signature verification fails
				await Promise.all(
					uploadedFilesList.map((file) => (file.path ? fs.unlink(file.path).catch(() => null) : Promise.resolve())),
				);
				throw error;
			}

			return next.handle();
		}
	}

	return mixin(MixinUploadInterceptor);
}
