import { type AppConfig, appConfig } from '@/config';
import { MailerService } from '@nestjs-modules/mailer';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { SentMessageInfo } from 'nodemailer';
import {
	CMailChangedAlertOldEmail,
	CMailEmailUpdateSuccess,
	CMailRequestChangeEmailNotice,
	CMailRequestChangeEmailOtp,
	CMailResetPasswordLink,
	CMailRevertSuccessEmail,
	CMailVerifyAccountOtp,
} from './mail.type-classes';

export const MAIL_SERVICE = Symbol('MAIL_SERVICE');

export type TMailLocale = 'en' | 'ar';

export interface IMailService {
	verifyAccountOtp({ email, username, otp, locale }: CMailVerifyAccountOtp): Promise<SentMessageInfo | null>;
	resetPasswordLink({ email, username, link, period, locale }: CMailResetPasswordLink): Promise<SentMessageInfo | null>;
	requestChangeEmailOtp({ email, username, otp, locale }: CMailRequestChangeEmailOtp): Promise<SentMessageInfo | null>;
	requestChangeNotice({
		email,
		username,
		newEmail,
		locale,
	}: CMailRequestChangeEmailNotice): Promise<SentMessageInfo | null>;
	changedAlertOldEmail({
		email,
		username,
		newEmail,
		revertUrl,
		locale,
	}: CMailChangedAlertOldEmail): Promise<SentMessageInfo | null>;
	emailUpdateSuccess({ email, username, locale }: CMailEmailUpdateSuccess): Promise<SentMessageInfo | null>;
	revertSuccessEmail({ email, username, locale }: CMailRevertSuccessEmail): Promise<SentMessageInfo | null>;
}

@Injectable()
export class MailService implements IMailService {
	private readonly logger = new Logger('MAIL_SERVICE');

	constructor(
		@Inject(appConfig.KEY)
		private readonly APP: AppConfig,
		private readonly mailerService: MailerService,
	) {}

	async verifyAccountOtp({ email, username, otp, locale = 'en' }: CMailVerifyAccountOtp): Promise<SentMessageInfo | null> {
		const appName = this.APP.app.name;
		const subject_ar = `تفعيل حسابك في ${appName}`;
		const subject_en = `Verify your account in ${appName}`;

		const template_ar = 'verify-account-otp_ar';
		const template_en = 'verify-account-otp_en';

		try {
			const result = await this.mailerService.sendMail({
				to: email,
				subject: locale === 'ar' ? subject_ar : subject_en,
				template: locale === 'ar' ? template_ar : template_en,
				context: { otp, appName, name: username },
			});

			this.logger.log(`Verification OTP sent to (${email}) successfully!`);
			return result;
		} catch (error) {
			this.logger.error(
				`Failed to send verification OTP to (${email}): ${(error as Error).message}`,
				(error as Error).stack,
			);
			return null;
		}
	}

	async resetPasswordLink({
		email,
		username,
		link,
		period = this.APP.otp.resetPassword.expiresIn,
		locale = 'en',
	}: CMailResetPasswordLink): Promise<SentMessageInfo | null> {
		const appName = this.APP.app.name;
		const subject_ar = `إعادة تعيين كلمة المرور في ${appName}`;
		const subject_en = `Reset your password in ${appName}`;

		const template_ar = 'reset-password-link_ar.ejs';
		const template_en = 'reset-password-link_en.ejs';

		try {
			const result = await this.mailerService.sendMail({
				to: email,
				subject: locale === 'ar' ? subject_ar : subject_en,
				template: locale === 'ar' ? template_ar : template_en,
				context: { link, period, appName, name: username },
			});

			this.logger.log(`Reset password link sent to (${email}) successfully!`);
			return result;
		} catch (error) {
			this.logger.error(
				`Failed to send reset password link to (${email}): ${(error as Error).message}`,
				(error as Error).stack,
			);
			return null;
		}
	}

	/**
	 * Send request to change email OTP -> new email
	 */
	async requestChangeEmailOtp({
		email,
		username,
		otp,
		locale = 'en',
	}: CMailRequestChangeEmailOtp): Promise<SentMessageInfo | null> {
		const appName = this.APP.app.name;
		const subject_ar = `طلب تغيير بريدك الإلكتروني - ${appName}`;
		const subject_en = `Request to change your email - ${appName}`;

		const template_ar = 'request-change-email-otp_ar.ejs';
		const template_en = 'request-change-email-otp_en.ejs';

		try {
			const result = await this.mailerService.sendMail({
				to: email,
				subject: locale === 'ar' ? subject_ar : subject_en,
				template: locale === 'ar' ? template_ar : template_en,
				context: { otp, appName, name: username },
			});

			this.logger.log(`Request to change email sent to (${email}) successfully!`);
			return result;
		} catch (error) {
			this.logger.error(
				`Failed to send request to change email to (${email}): ${(error as Error).message}`,
				(error as Error).stack,
			);
			return null;
		}
	}

