import { Id } from '@/common/types';
import { type AppConfig, appConfig } from '@/config';
import { IRedisSessionList, ISessionInfo } from '@/modules/user';
import { RedisService } from '@/providers/redis/redis.service';
import { Inject, Injectable } from '@nestjs/common';
import { RedisAuthKeyBuilder } from './auth.redis.keys';

export interface IRefreshTokenRedisService {
	setSession(keys: Id | [userId: Id, jti: string], session: ISessionInfo, expiration?: number | string): Promise<void>;
	getSession(keys: Id | [userId: Id, jti: string]): Promise<ISessionInfo | null>;
	delete(keys: Id | [userId: Id, jti: string]): Promise<void>;
	deletePattern(userId: Id): Promise<void>;
	getByPatternWithKeys(key: string): Promise<IRedisSessionList[]>;
}

@Injectable()
export class RefreshTokenRedisService implements IRefreshTokenRedisService {
	private readonly tokenExpiration: number;

	constructor(
		@Inject(appConfig.KEY) private readonly APP: AppConfig,
		private readonly redisService: RedisService,
		private readonly redisKeys: RedisAuthKeyBuilder,
	) {
		this.tokenExpiration = this.APP.auth.refreshToken.expiresIn;
	}

	public async setSession(
		keys: Id | [userId: Id, jti: string],
		session: ISessionInfo,
		expiration?: number | string,
	): Promise<void> {
		try {
			const data = JSON.stringify(session);
			await this.redisService.set(
				this.redisKeys.userRefreshToken(keys),
				data,
				expiration ? Number(expiration) : this.tokenExpiration,
			);
		} catch (error) {
			console.error('[RefreshTokenRedisService] failed to set ', error);
		}
	}

	public async getSession(keys: Id | [userId: Id, jti: string]): Promise<ISessionInfo | null> {
		const data = await this.redisService.get(this.redisKeys.userRefreshToken(keys));
		if (!data) return null;
		try {
			return (await JSON.parse(data)) as ISessionInfo;
		} catch (error) {
			console.error('[RefreshTokenRedisService] failed to pars ', error);
			return null;
		}
	}

	public async delete(keys: Id | [userId: Id, jti: string]): Promise<void> {
		await this.redisService.delete(this.redisKeys.userRefreshToken(keys));
	}

	public async deletePattern(userId: Id): Promise<void> {
		await this.redisService.deletePattern(this.redisKeys.userRefreshToken(userId));
	}

	public async getByPatternWithKeys(key: string): Promise<IRedisSessionList[]> {
		return await this.redisService.getByPatternWithKeys<ISessionInfo>(this.redisKeys.userRefreshToken(key), true);
	}
}
