import { RoleEnum } from '@/modules/user';
import { applyDecorators, UseGuards } from '@nestjs/common';
import { AuthGuard, RolesGuard } from '../guards';
import { Roles } from './roles.decorator';

// Combined decorator to apply Authentication, Authorization, and Admin role in one place
export const AdminAuth = (roles: RoleEnum[] = [RoleEnum.ADMIN, RoleEnum.SUPER_ADMIN]) => {
	return applyDecorators(Roles(...roles), UseGuards(AuthGuard, RolesGuard));
};
