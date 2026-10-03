import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { ForbiddenException } from '../exceptions';

@Injectable()
export class RolesGuard implements CanActivate {
	constructor(private reflector: Reflector) {}
	canActivate(context: ExecutionContext): boolean {
		const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
			context.getHandler(),
			context.getClass(),
		]);

		if (!requiredRoles) return true;

		const req = context.switchToHttp().getRequest<Request>();
		const UserRole = req.user?.role;

		const isAllowed = requiredRoles.some((role) => UserRole === Number(role));
		if (!isAllowed) throw new ForbiddenException('Access Denied');

		return true;
	}
}
