import { Id } from '@/common/types';
import { type AppConfig, appConfig } from '@/config';
import { RedisService } from '@/providers/redis/redis.service';
import { Inject, Injectable } from '@nestjs/common';
import { RedisAuthKeyBuilder } from './auth.redis.keys';

export interface IResetPasswordRedisService {
	set(token: string, userId: Id, expiration?: number | string): Promise<void>;
	get(token: string): Promise<string | null>;
	delete(token: string): Promise<void>;
}

@Injectable()
export class ResetPasswordRedisService implements IResetPasswordRedisService {
	private readonly tokenExpiration: number;

	constructor(
		@Inject(appConfig.KEY) private readonly APP: AppConfig,
		private readonly redisService: RedisService,
		private readonly redisKeys: RedisAuthKeyBuilder,
	) {
		this.tokenExpiration = this.APP.otp.resetPassword.expiresIn;
	}

	public async set(token: string, userId: Id, expiration?: number | string): Promise<void> {
		return await this.redisService.set(
			this.redisKeys.resetPasswordToken(token),
			userId.toString(),
			expiration ? Number(expiration) : this.tokenExpiration,
		);
	}

	public async get(token: string): Promise<string | null> {
		return await this.redisService.get(this.redisKeys.resetPasswordToken(token));
	}

	public async delete(token: string): Promise<void> {
		return await this.redisService.delete(this.redisKeys.resetPasswordToken(token));
	}
}
