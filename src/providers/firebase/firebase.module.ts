import { type EnvConfig, envConfig } from '@/config';
import { NotificationModule } from '@/modules/notification/notification.module';
import { UserModule } from '@/modules/user/user.module';
import { forwardRef, Global, Logger, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import chalk from 'chalk';
import { cert, initializeApp, ServiceAccount } from 'firebase-admin/app';
import { getMessaging } from 'firebase-admin/messaging';
import { FIREBASE_SERVICE, FirebaseService } from './firebase.service';

@Global()
@Module({
	imports: [ConfigModule, forwardRef(() => UserModule), forwardRef(() => NotificationModule)],
	providers: [
		{
			provide: FIREBASE_SERVICE,
			inject: [envConfig.KEY],
			useFactory: (ENV: EnvConfig) => {
				const logger = new Logger('FirebaseModule', { timestamp: false });
				try {
					// const keyPath = resolve(ENVFirebaseAccountFile);
					// if (!existsSync(keyPath)) throw new Error('Firebase service account file not found');
					// serviceAccount = JSON.parse(readFileSync(keyPath, 'utf8')) as ServiceAccount;

					// use one line data in .env instead of file
					const serviceAccount: ServiceAccount = ENV.firebase.accountData ? JSON.parse(ENV.firebase.accountData) : {};
					const notificationApp = initializeApp({
						credential: cert(serviceAccount),
					});

					logger.log(chalk.underline.underlineWhite('✅ Firebase connected successfully.'));

					return getMessaging(notificationApp);
				} catch (error) {
					// console.error('Error parsing Firebase service account file:', error);
					logger.error('❌ Firebase connection error:', error);
					throw error;
				}
			},
		},
		FirebaseService,
	],
	exports: [FirebaseService],
})
export class FirebaseModule {}
