import { type AppConfig, appConfig } from '@/config';
import { RedisService } from '@/providers/redis/redis.service';
import { Inject, Injectable } from '@nestjs/common';
import { RedisAuthKeyBuilder } from './auth.redis.keys';
import { Id } from '@/common/types';

export type IRevertEmailTokenData = {
	token: string;
	oldEmail: string;
};

export interface IRevertEmailTokenRedisService {
	set(userId: Id, data: IRevertEmailTokenData): Promise<void>;
	get(userId: Id): Promise<IRevertEmailTokenData | null>;
	delete(userId: Id): Promise<void>;
}

@Injectable()
export class RevertEmailTokenRedisService implements IRevertEmailTokenRedisService {
	private readonly tokenExpiration: number;

	constructor(
		@Inject(appConfig.KEY) private readonly APP: AppConfig,
		private readonly redisService: RedisService,
		private readonly redisKeys: RedisAuthKeyBuilder,
	) {
		// Read token expiration from configuration (e.g. 24 hours in seconds)
		this.tokenExpiration = this.APP.otp.revertEmail.expiresIn;
	}

	public async set(userId: Id, data: IRevertEmailTokenData): Promise<void> {
		const serializedData = JSON.stringify(data);

		await this.redisService.set(this.redisKeys.userRevertEmailToken(userId.toString()), serializedData, this.tokenExpiration);
	}

	public async get(userId: Id): Promise<IRevertEmailTokenData | null> {
		const data = await this.redisService.get(this.redisKeys.userRevertEmailToken(userId.toString()));
		if (!data) return null;

		try {
			return JSON.parse(data) as IRevertEmailTokenData;
		} catch {
			return null;
		}
	}

	public async delete(userId: Id): Promise<void> {
		await this.redisService.delete(this.redisKeys.userRevertEmailToken(userId.toString()));
	}
}
