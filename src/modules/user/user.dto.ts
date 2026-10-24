import { generalFields, getFileSchema } from '@/common/validation';
import { SortOrderEnum } from '@/providers/database/query.enum';
import z from 'zod';
import { AccountProviderEnum, GenderEnum, RoleEnum, StatusReasonEnum, UserStatusEnum } from './user.enums';

const userFields = {
	status: z.enum(UserStatusEnum),
	statusReason: z.enum(StatusReasonEnum),
	provider: z.enum(AccountProviderEnum).optional(),
	role: z.enum(RoleEnum),
	gender: z.enum(GenderEnum).optional(),
	// role: z.preprocess(
	// 	(val) => {
	// 		if (typeof val === 'string') {
	// 			const normalizedKey = val.trim().toUpperCase() as keyof typeof RoleEnum;
	// 			if (Object.prototype.hasOwnProperty.call(RoleEnum, normalizedKey)) return RoleEnum[normalizedKey];
	// 		}
	// 		return val;
	// 	},
	// 	z.number().refine((val): val is RoleEnum => UserRoles.includes(val as RoleEnum), {
	// 		message: `Invalid role value, use one of: ${Object.keys(RoleEnum).join(', ')}`,
	// 	}),
	// ),
	// gender: z.preprocess(
	// 	(val) => {
	// 		if (typeof val === 'string') {
	// 			const normalizedKey = val.trim().toUpperCase() as TGendersKey;
	// 			if (Object.hasOwn(GenderEnum, normalizedKey)) return GenderEnum[normalizedKey];
	// 		}
	// 		return val;
	// 	},
	// 	z.number().refine((val): val is GenderEnum => Object.values(GenderEnum).includes(val as GenderEnum), {
	// 		message: `Invalid gender value, use one of: ${Object.keys(GenderEnum).join(', ')}`,
	// 	}),
	// ),
};

export const updateProfileSchema = {
	body: z
		.strictObject({
			firstName: generalFields.firstName,
			lastName: generalFields.lastName,
			username: generalFields.username,
			bio: generalFields.bio,
			gender: userFields.gender,
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

// export const paramsIdSchema = {
// 	params: z.strictObject({
// 		userId: generalFields.idOrUsername,
// 	}),
// };
// export type ParamsIdDTO = z.infer<typeof paramsIdSchema.params>;

export const userParamIdSchema = {
	params: z.strictObject({
		userId: generalFields.id,
	}),
};
export type UserParamIdDTO = z.infer<typeof userParamIdSchema.params>;

export const resetPasswordSchema = {
	body: z.strictObject({
		token: generalFields.token,
		password: generalFields.password,
		confirmPassword: generalFields.confirmPassword,
	}),
};
export type ResetPasswordDTO = z.infer<typeof resetPasswordSchema.body>;

export const usersQuerySchema = {
	query: z.object({
		page: generalFields.page.default(1).optional(),
		limit: generalFields.limit.default(10).optional(),
		order: generalFields.order.default(SortOrderEnum.DESC).optional(),
		sortBy: z.string().default('createdAt').optional(),
		search: generalFields.search.optional(),

		provider: userFields.provider.optional(),
		gender: userFields.gender.optional(),
		isVerified: z.coerce.boolean().optional(),
		isDeleted: z.coerce.boolean().optional(),
		status: userFields.status.optional(),
		statusReason: userFields.statusReason.optional(),
		role: userFields.role.optional(),
	}),
};

export type UsersQueryDTO = z.infer<typeof usersQuerySchema.query>;

export const updateUerRoleSchema = {
	body: z.strictObject({
		role: userFields.role,
	}),
	params: userParamIdSchema.params,
};

export type UpdateUserRoleDTO = z.infer<typeof updateUerRoleSchema.body>;

export const updateUerStatusSchema = {
	body: z.strictObject({
		status: userFields.status,
		statusReason: userFields.statusReason,
	}),
	params: userParamIdSchema.params,
};

export type UpdateUserStatusDTO = z.infer<typeof updateUerStatusSchema.body>;
