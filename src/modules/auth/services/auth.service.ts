import {
	BadRequestException,
	ConflictException,
	ForbiddenException,
	InternalException,
	NotFoundException,
	TooManyRequestsException,
	UnauthorizedException,
	ValidationErrorsException,
} from '@/common/exceptions';
import { Id } from '@/common/types';
import { type AppConfig, appConfig, type EnvConfig, envConfig } from '@/config';
import {
	HUser,
	ISessionInfo,
	ISessionResponse,
	IUser,
	ProviderEnum,
	selectUserInfo,
	StatusReasonEnum,
	UserStatusEnum,
} from '@/modules/user';
import { UserRepository } from '@/modules/user/user.repository';
import { AppEventEmitter } from '@/providers/event/typed-event-emitter.service';
import {
	CMailChangedAlertOldEmail,
	CMailEmailUpdateSuccess,
	CMailRequestChangeEmailNotice,
	CMailRequestChangeEmailOtp,
	CMailResetPasswordLink,
	CMailRevertSuccessEmail,
	CMailVerifyAccountOtp,
	EMailEvent,
} from '@/providers/mail';
import { TTokens } from '@/providers/security';
import { GoogleAuthService } from '@/providers/security/services/google-auth.service';
import { HashingService } from '@/providers/security/services/hashing.service';
import { TokenService } from '@/providers/security/services/token.service';
import { Inject, Injectable } from '@nestjs/common';
import { TokenPayload } from 'google-auth-library';
import type * as I from '../auth-service.interface';
import type * as dto from '../auth.dto';
import { TLoginResult } from '../auth.types';
import {
	ChangeEmailOtpRedisService,
	ReactiveAccountRedisService,
	RefreshTokenRedisService,
	ResetPasswordRedisService,
	RevertEmailTokenRedisService,
	VerifyAccountOtpRedisService,
} from '../redis';

@Injectable()
export default class AuthService {
	constructor(
		// Method 1: Inject full ConfigService
		// private readonly configService: ConfigService,

		// Method 2: Inject strongly-typed namespace configuration directly (Recommended)
		@Inject(envConfig.KEY) private readonly ENV: EnvConfig,
		@Inject(appConfig.KEY) private readonly APP: AppConfig,

		// @InjectModel(User.name) private readonly UserModel: Model<HUser>,
		private readonly UserRepo: UserRepository,
		private readonly tokenService: TokenService,
		private readonly hashingService: HashingService,
		private readonly googleAuthService: GoogleAuthService,
		private readonly otpService: VerifyAccountOtpRedisService,
		private readonly refreshTokenService: RefreshTokenRedisService,
		private readonly resetPasswordService: ResetPasswordRedisService,
		private readonly changeEmailOtpServices: ChangeEmailOtpRedisService,
		private readonly reactiveAccountService: ReactiveAccountRedisService,
		private readonly revertEmailTokenService: RevertEmailTokenRedisService,
		private readonly eventEmitter: AppEventEmitter,
	) {}

	async checkUsername(username: I.ICheckUsernamePayload['username']): Promise<boolean> {
		const existUsername = await this.UserRepo.findOne({ username }).select('username').exec();
		if (existUsername) throw new ValidationErrorsException({ body: { username: 'Username already taken' } });
		return true;
	}

	/**
	 * Registers a new user account, generates an initial OTP, and emits a verification email event.
	 */
	async register({
		firstName,
		lastName,
		username,
		email,
		password,
		confirmPassword,
	}: I.IRegisterPayload): Promise<boolean> {
		// 1. Check if the email is already registered
		const existEmail = await this.UserRepo.findByEmail(email).select('email').exec();
		if (existEmail) {
			throw new ConflictException('This email is already registered', {
				body: { email: 'This email is already registered' },
			});
		}

		// 2. Validate password confirmation match
		if (password !== confirmPassword) {
			throw new ConflictException('Passwords mismatch', {
				body: { confirmPassword: 'Passwords mismatch' },
			});
		}

		// 3. Create and automatically persist user to DB
		// const user: IUserDocument = await User.create({
		const user = await this.UserRepo.create({
			firstName,
			lastName,
			username,
			email,
			password, //: await generateHash(password, undefined, true), move to mongoose pre hooks
		});

		// 4. Generate OTP and initialize Redis entries (OTP, Cooldown, Attempts)
		const otp = this.hashingService.generateOtp();
		await this.otpService.setOtp(user.email, this.hashingService.hashOtp(otp));

		// 5. Dispatch account verification email event
		const payload = new CMailVerifyAccountOtp(user.email, user.firstName || '', otp);
		this.eventEmitter.emit(EMailEvent.VERIFY_ACCOUNT_OTP, payload);

		return true;
	}

