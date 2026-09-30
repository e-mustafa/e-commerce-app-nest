import { type AppConfig, appConfig, type EnvConfig, envConfig } from '@/config';
import { CookiesKeysEnum, TTokens } from '@/providers/security';
import { Inject, Injectable } from '@nestjs/common';
import { CookieOptions, Response } from 'express';

@Injectable()
export class CookieService {
	constructor(
		@Inject(envConfig.KEY) private readonly ENV: EnvConfig,
		@Inject(appConfig.KEY) private readonly APP: AppConfig,
	) {}

	/**
	 * Generates default cookie security configurations dynamically based on environment
	 */
	private get defaultOptions(): CookieOptions {
		const isProduction: boolean = this.ENV.environment === 'production';
		return {
			httpOnly: true,
			secure: isProduction, // Set to true only in production to allow local HTTP development
			sameSite: 'lax',
		};
	}

	/**
	 * Helper function to safely parse and return expiration in milliseconds
	 */
	private parseMaxAge(
		customExp?: number,
		envExp?: number | string,
		appFallbackExp?: number,
		defaultMs: number = 1000 * 60 * 15,
	): number {
		if (customExp && !Number.isNaN(Number(customExp))) {
			return Number(customExp) * 1000;
		}
		if (envExp && !Number.isNaN(Number(envExp))) {
			return Number(envExp);
		}
		if (appFallbackExp && !Number.isNaN(Number(appFallbackExp))) {
			return Number(appFallbackExp);
		}
		return defaultMs;
	}

	/**
	 * Sets access and refresh tokens into response cookies
	 */
	public setAuthCookies(res: Response, data: TTokens): void {
		if (!res || !data) return;

		// Set access token in cookie
		if (data.accessToken) {
			const accessMaxAge: number = this.parseMaxAge(
				data.accessExpiration,
				this.ENV.jwt.user.accessTokenExpires,
				this.APP.auth.accessToken.expiresIn,
				1000 * 60 * 15, // 15 minutes default
			);

			res.cookie(CookiesKeysEnum.accessToken, `Bearer ${data.accessToken}`, {
				...this.defaultOptions,
				maxAge: accessMaxAge,
			});
		}

		// Set refresh token in cookie
		if (data.refreshToken) {
			const refreshMaxAge: number = this.parseMaxAge(
				data.refreshExpiration,
				this.ENV.jwt.user.refreshTokenExpires,
				this.APP.auth.refreshToken.expiresIn,
				1000 * 60 * 60 * 24 * 7, // 7 days default
			);

			res.cookie(CookiesKeysEnum.refreshToken, `Bearer ${data.refreshToken}`, {
				...this.defaultOptions,
				maxAge: refreshMaxAge,
			});
		}
	}

	/**
	 * Clears all auth-related cookies from client response
	 */
	public clearCookies(res: Response, customOptions?: CookieOptions, removeKeys?: string[]): void {
		if (!res) return;

		const clearOptions: CookieOptions = {
			...this.defaultOptions,
			...customOptions,
		};

		const keysToClear: string[] =
			removeKeys && removeKeys.length > 0 ? removeKeys : (Object.values(CookiesKeysEnum) as string[]);

		keysToClear.forEach((key: string) => res.clearCookie(key, clearOptions));
	}
}
