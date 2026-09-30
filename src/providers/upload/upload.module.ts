import { appConfig, type AppConfig } from '@/config';
import { Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { CloudinaryService } from './services/cloudinary.service';
import { LocalUploadService } from './services/local-upload.service';
import { S3Service } from './services/s3.service';
import { UPLOAD_SERVICE } from './upload.constants';
import { StorageProviderEnum } from './upload.enum';

@Global()
@Module({
	imports: [ConfigModule],
	providers: [
		CloudinaryService,
		S3Service,
		LocalUploadService,
		{
			provide: UPLOAD_SERVICE,
			inject: [appConfig.KEY, LocalUploadService, S3Service, CloudinaryService],
			useFactory(APP: AppConfig, local: LocalUploadService, S3: S3Service, cloudinary: CloudinaryService) {
				const provider = APP.uploadStorage.provider;
				console.log('upload provider', provider);
				if (provider === StorageProviderEnum.CLOUDINARY) return cloudinary;
				if (provider === StorageProviderEnum.AWS_S3) return S3;
				return local;
			},
		},
	],
	exports: [UPLOAD_SERVICE],
})
export class UploadModule {}
