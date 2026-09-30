import { AUser, OptionalAuth } from '@/common/decorators';
import { AuthGuard } from '@/common/guards';
import type { Id, IFile, IUserBody } from '@/common/types';
import { appConfig } from '@/config';
import { fileTypes, UseUpload } from '@/providers/upload';
import { Body, Controller, Delete, Get, Param, Patch, Query, UploadedFile, UseGuards } from '@nestjs/common';
import {
	type GetUsersQueryDTO,
	getUsersSchema,
	type ParamsUserIdDTO,
	paramsUserIdSchema,
	type UpdateProfileDTO,
	updateProfileSchema,
} from './user.dto';
import UserService from './user.service';

export const routes = {
	base: '/users',

	getMyProfile: '/profile', // GET
	updateMyProfile: '/profile', // PATCH
	// deleteMyProfile: '/profile',

	uploadAvatar: '/profile/avatar', // PATCH
	deleteAvatar: '/profile/avatar', // DELETE

	uploadCover: '/profile/cover',
	deleteCover: '/profile/cover',

	getUser: '/:userId', // GET
	getUsers: '/', // GET

	getUserStatus: '/:userId/status', // GET
};

@UseGuards(AuthGuard)
@Controller(routes.base)
export default class UserController {
	constructor(private readonly services: UserService) {}

	@Get(routes.getMyProfile)
	async getMyProfile(@AUser('_id') userId: Id) {
		const user = await this.services.getProfile(userId);
		return { data: user };
	}

	@Patch(routes.updateMyProfile)
	async updateProfile(@AUser('_id') userId: Id, @Body({ schema: updateProfileSchema.body }) body: UpdateProfileDTO) {
		const data = await this.services.updateProfile(userId, body);
		return { message: 'Profile updated successfully', data };
	}

	@Patch(routes.uploadAvatar)
	@UseUpload({
		fieldName: 'avatar',
		fileType: fileTypes.images,
		maxSize: appConfig().user.avatar.maxSize,
		// dir: (req) => `users/${req.user?._id || 'guest'}/profile`,
	})
	async uploadUserAvatar(@AUser('_id') userId: Id, @UploadedFile() file: IFile) {
		const data = await this.services.uploadUserPic(userId, file as IFile);
		return { message: `avatar uploaded successfully`, data };
	}

	@Patch(routes.uploadCover)
	@UseUpload({
		fieldName: 'cover',
		fileType: fileTypes.images,
		maxSize: appConfig().user.cover.maxSize,
		// dir: (req) => `users/${req.user?._id || 'guest'}/profile`,
	})
	async uploadUserCover(@AUser('_id') userId: Id, @UploadedFile() file: IFile) {
		const data = await this.services.uploadUserPic(userId, file as IFile);
		return { message: `Cover uploaded successfully`, data };
	}

	@Delete(routes.deleteAvatar)
	async deleteUserAvatar(@AUser() user: IUserBody) {
		const fieldname = 'avatar';
		const data = await this.services.deleteUserPic(user, fieldname);
		return { message: `${fieldname} uploaded successfully`, data };
	}

	@Delete(routes.deleteCover)
	async deleteUserCover(@AUser() user: IUserBody) {
		const fieldname = 'cover';
		const data = await this.services.deleteUserPic(user, fieldname);
		return { message: `${fieldname} uploaded successfully`, data };
	}

	@Get(routes.getUser)
	@OptionalAuth()
	async getUser(@AUser('_id') userId: Id, @Param({ schema: paramsUserIdSchema.params }) params: ParamsUserIdDTO) {
		const data = await this.services.getUser(userId, params.userId);
		return { data };
	}

	@Get(routes.getUsers)
	async getUsers(@AUser('_id') userId: Id, @Query({ schema: getUsersSchema.query }) query: GetUsersQueryDTO) {
		const { data, metadata } = await this.services.getUsers(userId, query);
		return { metadata, data };
	}

	@Get(routes.getUserStatus)
	async getUserStatus(@AUser('_id') userId: Id, @Param({ schema: paramsUserIdSchema.params }) params: ParamsUserIdDTO) {
		const data = await this.services.getUserStatus(userId, params.userId);
		return { data };
	}

	// TODO add search and get users route /> by admin
}