	/**
	 * Send request to change email notice -> old email
	 */
	async requestChangeNotice({
		email,
		username,
		newEmail,
		locale = 'en',
	}: CMailRequestChangeEmailNotice): Promise<SentMessageInfo | null> {
		const appName = this.APP.app.name;
		const subject_ar = `تنبيه أمني: طلب تغيير البريد الإلكتروني - ${appName}`;
		const subject_en = `Security Notice: Request to change your email - ${appName}`;

		const template_ar = 'email-change-notice_ar.ejs';
		const template_en = 'email-change-notice_en.ejs';

		try {
			const result = await this.mailerService.sendMail({
				to: email,
				subject: locale === 'ar' ? subject_ar : subject_en,
				template: locale === 'ar' ? template_ar : template_en,
				context: { newEmail, appName, name: username },
			});

			this.logger.log(`Email change notice sent to (${email}) successfully!`);
			return result;
		} catch (error) {
			this.logger.error(
				`Failed to send email change notice to (${email}): ${(error as Error).message}`,
				(error as Error).stack,
			);
			return null;
		}
	}

	/**
	 * Send changed email alert -> old email
	 */
	async changedAlertOldEmail({
		email,
		username,
		newEmail,
		revertUrl,
		locale = 'en',
	}: CMailChangedAlertOldEmail): Promise<SentMessageInfo | null> {
		const appName = this.APP.app.name;
		const subject_ar = `تنبيه أمني: تم تغيير البريد الإلكتروني في ${appName}`;
		const subject_en = `Security Notice: Email Changed in ${appName}`;

		const template_ar = 'email-changed-alert_ar.ejs';
		const template_en = 'email-changed-alert_en.ejs';

		try {
			const result = await this.mailerService.sendMail({
				to: email,
				subject: locale === 'ar' ? subject_ar : subject_en,
				template: locale === 'ar' ? template_ar : template_en,
				context: { newEmail, revertUrl, appName, name: username },
			});

			this.logger.log(`Changed email alert sent to (${email}) successfully!`);
			return result;
		} catch (error) {
			this.logger.error(
				`Failed to send changed email alert to (${email}): ${(error as Error).message}`,
				(error as Error).stack,
			);
			return null;
		}
	}

	/**
	 * Send successful email update notification -> new email
	 */
	async emailUpdateSuccess({ email, username, locale = 'en' }: CMailEmailUpdateSuccess): Promise<SentMessageInfo | null> {
		const appName = this.APP.app.name;
		const subject_ar = `تم تحديث البريد الإلكتروني بنجاح - ${appName}`;
		const subject_en = `Email Updated Successfully - ${appName}`;

		const template_ar = 'email-update-success_ar.ejs';
		const template_en = 'email-update-success_en';

		try {
			const result = await this.mailerService.sendMail({
				to: email,
				subject: locale === 'ar' ? subject_ar : subject_en,
				template: locale === 'ar' ? template_ar : template_en,
				context: { appName, name: username },
			});

			this.logger.log(`Email update success notification sent to (${email}) successfully!`);
			return result;
		} catch (error) {
			this.logger.error(
				`Failed to send email update success notification to (${email}): ${(error as Error).message}`,
				(error as Error).stack,
			);
			return null;
		}
	}

	/**
	 * Send account restored notification
	 */
	async revertSuccessEmail({ email, username, locale = 'en' }: CMailRevertSuccessEmail): Promise<SentMessageInfo | null> {
		const appName = this.APP.app.name;
		const subject_ar = `تم استعادة الحساب بنجاح - ${appName}`;
		const subject_en = `Account Restored Successfully - ${appName}`;

		const template_ar = 'email-revert-success_ar.ejs';
		const template_en = 'email-revert-success_en.ejs';

		try {
			const result = await this.mailerService.sendMail({
				to: email,
				subject: locale === 'ar' ? subject_ar : subject_en,
				template: locale === 'ar' ? template_ar : template_en,
				context: { appName, name: username },
			});

			this.logger.log(`Revert success email sent to (${email}) successfully!`);
			return result;
		} catch (error) {
			this.logger.error(
				`Failed to send revert success email to (${email}): ${(error as Error).message}`,
				(error as Error).stack,
			);
			return null;
		}
	}
}
