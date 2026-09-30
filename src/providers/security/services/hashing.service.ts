import { type EnvConfig, envConfig } from '@/config';
import { Inject, Injectable } from '@nestjs/common';
import { hash as argon2Hash, verify } from 'argon2';
import { compare, hash } from 'bcrypt';
import { createHash, createHmac, randomBytes, randomInt, timingSafeEqual } from 'node:crypto';

@Injectable()
export class HashingService {
	constructor(@Inject(envConfig.KEY) private readonly ENV: EnvConfig) {}

	generateOtp() {
		return randomInt(100000, 999999).toString();
	}

	generateRandomToken(length: number = 32) {
		return randomBytes(length)?.toString('hex');
	}

	// Hash token using SHA-256 (fast for long text)
	hashToken(token: string): string {
		return createHash('sha256').update(token).digest('hex');
	}

	// Hash OTP using HMAC-SHA256 with encryption key (for short values like OTP)
	hashOtp(otp: string | number): string {
		const secret = this.ENV.security.encryption.encKey; // || 'your-fallback-secret';
		return createHmac('sha256', secret).update(String(otp)).digest('hex');
	}

	verifyOtp(inputOtp: string | number, storedHashedOtp: string): boolean {
		try {
			// hash plain otp
			const inputHashedOtp = this.hashOtp(String(inputOtp));

			// convert hashes to buffers
			const a = Buffer.from(inputHashedOtp, 'hex');
			const b = Buffer.from(storedHashedOtp, 'hex');

			// buffers must have the same length
			if (a.length !== b.length) {
				return false;
			}

			// timing safe comparison -> prevent timing attacks
			return timingSafeEqual(a, b);
		} catch (error) {
			return false;
		}
	}

	async generateHash(
		text: string,
		salt: number = Number(this.ENV.security.hashing.salt),
		isHard: boolean = false,
	): Promise<string> {
		if (isHard) {
			return await argon2Hash(text);
		} else {
			return await hash(text, salt);
		}
	}

	async verifyHash(text: string, hashedText: string, isHard: boolean = false) {
		if (isHard) {
			return await verify(hashedText, text);
		} else {
			return await compare(text, hashedText);
		}
	}
}
