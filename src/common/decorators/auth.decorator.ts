import { RoleEnum } from '@/modules/user';
import { applyDecorators, SetMetadata, UseGuards } from '@nestjs/common';
import { AuthGuard, RolesGuard } from '../guards';
import { Roles } from './roles.decorator';

// export const Auth = () => {
// 	return applyDecorators(UseGuards(AuthGuard));
// };

// Key used to store optional auth metadata
export const IS_OPTIONAL_AUTH_KEY = 'isOptionalAuth';

// Custom decorator to bypass strict authentication when applied to route handlers
export const AuthOptional = () => SetMetadata(IS_OPTIONAL_AUTH_KEY, true);

/**
 * Authentication decorator
 * @param isOptional  - boolean flag to indicate if authentication is optional (default: false)
 * @description This decorator applies the AuthGuard to the route handler. If isOptional is true, it also applies the AuthOptional decorator, allowing access to both authenticated and unauthenticated users.
 * @returns
 */
export const Auth = (isOptional: boolean = false) => {
	if (isOptional) return applyDecorators(AuthOptional(), UseGuards(AuthGuard));
	return applyDecorators(UseGuards(AuthGuard));
};

/**
 * Authentication and Authorization decorator
 * @param roles - RoleEnum array to specify required roles (default: [RoleEnum.ADMIN, RoleEnum.SUPER_ADMIN])
 * @description This decorator applies the AuthGuard and RolesGuard to the route handler, with the specified roles as required roles.
 * @returns
 */
export const AuthAdmin = (roles: RoleEnum[] = [RoleEnum.ADMIN, RoleEnum.SUPER_ADMIN]) => {
	return applyDecorators(Roles(...roles), UseGuards(AuthGuard, RolesGuard));
};
