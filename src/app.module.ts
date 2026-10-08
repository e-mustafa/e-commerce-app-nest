import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'node:path';
import { GlobalExceptionFilter } from './common/filters';
import { ImagePathInterceptor } from './common/interceptors';
import { appConfig, envConfig } from './config';
import { validateEnv } from './config/env.schema';
import AuthModule from './modules/auth/auth.module';
import { BrandModule } from './modules/brand/brand.module';
import { CartModule } from './modules/cart/cart.module';
import { CategoryModule } from './modules/category/category.module';
import { CouponModule } from './modules/coupon/coupon.module';
import { ProductModule } from './modules/product/product.module';
import { ReviewModule } from './modules/review/review.module';
import { UserModule } from './modules/user/user.module';
import { DatabaseModule } from './providers/database/database.module';
import { EventModule } from './providers/event/event.module';
import { FirebaseModule } from './providers/firebase/firebase.module';
import { MailModule } from './providers/mail/mail.module';
import { RedisModule } from './providers/redis/redis.module';
import { SecurityModule } from './providers/security/security.module';
import { UploadModule } from './providers/upload/upload.module';
import { OrderModule } from './modules/order/order.module';
// export const { ObserveModule, ObserveInstrument } = createObserveModule();

@Module({
	imports: [
		// ENV Module
		ConfigModule.forRoot({
			isGlobal: true, // Makes ConfigService available across all modules
			load: [envConfig, appConfig], // Load our structured namespace
			validate: validateEnv, // Validates .env file on application bootstrap
		}),

		// Serve Static Files
		ServeStaticModule.forRoot({
			rootPath: join(__dirname, 'uploads'),
			serveRoot: '/uploads',
		}),

		// Global common modules/Providers
		DatabaseModule,
		RedisModule,
		SecurityModule,
		MailModule,
		EventModule,
		UploadModule,
		FirebaseModule,

		// Core Feature Modules
		UserModule,
		AuthModule,
		CategoryModule,
		BrandModule,
		ProductModule,
		CartModule,
		ReviewModule,
		CouponModule,
		OrderModule,
		// NotificationModule,
	],
	controllers: [],
	providers: [
		{
			provide: APP_FILTER,
			useClass: GlobalExceptionFilter, // NestJS will instantiate this class and inject envConfig automatically
		},
		{
			// add domain to uploaded file url - if no domain is provided
			provide: APP_INTERCEPTOR,
			useClass: ImagePathInterceptor,
		},
	],
})
export class AppModule {}
