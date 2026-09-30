import { generalFields, getFileSchema } from '@/common/validation';
import { sortOrderEnum } from '@/providers/database/query.enum';
import z from 'zod';

export const updateProfileSchema = {
	body: z
		.strictObject({
			firstName: generalFields.firstName,
			lastName: generalFields.lastName,
			username: generalFields.username,
			bio: generalFields.bio,
			gender: generalFields.gender,
			birthdate: generalFields.birthdate,
			phone: generalFields.phone,
		})
		.partial(),
};
export type UpdateProfileDTO = z.infer<typeof updateProfileSchema.body>;

export const uploadAvatarSchema = {
	file: z.strictObject({
		avatar: getFileSchema('Avatar image is required'),
	}),
};
export type UploadAvatarDTO = z.infer<typeof uploadAvatarSchema.file>;

export const uploadCoverSchema = {
	file: z.strictObject({
		cover: getFileSchema('Cover image is required'),
	}),
};
export type UploadCoverDTO = z.infer<typeof uploadCoverSchema.file>;

export const paramsIdSchema = {
	params: z.strictObject({
		userId: generalFields.idOrUsername,
	}),
};
export type ParamsIdDTO = z.infer<typeof paramsIdSchema.params>;

export const paramsUserIdSchema = {
	params: z.strictObject({
		userId: generalFields.id,
	}),
};
export type ParamsUserIdDTO = z.infer<typeof paramsUserIdSchema.params>;

export const resetPasswordSchema = {
	body: z.strictObject({
		token: generalFields.token,
		password: generalFields.password,
		confirmPassword: generalFields.confirmPassword,
	}),
};
export type ResetPasswordDTO = z.infer<typeof resetPasswordSchema.body>;

export const getUsersSchema = {
	query: z.object({
		page: generalFields.page.default(1).optional(),
		limit: generalFields.limit.default(10).optional(),
		order: generalFields.order.default(sortOrderEnum.DESC).optional(),
		search: generalFields.search.optional(),
	}),
};

export type GetUsersQueryDTO = z.infer<typeof getUsersSchema.query>;
