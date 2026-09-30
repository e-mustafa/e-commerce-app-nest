export type TMailLocale = 'en' | 'ar';

// Enum defining all mail event names to prevent typos
export enum EMailEvent {
	VERIFY_ACCOUNT_OTP = 'mail:auth.verifyAccountOtp',
	RESET_PASSWORD_LINK = 'mail:auth.resetPasswordLink',
	REQUEST_CHANGE_EMAIL_OTP = 'mail:auth.requestChangeEmailOtp',
	REQUEST_CHANGE_NOTICE = 'mail:auth.requestChangeNotice',
	CHANGED_ALERT_OLD_EMAIL = 'mail:auth.changedAlertOldEmail',
	EMAIL_UPDATE_SUCCESS = 'mail:auth.emailUpdateSuccess',
	REVERT_SUCCESS_EMAIL = 'mail:auth.revertSuccessEmail',
}

export class CMailVerifyAccountOtp {
	constructor(
		public readonly email: string,
		public readonly username: string,
		public readonly otp: string,
		public readonly locale: TMailLocale = 'en',
	) {}
}

export class CMailResetPasswordLink {
	constructor(
		public readonly email: string,
		public readonly username: string,
		public readonly link: string,
		public readonly period?: number,
		public readonly locale: TMailLocale = 'en',
	) {}
}

export class CMailRequestChangeEmailOtp {
	constructor(
		public readonly email: string,
		public readonly username: string,
		public readonly otp: string,
		public readonly locale: TMailLocale = 'en',
	) {}
}

export class CMailRequestChangeEmailNotice {
	constructor(
		public readonly email: string,
		public readonly username: string,
		public readonly newEmail: string,
		public readonly locale: TMailLocale = 'en',
	) {}
}

export class CMailChangedAlertOldEmail {
	constructor(
		public readonly email: string,
		public readonly username: string,
		public readonly newEmail: string,
		public readonly revertUrl: string,
		public readonly locale: TMailLocale = 'en',
	) {}
}

export class CMailEmailUpdateSuccess {
	constructor(
		public readonly email: string,
		public readonly username: string,
		public readonly locale: TMailLocale = 'en',
	) {}
}

export class CMailRevertSuccessEmail {
	constructor(
		public readonly email: string,
		public readonly username: string,
		public readonly locale: TMailLocale = 'en',
	) {}
}


// Map each EMailEvent to its corresponding payload class
export type TMailEventPayloadMap = {
   [EMailEvent.VERIFY_ACCOUNT_OTP]: CMailVerifyAccountOtp;
   [EMailEvent.RESET_PASSWORD_LINK]: CMailResetPasswordLink;
   [EMailEvent.REQUEST_CHANGE_EMAIL_OTP]: CMailRequestChangeEmailOtp;
   [EMailEvent.REQUEST_CHANGE_NOTICE]: CMailRequestChangeEmailNotice;
   [EMailEvent.CHANGED_ALERT_OLD_EMAIL]: CMailChangedAlertOldEmail;
   [EMailEvent.EMAIL_UPDATE_SUCCESS]: CMailEmailUpdateSuccess;
   [EMailEvent.REVERT_SUCCESS_EMAIL]: CMailRevertSuccessEmail;
};