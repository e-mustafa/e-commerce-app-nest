import { InternalException, UnauthorizedException } from '@/common/exceptions';
import { type AppConfig, appConfig, type EnvConfig, envConfig } from '@/config';
import { AdminRoleEnum, RoleEnum } from '@/modules/user/user.enums';
import { Inject, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { JwtPayload, SignOptions } from 'jsonwebtoken';
import { randomUUID } from 'node:crypto';
import { TokenTypeEnum } from '../security.enum';
import { IJwtPayload, IUserPayload, TTokens } from '../security.types';

@Injectable()
export class TokenService {
	constructor(
		@Inject(envConfig.KEY) private readonly ENV: EnvConfig,
		@Inject(appConfig.KEY) private readonly APP: AppConfig,
		private readonly jwtService: JwtService,
	) {}

	// export const generateToken = (payload: JwtPayload, secretKey: Secret, options: SignOptions)  {
	generateToken(
		// payload: string | Buffer | Record<string, unknown>,
		payload: Record<string, unknown>,
		secretKey: string | Buffer<ArrayBufferLike>,
		options: SignOptions,
	) {
		if (!secretKey) {
			throw new InternalException('JWT Secret key is missing or undefined.', 'SecretKeyMissing_generateToken');
		}
		const appOptions = {
			// algorithm: 'HS256',
			issuer: this.ENV.appName,
			subject: 'User Authentication',
			audience: String(options.audience ?? RoleEnum.USER),
			...options,
			secret: secretKey,
		};
		// const payloadString = typeof payload === 'string' ? payload : JSON.stringify(payload);
		return this.jwtService.signAsync(payload, appOptions); //   (payloadString, appOptions);
	}

	verifyToken(token: string, secretKey: string) {
		if (!secretKey) {
			throw new InternalException('JWT Secret key is missing or undefined.');
		}
		return this.jwtService.verifyAsync(token, { secret: secretKey });
	}

	getSignature(userRole: RoleEnum | string | number) {
		const role = Number(userRole);
		let signature;
		if (Object.values(AdminRoleEnum)?.includes(role as AdminRoleEnum)) {
			signature = this.ENV.jwt.admin;
		} else if (role === RoleEnum.USER) {
			signature = this.ENV.jwt.user;
		} else {
			throw new InternalException('Invalid token Signature', 'getSignature');
		}
		return signature;
	}

	/**
	 * Generate access or/and refresh tokens for a user
	 * @param {Object} user - User data object, *Must have _id and role properties
	 * @param {string} type - Token type (default BOTH, "ACCESS" for access only, "REFRESH" for refresh only)
	 * @param {Object} customPayload - Custom payload to include in the token, Default payload is { id, email, role }
	 * @returns {Object} - Object containing accessToken and refreshToken
	 */
	async generateTokens(
		// user: Partial<IUser>,
		user: IUserPayload,
		rememberMe: boolean = false,
		type: 'BOTH' | 'ACCESS' | 'REFRESH' = 'BOTH',
		customPayload: Record<string, unknown> = {},
	) {
		if (!user || user.role === undefined) {
			user.role = RoleEnum.USER;
			// throw new InternalException('Token generation failed: User role is missing or undefined', 'generateTokens');
		}

		const signature = this.getSignature(user.role);
		if (!signature) {
			throw new InternalException('Unauthorized or Invalid role', 'generateTokens');
		}

		const payloadFields = this.APP.security.jwt.payloadFields || ['id', '_id', 'email', 'name', 'remembered'];
		const payload: IJwtPayload = {
			id: user._id.toString(),
			_id: user._id,
			email: user.email,
			name: user.firstName,
			remembered: rememberMe ? 1 : 0,
			// role: Number(user.role),
			...(payloadFields.includes('lastName') && { lastName: user.lastName || undefined }),
			...(payloadFields.includes('avatar') && { avatar: user.avatar?.url || undefined }),
			...customPayload,
		};

		const tokens: TTokens = {
			accessToken: '',
			refreshToken: '',
			accessExpiration: 0,
			refreshExpiration: 0,
		};

		if (type === 'BOTH' || type === TokenTypeEnum.ACCESS) {
			tokens.accessExpiration = Number(signature.accessTokenExpires);

			tokens.accessToken = await this.generateToken(payload, signature.accessTokenSecret, {
				expiresIn: tokens.accessExpiration,
				audience: String(user.role),
			});
		}

		if (type === 'BOTH' || type === TokenTypeEnum.REFRESH) {
			// create token id to use in refresh token for invalidation by (jwtid)
			tokens.tokenId = randomUUID();

			// calculate refresh token expiration -> if rememberMe is true, double the expiration time
			tokens.refreshExpiration = rememberMe
				? Number(signature.refreshTokenExpires) * 2
				: Number(signature.refreshTokenExpires);

			tokens.refreshToken = await this.generateToken(payload, signature.refreshTokenSecret, {
				expiresIn: tokens.refreshExpiration,
				audience: String(user.role),
				jwtid: tokens.tokenId,
				// remembered: rememberMe,
			});
		}

		return tokens;
	}

	/**
	 * Decodes a JWT token based on token audience (admin or user)
	 * @param {string} authorization - The authorization header value (e.g., "Bearer <token>")
	 * @param {boolean} isRefreshToken - Whether this is a refresh token (default: false)
	 * @returns {Object} The decoded token payload
	 * @throws {Error} If token is invalid or missing
	 */
	async decode(authorization: string, isRefreshToken = false): Promise<IJwtPayload> {
		if (!authorization) {
			throw new InternalException('Authorization header is required, Please login again');
		}
		const token = authorization?.startsWith('Bearer') ? authorization.split(' ')[1] : authorization;
		if (!token) {
			throw new InternalException('Token is required');
		}

		const decodedPayload = (this.jwtService.decode(token) as JwtPayload) || {};

		if (!decodedPayload?.aud || !decodedPayload?.id) {
			throw new InternalException('Invalid token structure or corrupted payload, Please login again');
		}

		// Determine signature based on audience
		const signature = this.getSignature(decodedPayload.aud as string);

		// use try catch to handle token expiration exception
		// Verify token using the appropriate secret
		let decoded: IJwtPayload;
		try {
			decoded = (await this.verifyToken(
				token,
				isRefreshToken ? signature.refreshTokenSecret : signature.accessTokenSecret,
			)) as IJwtPayload;
		} catch (error) {
			if (isRefreshToken) {
				throw new UnauthorizedException(
					`${(error as Error).message || 'Token expired!'}, Please login again.`,
					'decodeToken',
				);
			} else {
				throw new UnauthorizedException(`${(error as Error).message || 'Token expired!'}, Please ask for a new one`);
			}
		}
		// const user = await User.findById(decoded.id).select('-password -verified -otp').lean();
		return decoded;
	}
}
