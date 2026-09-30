import { AppEventEmitter } from '@/providers/event/typed-event-emitter.service';
import { MailModule } from '@/providers/mail/mail.module';
import { RedisModule } from '@/providers/redis/redis.module';
import { SecurityModule } from '@/providers/security/security.module';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { userModel } from '../user/user.model';
import { UserRepository } from '../user/user.repository';
import AuthController from './auth.controller';
import { RedisAuthKeyBuilder } from './redis/auth.redis.keys';
import { ReactiveAccountRedisService } from './redis/reactive-account.redis.service';
import { RefreshTokenRedisService } from './redis/refresh-token.redis.service';
import { ResetPasswordRedisService } from './redis/reset-password.redis.service';
import { VerifyAccountOtpRedisService } from './redis/verify-account-otp.redis.service';
import AuthService from './services/auth.service';
import { CookieService } from './services/cookie.service';

@Module({
	controllers: [AuthController],
	providers: [
		AuthService,
		UserRepository,
		RedisAuthKeyBuilder,
		CookieService,
		VerifyAccountOtpRedisService,
		RefreshTokenRedisService,
		ReactiveAccountRedisService,
		ResetPasswordRedisService,

		//? add to security module exports and import in imports
		// GoogleAuthService,
		// OAuth2Client, // Registered as a Provider, not a Module
		// TokenService,
		// JwtService,
		// HashingService,
		// EncryptionService,
		AppEventEmitter,
	],
	imports: [
		ConfigModule,
		userModel,
		RedisModule, // Exported RedisService is naturally injected without declaring it in providers
		SecurityModule, // Exported RedisService is naturally injected without declaring it in providers
		MailModule,
	],
	exports: [CookieService],
})
export default class AuthModule {}
