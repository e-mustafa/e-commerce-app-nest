import { Id } from '@/common/types';
import { AccountProviderEnum } from '../user';
import type * as dto from './auth.dto';

export interface ICheckUsernamePayload extends dto.CheckUserNameDTO {
	userId: Id;
}

export interface IRegisterPayload extends dto.RegisterDTO {}
export interface IResendOtpPayload extends dto.ResendOtpDTO {}
export interface IVerifyAccountPayload extends dto.VerifyAccountDTO {}
export interface ILoginPayload extends dto.LoginDTO {
	clientIp?: string;
	userAgent?: string;
}

export interface IRefreshAccessTokenPayload {
	authorization: string;
	clientIp?: string;
	userAgent?: string;
}

export interface ISocialLoginPayload extends dto.SocialGoogleDTO {
	provider: AccountProviderEnum;
	clientIp?: string;
	userAgent?: string;
}

export interface IChangePasswordPayload extends dto.ChangePasswordDTO {
	userId: Id;
}

export interface IRequestChangeEmailPayload extends dto.RequestChangeEmailDTO {
	userId: Id;
}

export interface IReactivateAccountPayload extends dto.ReactivateAccountDTO {
	clientIp?: string;
	userAgent?: string;
}