	/**
	 * Resend a new OTP to the user's email if cooldown and attempt limits are respected.
	 */
	async resendOtp({ email }: I.IResendOtpPayload): Promise<boolean> {
		// 1. Fetch user (Silent return if not found to prevent user enumeration attacks)
		const user = await this.UserRepo.findByEmail(email).select('email firstName verifiedAt').lean().exec();
		if (!user) throw new NotFoundException('User not found');
		
		if (user.verifiedAt) throw new BadRequestException('Your account is already verified');

		const userEmail = user.email;

		// 2. Check if active cooldown period exists
		const isCooldown = await this.otpService.isCooldownActive(userEmail);
		if (isCooldown) {
			const remainingSeconds = await this.otpService.getCooldownTime(userEmail);
			throw new TooManyRequestsException('OTP is still valid, please wait before requesting a new one', remainingSeconds);
		}

		// 3. Verify max allowed resend attempts
		const currentAttempts = (await this.otpService.getAttempts(userEmail)) || 0;
		const maxAttempts = this.APP.otp.verifyEmail.sendAttempts || 3;

		if (Number(currentAttempts) >= maxAttempts) {
			const remainingSeconds = await this.otpService.getCooldownTime(userEmail);

			throw new TooManyRequestsException('Maximum OTP requests reached. Try again later.', remainingSeconds);
		}

		// 4. Generate new OTP and refresh Redis states
		const otp = this.hashingService.generateOtp();
		await this.otpService.setOtp(user.email, this.hashingService.hashOtp(otp));

		// 5. Dispatch email event
		// emailEvents.emitAsync('verify-account', { email: userEmail, name: user.firstName || '', otp });
		const payload = new CMailVerifyAccountOtp(user.email, user.firstName || '', otp);
		this.eventEmitter.emit(EMailEvent.VERIFY_ACCOUNT_OTP, payload);

		return true;
	}

	/**
	 * Verifies the submitted OTP against stored Redis hash and activates user account.
	 */
	async verifyAccount({ email, otp }: I.IVerifyAccountPayload): Promise<boolean> {
		// 1. Validate user existence
		const user = await this.UserRepo.findByEmail(email).exec();
		if (!user) {
			throw new ConflictException('User not found');
		}

		// 2. Prevent re-verification of already verified users
		if (user.verifiedAt) {
			throw new BadRequestException('User already verified');
		}

		const userEmail: string = user.email;

		// 3. Check if user exceeded maximum failed verification guesses
		const failedAttemptsCount = (await this.otpService.getAttempts(userEmail)) || 0;
		const maxFailedAllowed = this.APP.otp.verifyEmail.failedAttempts || 5;

		if (Number(failedAttemptsCount) >= maxFailedAllowed) {
			// Invalidate current OTP upon exceeding allowed failed guesses
			await this.otpService.deleteOtp(userEmail);

			const remainingSeconds = await this.otpService.getCooldownTime(userEmail);

			throw new TooManyRequestsException('Too many failed attempts. This OTP has been invalidated.', remainingSeconds);
		}

		// 4. Retrieve hashed OTP from Redis
		const hashedOTP = await this.otpService.getOtp(userEmail);

		if (!hashedOTP) {
			throw new ValidationErrorsException({ body: { otp: 'Invalid or expired OTP' } });
		}

		// 5. Verify match between input OTP and stored hash
		const isValid = await this.hashingService.verifyOtp(otp, hashedOTP);
		if (!isValid) {
			// increment failed attempts if invalid otp
			await this.otpService.incrementFailedAttempts(userEmail);
			// const newFailedCount = await  this.otpService.incrementFailedAttempts(userEmail);
			// if (newFailedCount === 1) {
			// 	await redisVerifyAccountFailedAttempts.expire(userEmail, appConfig.otp.verifyEmail.expiresIn || 300);
			// }

			throw new ValidationErrorsException({ body: { otp: 'Invalid OTP' } }, 'Invalid OTP');
		}

		// 6. Update user verification timestamp
		// const update = await User.updateOne({ _id: user._id }, { verifiedAt: new Date() });
		const update = await this.UserRepo.updateOne({ _id: user._id }, { verifiedAt: new Date() });

		// 7. Purge all related Redis keys after successful verification
		await Promise.all([
			// redisVerifyAccountOtp.delete(userEmail),
			// redisVerifyAccountAttempts.delete(userEmail),
			// redisVerifyAccountCooldown.delete(userEmail),
			// redisVerifyAccountFailedAttempts.delete(userEmail),

			this.otpService.deleteOtp(userEmail),
			this.otpService.deleteAttempts(userEmail),
			this.otpService.deleteFailedAttempts(userEmail),
		]);

		return update.modifiedCount > 0;
	}

