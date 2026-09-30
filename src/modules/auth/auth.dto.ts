import { generalFields } from '@/common/validation';
import z from 'zod';

export const checkUsernameSchema = {
	body: z.strictObject({
		username: generalFields.username,
	}),
};

export type CheckUserNameDTO = z.infer<typeof checkUsernameSchema.body>;

export const registerSchema = {
	body: z
		.strictObject({
			firstName: generalFields.firstName,
			lastName: generalFields.lastName,
			username: generalFields.username,
			email: generalFields.email,
			password: generalFields.password,
			confirmPassword: generalFields.confirmPassword,
		})
		.refine((data) => data.password === data.confirmPassword, {
			error: 'Passwords mismatch',
			path: ['confirmPassword'],
		}),
};
export type RegisterDTO = z.infer<typeof registerSchema.body>;

export const resendOtpSchema = {
	body: z.strictObject({
		email: generalFields.email,
	}),
};
export type ResendOtpDTO = z.infer<typeof resendOtpSchema.body>;

export const verifyAccountSchema = {
	body: z.strictObject({
		email: generalFields.email,
		otp: generalFields.otp,
	}),
};
export type VerifyAccountDTO = z.infer<typeof verifyAccountSchema.body>;

export const loginSchema = {
	body: z.strictObject({
		email: generalFields.email,
		password: generalFields.password,
		rememberMe: z.boolean().optional().default(false),
	}),
};
export type LoginDTO = z.infer<typeof loginSchema.body>;

export const refreshAccessTokenSchema = {
	cookies: z.strictObject({
		refreshToken: z.string().min(1, 'Refresh token is required'),
	}),
	// .loose(),
};
export type RefreshAccessTokenDTO = z.infer<typeof refreshAccessTokenSchema.cookies>;

export const socialGoogleSchema = {
	body: z.strictObject({
		idToken: z.string().min(1, 'ID token is required'),
	}),
};
export type SocialGoogleDTO = z.infer<typeof socialGoogleSchema.body>;

export const changePasswordSchema = {
	body: z
		.strictObject({
			currentPassword: generalFields.password,
			newPassword: generalFields.password,
			confirmNewPassword: generalFields.confirmPassword,
		})
		.refine((data) => data.newPassword === data.confirmNewPassword, {
			error: 'new and confirm Passwords mismatch',
			path: ['confirmNewPassword'],
		})
		.refine((data) => data.currentPassword !== data.newPassword, {
			error: 'New password cannot be the same as current password',
			path: ['newPassword'],
		}),
};
export type ChangePasswordDTO = z.infer<typeof changePasswordSchema.body>;

export const forgetPasswordSchema = {
	body: z.strictObject({
		email: generalFields.email,
	}),
};
export type ForgetPasswordDTO = z.infer<typeof forgetPasswordSchema.body>;

export const resetPasswordSchema = {
	body: z
		.strictObject({
			token: generalFields.token,
			password: generalFields.password,
			confirmPassword: generalFields.confirmPassword,
		})
		.refine((data) => data.password === data.confirmPassword, {
			error: 'Passwords mismatch',
			path: ['confirmPassword'],
		}),
};
export type ResetPasswordDTO = z.infer<typeof resetPasswordSchema.body>;

export const reactivateAccountSchema = {
	body: z.strictObject({
		email: generalFields.email,
		token: generalFields.token,
	}),
};

export type ReactivateAccountDTO = z.infer<typeof reactivateAccountSchema.body>;

export const removeSessionSchema = {
	params: z.strictObject({
		sessionId: z.string().min(1, 'Session id is required'),
	}),
};

export type RemoveSessionDTO = z.infer<typeof removeSessionSchema.params>;
