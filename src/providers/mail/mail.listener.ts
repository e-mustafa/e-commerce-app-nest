import { Inject, Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { type IMailService, MAIL_SERVICE } from './mail.service';
import {
	CMailChangedAlertOldEmail,
	CMailEmailUpdateSuccess,
	CMailRequestChangeEmailNotice,
	CMailRequestChangeEmailOtp,
	CMailResetPasswordLink,
	CMailRevertSuccessEmail,
	CMailVerifyAccountOtp,
	EMailEvent,
} from './mail.type-classes';

@Injectable()
export class MailListener {
	private readonly logger = new Logger(MailListener.name);
	// constructor(@Inject(MAIL_SERVICE) private readonly mailService: MailService) {}
	constructor(@Inject(MAIL_SERVICE) private readonly mailService: IMailService) {}

	@OnEvent(EMailEvent.VERIFY_ACCOUNT_OTP, { async: true })
	async handleVerifyOtpEvent(payload: CMailVerifyAccountOtp): Promise<void> {
		try {
			await this.mailService.verifyAccountOtp(payload);
		} catch (error) {
			this.logger.error(`Failed to handle verify OTP event for ${payload.email}`, (error as Error).stack);
		}
	}

	@OnEvent(EMailEvent.RESET_PASSWORD_LINK, { async: true })
	async handleResetPasswordLinkEvent(payload: CMailResetPasswordLink): Promise<void> {
		try {
			await this.mailService.resetPasswordLink(payload);
		} catch (error) {
			this.logger.error(`Failed to handle Reset Password link event for ${payload.email}`, (error as Error).stack);
		}
	}

	@OnEvent(EMailEvent.REQUEST_CHANGE_EMAIL_OTP, { async: true })
	async handleRequestChangeEmailOtpEvent(payload: CMailRequestChangeEmailOtp): Promise<void> {
		try {
			await this.mailService.requestChangeEmailOtp(payload);
		} catch (error) {
			this.logger.error(`Failed to handle request change email OTP event for ${payload.email}`, (error as Error).stack);
		}
	}

	@OnEvent(EMailEvent.REQUEST_CHANGE_NOTICE, { async: true })
	async handleRequestChangeNoticeEvent(payload: CMailRequestChangeEmailNotice): Promise<void> {
		try {
			await this.mailService.requestChangeNotice(payload);
		} catch (error) {
			this.logger.error(`Failed to handle request change notice event for ${payload.email}`, (error as Error).stack);
		}
	}

	@OnEvent(EMailEvent.CHANGED_ALERT_OLD_EMAIL, { async: true })
	async handleChangedAlertOldEmailEvent(payload: CMailChangedAlertOldEmail): Promise<void> {
		try {
			await this.mailService.changedAlertOldEmail(payload);
		} catch (error) {
			this.logger.error(`Failed to handle changed alert old email event for ${payload.email}`, (error as Error).stack);
		}
	}

	@OnEvent(EMailEvent.EMAIL_UPDATE_SUCCESS, { async: true })
	async handleEmailUpdateSuccessEvent(payload: CMailEmailUpdateSuccess): Promise<void> {
		try {
			await this.mailService.emailUpdateSuccess(payload);
		} catch (error) {
			this.logger.error(`Failed to handle email update success event for ${payload.email}`, (error as Error).stack);
		}
	}

	@OnEvent(EMailEvent.REVERT_SUCCESS_EMAIL, { async: true })
	async handleRevertSuccessEmailEvent(payload: CMailRevertSuccessEmail): Promise<void> {
		try {
			await this.mailService.revertSuccessEmail(payload);
		} catch (error) {
			this.logger.error(`Failed to handle revert success email event for ${payload.email}`, (error as Error).stack);
		}
	}
}