	public async login({ email, password, rememberMe = false, clientIp, userAgent }: I.ILoginPayload): Promise<TLoginResult> {
		const user = await this.UserRepo.findByEmail(email, { ignoreDefaultFilters: true }).exec();

		if (!user) {
			throw new NotFoundException('Invalid Credentials');
		}

		if (!(await this.hashingService.verifyHash(password, user.password!, true))) {
			throw new BadRequestException('Invalid Credentials');
		}

		// Handle Account Deletion State - Throw Exception instead of returning object
		if (user.status === UserStatusEnum.DELETING) {
			throw new ForbiddenException('Account is scheduled for deletion');
		}

		// Handle Deactivated Account Status
		if (user.status === UserStatusEnum.INACTIVE) {
			const reactivationToken = this.hashingService.generateRandomToken();
			await this.reactiveAccountService.set(user.id, this.hashingService.hashToken(reactivationToken));

			return {
				requiresReactivation: true,
				reactivationToken,
			};
		}

		const tokens = await this.tokenService.generateTokens(user, rememberMe);

		const sessionInfo: ISessionInfo = {
			ip: clientIp || 'Unknown',
			device: userAgent || 'Unknown Device',
			createdAt: new Date().toISOString(),
		};

		// Store refresh token with dynamic expiration calculated from rememberMe flag
		await this.refreshTokenService.setSession(
			[user._id.toString(), tokens.tokenId!],
			sessionInfo,
			tokens.refreshExpiration,
		);

		return tokens;
	}

	public async refreshAccessToken({ authorization, clientIp, userAgent }: I.IRefreshAccessTokenPayload): Promise<TTokens> {
		const payload = await this.tokenService.decode(authorization, true);
		if (!payload || !payload.id || !payload.jti) {
			throw new NotFoundException('Invalid refresh token');
		}

		// Check if refresh token session exists in Redis
		const existingSession = await this.refreshTokenService.getSession([payload.id, payload.jti]);
		if (!existingSession) {
			throw new NotFoundException('Refresh token is invalid or has been revoked, please login again.');
		}

		const user = await this.UserRepo.findById(payload.id).exec();
		if (!user) {
			throw new NotFoundException('User associated with this token no longer exists.');
		}

		// Validate token issuance timestamp against global logout timestamp
		if (user.loggedOutAllAt) {
			const tokenIssuedAtMs = (payload.iat ?? 0) * 1000;
			if (tokenIssuedAtMs < user.loggedOutAllAt.getTime()) {
				throw new UnauthorizedException('You have logged out all devices, please login again.');
			}
		}

		// Delete old refresh token from Redis
		await this.refreshTokenService.delete([payload.id, payload.jti]);

		// Issue new token pair retaining the remembered session state
		const tokens = await this.tokenService.generateTokens(user, !!payload.remembered);

		// Preserve original session start time while updating network metadata if needed
		const updatedSessionInfo: ISessionInfo = {
			ip: clientIp || existingSession.ip || 'Unknown',
			device: userAgent || existingSession.device || 'Unknown Device',
			createdAt: existingSession.createdAt || new Date().toISOString(),
		};

		// Save rotated refresh token session to Redis
		await this.refreshTokenService.setSession(
			[user._id.toString(), tokens.tokenId || ''],
			updatedSessionInfo,
			tokens.refreshExpiration,
		);

		return tokens;
	}

