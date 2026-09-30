import { AUser } from '@/common/decorators/request.decorator';
import type { Id } from '@/common/types';
import { Body, Controller, Cookies, Get, HttpStatus, Param, Patch, Post, Req, Res } from '@nestjs/common';
import type { Request, Response } from 'express';
import { ProviderEnum } from '../user/user.enums';
import type * as dto from './auth.dto';
import * as S from './auth.dto';
import AuthService from './services/auth.service';
import { CookieService } from './services/cookie.service';

const routes = {
	base: '/auth',
	checkUsername: '/check-username',
	register: '/register',
	resendOtp: '/verify-account/resend-otp',

	login: '/login',
	refreshToken: '/refresh-token',

	verifyAccount: '/verify-account',

	socialLogin_google: '/social-login/google',

	changePassword: '/change-password',

	forgotPassword: '/forgot-password',
	resetPassword: '/reset-password',

	// TODO - requestChangeEmail
	// requestChangeEmail: '/request-change-email',
	// changeEmail: '/change-email',
	// revertEmail: '/revert-email',

	logout: '/logout',
	logoutAll: '/logout-all',

	// get sessions
	getSessions: '/sessions',
	getSession: '/session',

	removeSessions: '/sessions/:sessionId',

	activateMyAccount: '/reactivate',
	deactivateMyAccount: '/deactivate',
};

@Controller(routes.base)
export default class AuthController {
	constructor(
		private readonly service: AuthService,
		private readonly cookieService: CookieService,
	) {}

	@Post(routes.checkUsername)
	async checkUsername(@AUser('_id') userId: Id, @Body({ schema: S.checkUsernameSchema.body }) body: dto.CheckUserNameDTO) {
		const available = await this.service.checkUsername({ userId, ...body });
		return { data: { available } };
	}

	@Post(routes.register)
	async register(@Body({ schema: S.registerSchema.body }) body: dto.RegisterDTO) {
		await this.service.register(body);
		return { status: HttpStatus.CREATED, message: 'Your account created successfully, please verify your account' };
	}

	@Post(routes.resendOtp)
	async resendOtp(@Body({ schema: S.resendOtpSchema.body }) body: dto.ResendOtpDTO) {
		await this.service.resendOtp(body);
		return { message: 'Otp sent successfully' };
	}

	@Patch(routes.verifyAccount)
	async verifyAccount(@Body({ schema: S.verifyAccountSchema.body }) body: dto.VerifyAccountDTO) {
		await this.service.verifyAccount(body);
		return { message: 'Account verified successfully' };
	}

	@Post(routes.login)
	async login(@Req() req: Request, @Body({ schema: S.loginSchema.body }) body: dto.LoginDTO) {
		const data = await this.service.login({
			...body,
			clientIp: req.ip,
			userAgent: req.headers['user-agent'] || req.get('User-Agent'),
		});
		const message = data.requiresReactivation
			? 'Account is deactivated. Confirmation required to reactivate.'
			: 'Login successfully';

		return { message, data };
	}

	@Patch(routes.refreshToken)
	async refreshAccessToken(@Req() req: Request, @Cookies() cookies: dto.RefreshAccessTokenDTO) {
		const data = await this.service.refreshAccessToken({
			authorization: cookies.refreshToken || '',
			clientIp: req.ip,
			userAgent: req.headers['user-agent'] || req.get('User-Agent'),
		});
		return { data };
	}

	@Post(routes.socialLogin_google)
	async socialLogin_google(
		@Body({ schema: S.socialGoogleSchema.body }) body: dto.SocialGoogleDTO,
		@Res({ passthrough: true }) res: Response,
	) {
		const { isNew, tokens } = await this.service.socialLogin_google({ provider: ProviderEnum.GOOGLE, ...body });
		this.cookieService.setAuthCookies(res, tokens);
		if (isNew) {
			return { status: 201, message: 'Account created successfully', data: tokens };
		} else {
			return { message: 'Login successfully', data: tokens };
		}
	}

	@Post(routes.changePassword)
	async changePassword(
		@AUser('_id') userId: Id,
		@Body({ schema: S.changePasswordSchema.body }) body: dto.ChangePasswordDTO,
	) {
		await this.service.changePassword({ userId, ...body });
		return { message: 'Password changed successfully' };
	}

	@Post(routes.forgotPassword)
	async forgotPassword(@Body({ schema: S.forgetPasswordSchema.body }) body: dto.ForgetPasswordDTO) {
		await this.service.forgetPassword(body);
		return { message: 'Otp sent successfully' };
	}

	@Post(routes.resetPassword)
	async resetPassword(@Body({ schema: S.resetPasswordSchema.body }) body: dto.ResetPasswordDTO) {
		await this.service.resetPassword(body);
		return { message: 'Password changed successfully' };
	}

	@Post(routes.logout)
	async logout(
		@Cookies() cookies: dto.RefreshAccessTokenDTO,
		@Res({ passthrough: true }) res: Response,
	) {
		await this.service.logout(cookies.refreshToken);
		this.cookieService.clearCookies(res);
		return { message: 'Logout successfully' };
	}

	@Post(routes.logoutAll)
	async logoutAll(
		@Cookies() cookies: dto.RefreshAccessTokenDTO,
		@Res({ passthrough: true }) res: Response,
	) {
		await this.service.logoutAll(cookies.refreshToken);
		this.cookieService.clearCookies(res);
		return { message: 'Logout all successfully' };
	}

	@Get(routes.getSession)
	async getSessions(
		@AUser('_id') userId: Id,
		@Cookies() cookies: dto.RefreshAccessTokenDTO,
	) {
		const data = await this.service.getThisSession(userId, cookies.refreshToken);
		return { data };
	}

	@Get(routes.getSessions)
	async getMySessions(
		@AUser('_id') userId: Id,
		@Cookies() cookies: dto.RefreshAccessTokenDTO,
	) {
		const data = await this.service.getMySessions(userId, cookies.refreshToken);
		return { data };
	}

	async removeSession(
		@Param({ schema: S.removeSessionSchema.params }) params: dto.RemoveSessionDTO,
		@Cookies() cookies: dto.RefreshAccessTokenDTO,
		@Res({ passthrough: true }) res: Response,
	) {
		const isLogout = await this.service.removeSession(cookies.refreshToken, params.sessionId);

		if (isLogout) {
			// remove cookies
			this.cookieService.clearCookies(res);
		}
		return { message: 'Session removed successfully' };
	}

	async deactivateMyAccount(
		@AUser('_id') userId: Id,
		@Cookies() cookies: dto.RefreshAccessTokenDTO,
		@Res({ passthrough: true })
		res: Response,
	) {
		const data = await this.service.deactivateMyAccount(userId, cookies.refreshToken);
		// remove cookies
		this.cookieService.clearCookies(res);
		return { message: 'Account deactivated successfully', data };
	}

	async reactivateMyAccount(
		@Req() req: Request,
		@Body({ schema: S.reactivateAccountSchema.body }) body: dto.ReactivateAccountDTO,
	) {
		const data = await this.service.reactivateMyAccount({
			...body,
			clientIp: req.ip,
			userAgent: req.headers['user-agent'] || req.get('User-Agent'),
		});
		return { message: 'Account activated and login successfully.', data };
	}
}
