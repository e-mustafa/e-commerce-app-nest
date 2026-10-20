import { AUser, AuthAdmin } from '@/common/decorators';
import { ImagePathInterceptor } from '@/common/interceptors';
import type { IUserBody } from '@/common/types';
import { Body, Controller, Delete, Get, Param, Patch, Query, UseInterceptors } from '@nestjs/common';
import {
	type GetUsersQueryDTO,
	getUsersSchema,
	type ParamsUserIdDTO,
	paramsUserIdSchema,
	updateUerRoleSchema,
	updateUerStatusSchema,
	type UpdateUserRoleDTO,
	type UpdateUserStatusDTO,
} from './user.dto';
import { AdminRoleEnum } from './user.enums';
import UserService from './user.service';

export const routes = {
	base: '/admin/users',

	listUsers: '/',

	getUser: '/:userId',
	deleteUser: '/:userId',
	recoverUser: '/:userId/recover',

	updateUserRole: '/:userId/role', // PATCH - Super Admin only
	updateUserStatus: '/:userId/status', // PATCH
};

// @UseGuards(AuthGuard)
@AuthAdmin()
@UseInterceptors(ImagePathInterceptor)
@Controller(routes.base)
export default class UserAdminController {
	constructor(private readonly service: UserService) {}

	@Get(routes.getUser)
	async getUser(@AUser() user: IUserBody, @Param({ schema: paramsUserIdSchema.params }) params: ParamsUserIdDTO) {
		const data = await this.service.getUser(user, params.userId);
		return { data };
	}

	@Get(routes.listUsers)
	async listUsers(@AUser() user: IUserBody, @Query({ schema: getUsersSchema.query }) query: GetUsersQueryDTO) {
		const { data, metadata } = await this.service.listUsersAdmin({ user, ...query });
		return { metadata, data };
	}

	@Delete(routes.deleteUser)
	async deleteUser(@AUser() user: IUserBody, @Param({ schema: paramsUserIdSchema.params }) params: ParamsUserIdDTO) {
		const data = await this.service.deleteUserAdmin(user, params.userId);
		return { message: `User deleted successfully`, data };
	}

	@Patch(routes.recoverUser)
	async recoverUser(@AUser() user: IUserBody, @Param({ schema: paramsUserIdSchema.params }) params: ParamsUserIdDTO) {
		const data = await this.service.recoverUserAdmin(user, params.userId);
		return { message: `User recovered successfully`, data };
	}

	@AuthAdmin(AdminRoleEnum.SUPER_ADMIN)
	@Patch(routes.updateUserRole)
	async updateUserRole(
		@AUser() user: IUserBody,
		@Body({ schema: updateUerRoleSchema.body }) body: UpdateUserRoleDTO,
		@Param({ schema: updateUerRoleSchema.params }) params: ParamsUserIdDTO,
	) {
		const data = await this.service.updateUserRoleAdmin(user, params.userId, body.role);
		return { message: `User role updated successfully`, data };
	}

	@Patch(routes.updateUserStatus)
	async updateUserStatus(
		@AUser() user: IUserBody,
		@Body({ schema: updateUerStatusSchema.body }) body: UpdateUserStatusDTO,
		@Param({ schema: paramsUserIdSchema.params }) params: ParamsUserIdDTO,
	) {
		const data = await this.service.updateUserStatusAdmin({ user, ...params, ...body });
		return { data };
	}
}