	async socialLogin_google({
		provider,
		idToken,
		clientIp,
		userAgent,
	}: I.ISocialLoginPayload & { clientIp?: string; userAgent?: string }): Promise<{ isNew: boolean; tokens: TTokens }> {
		if (!provider || !Object.values(ProviderEnum).includes(provider)) {
			throw new InternalException('Invalid provider');
		}

		let payload: TokenPayload | undefined;
		if (provider === ProviderEnum.GOOGLE) {
			payload = await this.googleAuthService.verifyOAuth2Google(idToken);
		}
		if (!payload) throw new BadRequestException('Invalid id token');

		const { email_verified, email, given_name, family_name, picture } = payload || {};

		if (!email_verified || !email) {
			throw new BadRequestException('Email not verified, Use another account');
		}

		// Ignore default filters to fetch inactive/deactivated users correctly
		const isExists = await this.UserRepo.findByEmail(email, { ignoreDefaultFilters: true }).exec();

		if (isExists && isExists.provider !== provider) {
			if (isExists.provider === ProviderEnum.SYSTEM) {
				throw new BadRequestException('Email already exists with password, please login with password');
			} else {
				throw new BadRequestException('Email already exists with another provider');
			}
		}

		let targetUser: HUser;
		let isNew = false;

		if (isExists) {
			targetUser = isExists;
		} else {
			isNew = true;
			targetUser = await this.UserRepo.create({
				email,
				firstName: given_name || email.split('@')[0]!,
				lastName: family_name || email.split('@')[0] || 'AA',
				avatar: picture ? { id: 'google-picture', url: picture } : null,
				provider,
				verifiedAt: new Date(),
			});
		}

		const tokens = await this.tokenService.generateTokens(targetUser, false);

		// Save session in Redis for both existing and new Google login users
		const sessionInfo: ISessionInfo = {
			ip: clientIp || 'Unknown',
			device: userAgent || 'Unknown Device',
			createdAt: new Date().toISOString(),
		};

		await this.refreshTokenService.setSession(
			[targetUser._id.toString(), tokens.tokenId!],
			sessionInfo,
			tokens.refreshExpiration,
		);

		return { isNew, tokens };
	}

	async forgetPassword({ email }: dto.ForgetPasswordDTO) {
		const user = await this.UserRepo.findByEmail(email).exec();
		if (!user) {
			throw new NotFoundException('This Email is not registered');
		}

		// create and hash reset token
		const resetToken = this.hashingService.generateRandomToken(64);
		const hashedResetToken = this.hashingService.hashToken(resetToken);

		// save hashed reset token to redis
		await this.resetPasswordService.set(hashedResetToken, user._id);

		// create reset password link
		const url = new URL(`${this.ENV.frontendUrl}${this.APP.routes.frontend.resetPassword}`);
		url.searchParams.set('token', resetToken);
		const resetUrl = url.href;

		// send reset password email
		const payload = new CMailResetPasswordLink(email, user.firstName || '', resetUrl);
		this.eventEmitter.emit(EMailEvent.RESET_PASSWORD_LINK, payload);

		return true;
	}

	async resetPassword({ token, password, confirmPassword }: dto.ResetPasswordDTO) {
		if (password !== confirmPassword) {
			throw new ConflictException('Passwords mismatch', {
				body: { confirmPassword: 'Passwords mismatch' },
			});
		}

		const hashedToken = this.hashingService.hashToken(token);
		const userId = await this.resetPasswordService.get(hashedToken);
		if (!userId) {
			throw new NotFoundException('Invalid or expired token');
		}

		// update user with new password
		const user = await this.UserRepo.findById(userId).exec();
		if (!user) {
			throw new NotFoundException('User not found');
		}

		user.password = password; // hash password handling in schema pre save

		// add loggedOutAllAt query if it enabled in settings -> (resetPassword_logoutAll = true)
		if (this.APP.auth.resetPasswordLogoutAll) {
			user.loggedOutAllAt = new Date();
		}

		await user.save();

		// delete reset password token from redis
		await this.resetPasswordService.delete(hashedToken);

		if (this.APP.auth.resetPasswordLogoutAll) {
			// logout all sessions
			await this.refreshTokenService.deletePattern(userId);
		}

		return true;
	}

