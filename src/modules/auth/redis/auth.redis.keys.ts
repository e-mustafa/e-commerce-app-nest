import { Id } from '@/common/types';
import { Injectable } from '@nestjs/common';

@Injectable()
export class RedisAuthKeyBuilder {
	private normalize(value: string): string {
		return value.trim().toLowerCase();
	}

	public userVerifyAccountOtp(email: string): string {
		return `users:${this.normalize(email)}:verify_account_otp`;
	}

	public userVerifyAccountOtpCooldown(email: string): string {
		return `users:${this.normalize(email)}:verify_account_otp_cooldown`;
	}

	public userVerifyAccountOtpAttempts(email: string): string {
		return `users:${this.normalize(email)}:verify_account_otp_attempts`;
	}

	public userVerifyAccountOtpFailedAttempts(email: string): string {
		return `users:${this.normalize(email)}:verify_account_failed_attempts`;
	}

	// public userRefreshToken(userId: string, tokenId: string): string {
	// 	return `users:${userId}:refresh_tokens:${tokenId}`;
	// }

	public userRefreshToken(keys: Id | [userId: Id, jti: string]) {
		if (Array.isArray(keys)) {
			const [userId, jti] = keys || [];
			return jti ? `users:refresh_tokens:${userId.toString()}:${jti}` : `users:refresh_tokens:${userId}:*`;
		} else {
			return `users:refresh_tokens:${keys}:*`;
		}
	}

	public userSession(userId: string, sessionId: string): string {
		return `users:${userId}:sessions:${sessionId}`;
	}

	public reactiveAccountToken(userId: string): string {
		return `users:${userId}:reactivate-account-token`;
	}

	public resetPasswordToken(hashedToken: string): string {
		return `users:reset:${hashedToken}`;
	}

	public userChangeEmailOtp(userId: string): string {
		return `auth:change-email:otp:${userId}`;
	}

	public userChangeEmailOtpCooldown(userId: string): string {
		return `auth:change-email:cooldown:${userId}`;
	}

	public userChangeEmailOtpAttempts(userId: string): string {
		return `auth:change-email:attempts:${userId}`;
	}

	public userRevertEmailToken(userId: string): string {
		return `auth:revert-email:token:${userId}`;
	}
}

// export const redisKeys = new RedisKeyBuilder();
