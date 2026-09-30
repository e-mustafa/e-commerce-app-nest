import { Id } from '@/common/types';
import { type AppConfig, appConfig } from '@/config';
import { RedisService } from '@/providers/redis/redis.service';
import { Inject, Injectable } from '@nestjs/common';
import { RedisAuthKeyBuilder } from './auth.redis.keys';

export interface IReactiveAccountRedisService {
	set(userId: Id, token: string, expiration?: number | string): Promise<void>;
	get(userId: Id): Promise<string | null>;
	delete(userId: Id): Promise<void>;
}

@Injectable()
export class ReactiveAccountRedisService implements IReactiveAccountRedisService {
	private readonly tokenExpiration: number;
	constructor(
		@Inject(appConfig.KEY) private readonly APP: AppConfig,
		private readonly redisService: RedisService,
		private readonly redisKeys: RedisAuthKeyBuilder,
	) {
		this.tokenExpiration = this.APP.otp.reactivateAccount.expiresIn;
	}

	public async set(userId: Id, token: string, expiration?: number | string): Promise<void> {
		return await this.redisService.set(
			this.redisKeys.reactiveAccountToken(userId.toString()),
			token,
			expiration ? Number(expiration) : this.tokenExpiration,
		);
	}

	public async get(userId: Id): Promise<string | null> {
		return await this.redisService.get(this.redisKeys.reactiveAccountToken(userId.toString()));
	}

	public async delete(userId: Id): Promise<void> {
		return await this.redisService.delete(this.redisKeys.reactiveAccountToken(userId.toString()));
	}
}
