import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';
import { IUserBody } from '../types';

export const Cookies = createParamDecorator((data: string | undefined, ctx: ExecutionContext) => {
	const req = ctx.switchToHttp().getRequest<Request>();
	const cookies = req.cookies as Record<string, string> | undefined;
	if (!cookies) return undefined;

	return data ? cookies[data] : cookies;
});

export const AUser = createParamDecorator((data: keyof IUserBody | undefined, ctx: ExecutionContext) => {
	const req = ctx.switchToHttp().getRequest<Request>();
	return data ? req.user?.[data] : req.user;
});