	async changeEmailRequest({ userId, newEmail, password }: I.IRequestChangeEmailPayload): Promise<boolean> {
		const userIdStr = userId.toString();

		const user = await this.UserRepo.findById(userId).lean().exec();
		if (!user) throw new NotFoundException('User not found');

		if (user.email.toLowerCase() === newEmail.toLowerCase()) {
			throw new BadRequestException('New email cannot be the same as current email');
		}

		const isCooldown = await this.changeEmailOtpServices.isCooldownActive(userIdStr);
		if (isCooldown) {
			throw new TooManyRequestsException('Please wait before requesting another email change OTP');
		}

		const isValidPassword = await this.hashingService.verifyHash(password, user.password, true);
		if (!isValidPassword) {
			throw new BadRequestException('Invalid password', {
				body: { password: 'Invalid password' },
			});
		}

		const isEmailExists = await this.UserRepo.findByEmail(newEmail).exec();
		if (isEmailExists) {
			throw new BadRequestException('Email already exists', {
				body: { newEmail: 'Email already exists' },
			});
		}

		const otp = this.hashingService.generateOtp();
		await this.changeEmailOtpServices.set(userIdStr, { newEmail, otp });

		// Send OTP code directly to the NEW email address for verification
		const payloadNewEmailOtp = new CMailRequestChangeEmailOtp(newEmail, user.name || user.firstName, newEmail, otp);
		this.eventEmitter.emit(EMailEvent.REQUEST_CHANGE_EMAIL_OTP, payloadNewEmailOtp);

		// Send security notice to the CURRENT/OLD email address
		const payloadOldEmailNotice = new CMailRequestChangeEmailNotice(user.email, user.name || user.firstName, newEmail);
		this.eventEmitter.emit(EMailEvent.REQUEST_CHANGE_NOTICE, payloadOldEmailNotice);

		return true;
	}

	async changeEmail(userId: Id, otp: string): Promise<boolean> {
		const userIdStr = userId.toString();

		const user = await this.UserRepo.findById(userId).exec();
		if (!user) {
			throw new NotFoundException('User not found', 'changeEmailService-user-not-found');
		}

		const otpData = await this.changeEmailOtpServices.get(userIdStr);
		if (!otpData) {
			throw new BadRequestException('Expired OTP, please request a new one');
		}

		const failedAttempts = await this.changeEmailOtpServices.getAttempts(userIdStr);
		const maxFailed = this.APP.otp.changeEmail?.failedAttempts || 5;

		if (failedAttempts >= maxFailed) {
			await this.changeEmailOtpServices.delete(userIdStr);
			throw new TooManyRequestsException('Too many failed attempts. OTP has been invalidated');
		}

		if (otpData.otp !== otp) {
			await this.changeEmailOtpServices.incrementAttempts(userIdStr);
			throw new BadRequestException('Invalid OTP');
		}

		const oldEmail = user.email;
		user.email = otpData.newEmail;
		await user.save();

		await Promise.all([
			this.changeEmailOtpServices.delete(userIdStr),
			this.changeEmailOtpServices.deleteAttempts(userIdStr),
		]);

		const revertToken = this.hashingService.generateRandomToken();
		const hashedToken = this.hashingService.hashToken(revertToken);

		await this.revertEmailTokenService.set(userIdStr, { token: hashedToken, oldEmail });

		const url = new URL(`${this.ENV.frontendUrl}${this.APP.routes.frontend.revertEmail}`);
		url.searchParams.append('email', oldEmail);
		url.searchParams.append('userId', userIdStr);
		url.searchParams.append('token', revertToken);

		const revertUrl = url.toString();

		// Send security alert with revert token link to the OLD email
		const payloadOld = new CMailChangedAlertOldEmail(oldEmail, user.name || user.firstName, oldEmail, revertUrl);
		this.eventEmitter.emit(EMailEvent.CHANGED_ALERT_OLD_EMAIL, payloadOld);

		// Send confirmation email to the NEW email (now updated in DB)
		const payloadNew = new CMailEmailUpdateSuccess(user.email, user.name || user.firstName);
		this.eventEmitter.emit(EMailEvent.EMAIL_UPDATE_SUCCESS, payloadNew);

		return true;
	}

