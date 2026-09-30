import { RoleEnum } from '@/modules/user';
import { SetMetadata } from '@nestjs/common';

// Key used to store required roles metadata
export const ROLES_KEY = 'roles';

// Decorator to attach required roles metadata to route handlers or controllers
export const Roles = (...roles: RoleEnum[]) => SetMetadata(ROLES_KEY, roles);
