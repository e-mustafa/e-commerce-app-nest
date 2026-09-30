import { type AppConfig, appConfig } from '@/config';
import { RedisService } from '@/providers/redis/redis.service';
import { Inject, Injectable } from '@nestjs/common';
import { RedisAuthKeyBuilder } from './auth.redis.keys';

export interface IVerifyAccountOtpRedisService {
	setOtp(email: string, otp: string): Promise<void>;
	getOtp(email: string): Promise<string | null>;
	deleteOtp(email: string): Promise<void>;
	isCooldownActive(email: string): Promise<boolean>;
	getAttempts(email: string): Promise<number>;
	incrementAttempts(email: string): Promise<number>;
	incrementFailedAttempts(email: string): Promise<number>;
	deleteAttempts(email: string): Promise<void>;
	deleteFailedAttempts(email: string): Promise<void>;
}

@Injectable()
export class VerifyAccountOtpRedisService implements IVerifyAccountOtpRedisService {
	private readonly otpExpiration: number;
	private readonly cooldownExpiration: number;
	private readonly attemptsExpiration: number;

	constructor(
		@Inject(appConfig.KEY) private readonly APP: AppConfig,
		private readonly redisService: RedisService,
		private readonly redisKeys: RedisAuthKeyBuilder,
	) {
		const { expiresIn, cooldownPeriod, attemptsExpiration } = this.APP.otp.verifyEmail;
		this.otpExpiration = expiresIn;
		this.cooldownExpiration = cooldownPeriod;
		this.attemptsExpiration = attemptsExpiration;
	}

	public async setOtp(email: string, otp: string): Promise<void> {
		// Set the OTP in Redis
		await this.redisService.set(this.redisKeys.userVerifyAccountOtp(email), otp, this.otpExpiration);

		// Set the cooldown in Redis
		await this.redisService.set(this.redisKeys.userVerifyAccountOtpCooldown(email), '1', this.cooldownExpiration);
	}

	public async getOtp(email: string): Promise<string | null> {
		return this.redisService.get(this.redisKeys.userVerifyAccountOtp(email));
	}

	public async deleteOtp(email: string): Promise<void> {
		await this.redisService.delete(this.redisKeys.userVerifyAccountOtp(email));
	}

	public async isCooldownActive(email: string): Promise<boolean> {
		return this.redisService.exists(this.redisKeys.userVerifyAccountOtpCooldown(email));
	}

	public async getCooldownTime(email: string): Promise<number> {
		return this.redisService.ttl(this.redisKeys.userVerifyAccountOtpCooldown(email));
	}

	public async getAttempts(email: string): Promise<number> {
		const value = await this.redisService.get(this.redisKeys.userVerifyAccountOtpAttempts(email));
		return value ? Number(value) : 0;
	}

	public async incrementAttempts(email: string): Promise<number> {
		return this.redisService.incrementWithExpiration(
			this.redisKeys.userVerifyAccountOtpAttempts(email),
			this.attemptsExpiration,
		);
	}

	public async incrementFailedAttempts(email: string): Promise<number> {
		return this.redisService.incrementWithExpiration(
			this.redisKeys.userVerifyAccountOtpFailedAttempts(email),
			this.otpExpiration,
		);
	}

	public async deleteAttempts(email: string): Promise<void> {
		await this.redisService.delete(this.redisKeys.userVerifyAccountOtpAttempts(email));
	}

	public async deleteFailedAttempts(email: string): Promise<void> {
		await this.redisService.delete(this.redisKeys.userVerifyAccountOtpFailedAttempts(email));
	}
}
