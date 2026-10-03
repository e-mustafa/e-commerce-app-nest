import { Id } from '@/common/types';
import { type AppConfig, appConfig } from '@/config';
import { RedisService } from '@/providers/redis/redis.service';
import { Inject, Injectable } from '@nestjs/common';
import { RedisAuthKeyBuilder } from './auth.redis.keys';

export type IChangeEmailOtpData ={
	otp: string;
	newEmail: string;
}

export interface IChangeEmailOtpRedisService {
	set(userId: Id, data: IChangeEmailOtpData): Promise<void>;
	get(userId: Id): Promise<IChangeEmailOtpData | null>;
	delete(userId: Id): Promise<void>;
	isCooldownActive(userId: Id): Promise<boolean>;
	getAttempts(userId: Id): Promise<number>;
	incrementAttempts(userId: Id): Promise<number>;
	deleteAttempts(userId: Id): Promise<void>;
}

@Injectable()
export class ChangeEmailOtpRedisService implements IChangeEmailOtpRedisService {
	private readonly otpExpiration: number;
	private readonly cooldownExpiration: number;
	private readonly attemptsExpiration: number;

	constructor(
		@Inject(appConfig.KEY) private readonly APP: AppConfig,
		private readonly redisService: RedisService,
		private readonly redisKeys: RedisAuthKeyBuilder,
	) {
		// Read expirations from configuration
		const { expiresIn, cooldownPeriod, attemptsExpiration } = this.APP.otp.changeEmail;
		this.otpExpiration = expiresIn;
		this.cooldownExpiration = cooldownPeriod;
		this.attemptsExpiration = attemptsExpiration;
	}

	public async set(userId: Id, data: IChangeEmailOtpData): Promise<void> {
		const serializedData = JSON.stringify(data);

		// Save payload to Redis with TTL
		await this.redisService.set(this.redisKeys.userChangeEmailOtp(userId.toString()), serializedData, this.otpExpiration);

		// Set cooldown flag in Redis
		await this.redisService.set(
			this.redisKeys.userChangeEmailOtpCooldown(userId.toString()),
			'1',
			this.cooldownExpiration,
		);
	}

	public async get(userId: Id): Promise<IChangeEmailOtpData | null> {
		const data = await this.redisService.get(this.redisKeys.userChangeEmailOtp(userId.toString()));
		if (!data) return null;

		try {
			return JSON.parse(data) as IChangeEmailOtpData;
		} catch {
			return null;
		}
	}

	public async delete(userId: Id): Promise<void> {
		await this.redisService.delete(this.redisKeys.userChangeEmailOtp(userId.toString()));
	}

	public async isCooldownActive(userId: Id): Promise<boolean> {
		return this.redisService.exists(this.redisKeys.userChangeEmailOtpCooldown(userId.toString()));
	}

	public async getAttempts(userId: Id): Promise<number> {
		const value = await this.redisService.get(this.redisKeys.userChangeEmailOtpAttempts(userId.toString()));
		return value ? Number(value) : 0;
	}

	public async incrementAttempts(userId: Id): Promise<number> {
		return this.redisService.incrementWithExpiration(
			this.redisKeys.userChangeEmailOtpAttempts(userId.toString()),
			this.attemptsExpiration,
		);
	}

	public async deleteAttempts(userId: Id): Promise<void> {
		await this.redisService.delete(this.redisKeys.userChangeEmailOtpAttempts(userId.toString()));
	}
}