	async revertEmailBack(userId: Id, token: string): Promise<boolean> {
		const userIdStr = userId.toString();

		const user = await this.UserRepo.findById(userId).exec();
		if (!user) throw new NotFoundException('User not found');

		const savedToken = await this.revertEmailTokenService.get(userIdStr);
		if (!savedToken) {
			throw new BadRequestException('Invalid token or expired');
		}

		const hashedToken = this.hashingService.hashToken(token);

		if (savedToken.token !== hashedToken || !savedToken.oldEmail) {
			throw new BadRequestException('Invalid token');
		}

		// Restore old email and revoke active tokens
		user.email = savedToken.oldEmail;
		user.loggedOutAllAt = new Date();
		await user.save();

		await this.refreshTokenService.deletePattern(userIdStr);

		// Send confirmation to restored OLD email
		const payloadRestored = new CMailRevertSuccessEmail(savedToken.oldEmail, user.name || user.firstName);
		this.eventEmitter.emit(EMailEvent.REVERT_SUCCESS_EMAIL, payloadRestored);

		// Clean up revert token in Redis
		await this.revertEmailTokenService.delete(userIdStr);

		return true;
	}

	async logout(refreshToken: string): Promise<boolean> {
		const payload = await this.tokenService.decode(refreshToken, true);
		if (!payload || !payload.id || !payload.jti) {
			throw new NotFoundException('Invalid refresh token');
		}
		// delete old refresh token id from redis
		await this.refreshTokenService.delete([payload.id, payload.jti]);

		return true;
	}

	async logoutAll(refreshToken: string): Promise<boolean> {
		const payload = await this.tokenService.decode(refreshToken, true);
		if (!payload || !payload.id || !payload.jti) {
			throw new NotFoundException('Invalid refresh token');
		}

		// 1. Delete all user session keys from Redis
		await this.refreshTokenService.deletePattern(payload.id);

		// 2. Set global logout timestamp in DB for extra security layer
		await this.UserRepo.updateOne({ _id: payload.id }, { loggedOutAllAt: new Date() });

		return true;
	}

	async changePassword({
		userId,
		currentPassword,
		newPassword,
		confirmNewPassword,
	}: I.IChangePasswordPayload): Promise<boolean> {
		if (newPassword === currentPassword) {
			throw new BadRequestException('New password cannot be the same as current password');
		}
		if (newPassword !== confirmNewPassword) {
			throw new BadRequestException('New password and confirm password do not match');
		}

		const user = await this.UserRepo.findById(userId).exec();
		if (!user) {
			throw new NotFoundException('User not found');
		}

		const isPasswordValid = await this.hashingService.verifyHash(currentPassword, user.password || '', true);
		if (!isPasswordValid) {
			throw new BadRequestException('Current password is incorrect');
		}

		user.password = newPassword; // hash password handling in schema pre save

		// add loggedOutAllAt query if it enabled in settings -> (changePassword_logoutAll = true)
		if (this.APP.auth.changePasswordLogoutAll) {
			user.loggedOutAllAt = new Date();
		}

		await user.save();

		if (this.APP.auth.changePasswordLogoutAll) {
			// logout all sessions
			await this.refreshTokenService.deletePattern(userId);
		}

		return true;
	}

	async getThisSession(userId: Id, refreshToken: string): Promise<ISessionResponse> {
		const payload = await this.tokenService.decode(refreshToken, true);
		if (!payload || !payload.id || !payload.jti || payload.id !== userId) {
			throw new NotFoundException('Invalid refresh token');
		}

		const session = await this.refreshTokenService.getSession([payload.id, payload.jti]);
		if (!session) {
			throw new NotFoundException('Session not found');
		}
		return { ...session, active: true } as ISessionResponse;
	}

