import { UserRepository } from '@/modules/user/user.repository';
import { IJwtPayload } from '@/providers/security';
import { TokenService } from '@/providers/security/services/token.service';
import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { IS_OPTIONAL_AUTH_KEY } from '../decorators/optional-auth.decorator';
import { UnauthorizedException } from '../exceptions';
import { IUserBody } from '../types';

@Injectable()
export class AuthGuard implements CanActivate {
	constructor(
		private readonly tokenService: TokenService,
		private readonly userRepo: UserRepository,
		private readonly reflector: Reflector,
	) {}

	async canActivate(context: ExecutionContext): Promise<boolean> {
		// Check whether the route handler or controller has @OptionalAuth() metadata
		const isOptional = this.reflector.getAllAndOverride<boolean>(IS_OPTIONAL_AUTH_KEY, [
			context.getHandler(),
			context.getClass(),
		]);
		const http = context.switchToHttp();
		const req = http.getRequest<Request>();

		const authorization = req.headers.authorization;
		if (!authorization) {
			if (isOptional) return true;
			throw new UnauthorizedException('Authorization header is required2, Please login again');
		}

		const decoded: IJwtPayload | null = await this.tokenService.decode(authorization);
		if (!decoded) {
			if (isOptional) return true;
			throw new UnauthorizedException('Invalid token structure or corrupted payload, Please login again');
		}

		req.decoded = decoded;

		const user: IUserBody | null = await this.userRepo.findById(decoded.id).select('-password').lean().exec();
		if (!user) {
			if (isOptional) return true;
			throw new UnauthorizedException('User not found');
		}

		if (user && !user.verifiedAt) {
			throw new UnauthorizedException('User account not verified, Please verify your account first.');
		}

		req.user = user;
		req.userId = user._id.toString();
		return true;
	}
}
