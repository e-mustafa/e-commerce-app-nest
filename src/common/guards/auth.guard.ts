import { UserStatusEnum } from '@/modules/user/user.enums';
import { UserRepository } from '@/modules/user/user.repository';
import { IJwtPayload } from '@/providers/security';
import { TokenService } from '@/providers/security/services/token.service';
import { CanActivate, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { GqlExecutionContext } from '@nestjs/graphql';
import { Request } from 'express';
import { IS_OPTIONAL_AUTH_KEY } from '../decorators';
import { UnauthorizedException } from '../exceptions';
import { IUserBody } from '../types';

@Injectable()
export class AuthGuard implements CanActivate {
	constructor(
		private readonly tokenService: TokenService,
		private readonly userRepo: UserRepository,
		private readonly reflector: Reflector,
	) {}

	async canActivate(context: GqlExecutionContext): Promise<boolean> {
		const contextType = context.getType();
		const isOptional = this.reflector.getAllAndOverride<boolean>(IS_OPTIONAL_AUTH_KEY, [
			context.getHandler(),
			context.getClass(),
		]);

		let req = context.switchToHttp().getRequest<Request>();
		// For GraphQL
		if (contextType === 'graphql') req = GqlExecutionContext.create(context).getContext().req;

		const authorization = req.headers.authorization;
		if (!authorization) {
			if (isOptional) return true;
			throw new UnauthorizedException('Authorization header is required, Please login again');
		}

		const decoded: IJwtPayload | null = await this.tokenService.decode(authorization);
		if (!decoded) {
			if (isOptional) return true;
			throw new UnauthorizedException('Invalid token structure or corrupted payload, Please login again');
		}

		req.decoded = decoded;

		// Ignore default filters to perform explicit verification on user status
		const user: IUserBody | null = await this.userRepo
			.findById(decoded.id, { ignoreDefaultFilters: true })
			.select('-password')
			.lean()
			.exec();

		if (!user) {
			if (isOptional) return true;
			throw new UnauthorizedException('User not found');
		}

		// Check account verification status
		if (!user.verifiedAt) {
			throw new UnauthorizedException('User account not verified, Please verify your account first.');
		}

		// Check account active status
		if (user.status === UserStatusEnum.INACTIVE || user.status === UserStatusEnum.DELETING) {
			throw new UnauthorizedException('Your account is inactive or scheduled for deletion');
		}

		// Check if user logged out from all devices after token was issued
		if (user.loggedOutAllAt && decoded.iat) {
			const tokenIssuedAtMs = decoded.iat * 1000;
			if (tokenIssuedAtMs < new Date(user.loggedOutAllAt).getTime()) {
				throw new UnauthorizedException('You have logged out from all devices, please login again.');
			}
		}

		req.user = user;
		req.userId = user._id.toString();
		return true;
	}
}