	public async getMySessions(userId: Id, refreshToken: string): Promise<ISessionResponse[]> {
		const payload = await this.tokenService.decode(refreshToken, true);
		if (!payload || !payload.id || !payload.jti || payload.id !== userId) {
			throw new NotFoundException('Invalid refresh token');
		}

		// Fetch all user session entries along with their keys from Redis
		const sessionsWithKeys = await this.refreshTokenService.getByPatternWithKeys(payload.id);

		return sessionsWithKeys.map(({ key, value }) => {
			// Extract JTI from Redis key structure "users:refresh_tokens:{userId}:{jti}"
			const keyParts = key.split(':');
			const sessionJti = keyParts[keyParts.length - 1];

			return {
				...value,
				id: sessionJti,
				active: sessionJti === payload.jti,
			};
		});
	}

	async removeSession(refreshToken: string, sessionId: string): Promise<boolean> {
		const payload = await this.tokenService.decode(refreshToken, true);
		if (!payload || !payload.id || !payload.jti) {
			throw new NotFoundException('Invalid refresh token');
		}

		// Delete specified session key from Redis
		await this.refreshTokenService.delete([payload.id, sessionId]);

		return true;
	}

	// Active/Inactive Account status -------------------------------------------------
	async deactivateMyAccount(userId: Id, refreshToken: string): Promise<IUser> {
		const myUser = await this.UserRepo.findOne({ _id: userId }, { ignoreDefaultFilters: true }).lean().exec();
		if (!myUser || myUser?.deletedAt) {
			throw new NotFoundException('User not found');
		}

		if (myUser.status === UserStatusEnum.INACTIVE) {
			throw new BadRequestException('Account is already inactive');
		}

		const updated = await this.UserRepo.findByIdAndUpdate(
			userId,
			{
				status: UserStatusEnum.INACTIVE,
				statusChangedAt: new Date(),
				statusReason: StatusReasonEnum.USER_REQUEST,
			},
			{ ignoreDefaultFilters: true },
		)
			.select(selectUserInfo)
			.lean()
			.exec();
		if (!updated) {
			throw new BadRequestException('failed to deactivate account');
		}

		await this.logoutAll(refreshToken);

		return updated;
	}

	async reactivateMyAccount({ email, token, clientIp, userAgent }: I.IReactivateAccountPayload): Promise<TTokens> {
		const user = await this.UserRepo.findByEmail(email, { ignoreDefaultFilters: true }).exec();

		if (!user || user?.deletedAt) {
			throw new NotFoundException('User not found');
		}

		if (user.status === UserStatusEnum.ACTIVE) {
			throw new BadRequestException('Account is already active');
		}

		const hashedToken = await this.reactiveAccountService.get(user._id);

		if (!hashedToken || this.hashingService.hashToken(token) !== hashedToken) {
			throw new BadRequestException('Invalid or expired token');
		}

		// Update status to active
		const updated = await this.UserRepo.findByIdAndUpdate(
			user._id,
			{
				status: UserStatusEnum.ACTIVE,
				statusChangedAt: new Date(),
				$unset: { statusReason: '' }, // Completely removes the field from MongoDB document
			},
			{ ignoreDefaultFilters: true },
		)
			.select(selectUserInfo)
			.lean()
			.exec();

		if (!updated) throw new BadRequestException('failed to activate account');

		// delete reactivation token from redis
		await this.reactiveAccountService.delete(user._id);

		// Issue authentication tokens for immediate login
		const tokens = await this.tokenService.generateTokens(user);

		const sessionInfo: ISessionInfo = {
			ip: clientIp || 'Unknown',
			device: userAgent || 'Unknown Device',
			createdAt: new Date().toISOString(),
		};

		// Store refresh token with dynamic expiration calculated from rememberMe flag
		await this.refreshTokenService.setSession(
			[user._id.toString(), tokens.tokenId!],
			sessionInfo,
			tokens.refreshExpiration,
		);

		return tokens;
	}
}
