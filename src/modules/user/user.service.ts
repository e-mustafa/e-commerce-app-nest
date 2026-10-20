import { BadRequestException, NotFoundException, UnauthorizedException } from '@/common/exceptions';
import type { Id, IFile, IPaginatedResult, IUploadService, IUserBody, QueryFilter } from '@/common/types';
import { objectIdRegex } from '@/common/validation';
import { SortOrderEnum } from '@/providers/database';
import { searchRegex } from '@/providers/database/query-builder';
import { UPLOAD_SERVICE, UploadPathBuilder } from '@/providers/upload';
import { Inject, Injectable } from '@nestjs/common';
import { IListUsersPayload, IUpdateUserStatusPayload } from './user-service.interface';
import { selectUserInfo } from './user.constants';
import { UpdateProfileDTO } from './user.dto';
import { AdminRoleEnum, AdminRoles, RoleEnum, UserStatusEnum } from './user.enums';
import { UserRepository } from './user.repository';
import { HUser, IUser, IUserGeneral } from './user.types';

@Injectable()
export default class UserService {
	constructor(
		@Inject(UPLOAD_SERVICE) private readonly uploadService: IUploadService,
		private readonly UserRepo: UserRepository,
	) {}

	async getProfile(userId: Id): Promise<IUserBody> {
		const user = await this.UserRepo.findById(userId).lean().select(selectUserInfo).exec();
		if (!user) throw new UnauthorizedException('Unauthenticated, please login.');

		return user;
	}

	async updateProfile(userId: Id, user: UpdateProfileDTO): Promise<IUser> {
		const { firstName, lastName, username, gender, bio, birthdate, phone } = user || {};
		// let phoneNum = phone;
		// if (phone && !phone.startsWith('enc:')) {
		// 	phoneNum = encrypt(phone);
		// }

		const updatedUser = await this.UserRepo.findByIdAndUpdate(userId, {
			firstName,
			lastName,
			username,
			gender,
			bio,
			birthdate,
			...(phone && { phone }),
		})
			.lean()
			.select(selectUserInfo)
			.exec();

		if (!updatedUser) throw new NotFoundException('User not found');

		// if (updatedUser?.phone?.startsWith('enc:')) updatedUser.phone = decrypt(updatedUser.phone);
		return updatedUser;
	}

	async uploadUserPic(userId: Id, file: IFile): Promise<IUser> {
		const fieldname = file?.fieldname as 'avatar' | 'cover';

		const location = UploadPathBuilder.getUserPicLocation(userId.toString(), fieldname);

		const { id, url } = await this.uploadService.uploadFile({
			file,
			folder: location.folder,
			filename: location.filename!,
		});
		// const { id, url } = await uploadUserProfileMedia(file, userId, fieldname);

		const updatedUser = await this.UserRepo.findByIdAndUpdate(userId, { [fieldname]: { id, url } })
			.lean()
			.select(fieldname)
			.exec();

		if (!updatedUser) {
			throw new BadRequestException('Failed to upload image');
		}

		return updatedUser;
	}

	async deleteUserPic(user: IUserBody | HUser, fieldname: 'avatar' | 'cover'): Promise<IUser> {
		if (!user?.[fieldname]?.id) {
			throw new NotFoundException('You do/not have a ' + fieldname, 'Delete-user-img');
		}

		await this.uploadService.deleteFile(
			user?.[fieldname]?.id || UploadPathBuilder.getUserPicLocation(user._id.toString(), fieldname).filename!,
			'image',
		);

		// await cloudinary.uploader
		// 	.destroy(user?.[fieldname]?.id || `${fieldname}_${user._id}`, {
		// 		resource_type: 'image',
		// 		invalidate: true,
		// 	})
		// 	.catch((error) => {
		// 		console.error('Error deleting image from Cloudinary:', error);
		// 	});

		const updatedUser = await this.UserRepo.findByIdAndUpdate(user._id, { $set: { [fieldname]: null } })
			.select(fieldname)
			.exec();

		if (!updatedUser) {
			throw new NotFoundException('User not found');
		}

		return updatedUser;
	}

	async getUserStatus(userId: Id, targetUserId: string): Promise<{ lastSeenAt: Date | null }> {
		const targetUser = await this.UserRepo.findOne({ _id: targetUserId }).lean().select('_id lastSeenAt').exec();
		if (!targetUser) throw new NotFoundException('User not found');

		// const isOnline = await chatSocketService.isUserOnline(targetUser._id);

		// return { isOnline, lastSeenAt: targetUser.lastSeenAt ?? null };
		return { lastSeenAt: targetUser.lastSeenAt ?? null };
	}

	// Admin ------------------------------------------------
	async getUser(user: IUserBody, targetUserId: string): Promise<IUser> {
		const isAdmin = AdminRoles.includes((user?.role as AdminRoleEnum) || 0);

		const isId = objectIdRegex.test(targetUserId);
		const filter = isId ? { _id: targetUserId } : { username: targetUserId };

		const targetUser = await this.UserRepo.findOne(filter, { ignoreDefaultFilters: isAdmin })
			.lean()
			.select(isAdmin ? '-password' : selectUserInfo)
			.exec();
		if (!targetUser) throw new NotFoundException('User not found');

		return targetUser;
	}

	async listUsersAdmin({
		user,
		page = 1,
		limit = 10,
		sortBy = 'createdAt',
		order = SortOrderEnum.DESC,
		search,
		...query
	}: IListUsersPayload): Promise<IPaginatedResult<IUserGeneral>> {
		const isAdmin = AdminRoles.includes((user?.role as AdminRoleEnum) || 0);
		const filter: QueryFilter<IUser> = { _id: { $ne: user?._id } };
		filter.role = { $lt: user.role }; // only show users with a role lower than the user's own role

		if (query.status) filter.status = query.status;
		if (query.role) filter.role = query.role;
		if (query.provider) filter.provider = query.provider;
		if (query.gender) filter.gender = query.gender;
		if (query.statusReason) filter.statusReason = query.statusReason;

		if (query?.isVerified !== undefined)
			filter.verifiedAt = query.isVerified ? ({ $type: 'date' } as unknown as Date) : null;

		if (query?.isVerified !== undefined) {
			if (query.isVerified) {
				filter.verifiedAt = { $type: 'date' };
			} else {
				filter.$or = [{ verifiedAt: { $exists: false } }, { verifiedAt: null }];
			}
		}

		if (query?.isDeleted !== undefined) {
			if (query.isDeleted) {
				filter.deletedAt = { $type: 'date' };
			} else {
				filter.$or = [{ deletedAt: { $exists: false } }, { deletedAt: null }];
			}
		}

		// 3. Apply search
		if (search && search.trim()) {
			// Escape special regex characters to prevent regex injection (ReDoS)
			const text = searchRegex(search);
			filter.$or = [{ username: text }, { firstName: text }, { lastName: text }, { email: text }];
		}

		// 4. Execute query through user repository with pagination
		const users = await this.UserRepo.find(filter, { ignoreDefaultFilters: isAdmin })
			.lean()
			.sort({ [sortBy]: order === SortOrderEnum.ASC ? 1 : -1 })
			.select(selectUserInfo)
			.paginate(page, limit)
			.exec();

		return users;
	}

	async updateUserRoleAdmin(user: IUserBody, targetUserId: string, role: RoleEnum) {
		const isSuperAdmin = user.role === AdminRoleEnum.SUPER_ADMIN;
		if (!isSuperAdmin) throw new UnauthorizedException('Only super admin can change user role');

		const targetUser = await this.UserRepo.findOne({ _id: targetUserId }, { ignoreDefaultFilters: true }).lean().exec();
		if (!targetUser) throw new NotFoundException('User not found');

		if (targetUser.deletedAt) throw new BadRequestException('User is deleted');
		if (targetUser.status !== UserStatusEnum.ACTIVE) {
			throw new BadRequestException(`User is not active, current status: ${targetUser.status.toLowerCase()}`);
		}
		if (targetUser.role === AdminRoleEnum.SUPER_ADMIN) throw new BadRequestException('Super admin cannot be changed');

		const updatedUser = await this.UserRepo.findByIdAndUpdate(user._id, { $set: { role } }).select('-password').exec();
		if (!updatedUser) {
			throw new NotFoundException('User not found');
		}
		return updatedUser;
	}

	// async banUserAdmin(user: IUserBody, targetUserId: string, statusReason: StatusReasonEnum) {
	// 	const isAdmin = user.role === AdminRoleEnum.ADMIN;
	// 	if (!isAdmin) throw new UnauthorizedException('Only admins can ban users');

	// 	const targetUser = await this.UserRepo.findOne({ _id: targetUserId }, { ignoreDefaultFilters: true }).lean().exec();
	// 	if (!targetUser) throw new NotFoundException('User not found');

	// 	if (user.role === AdminRoleEnum.ADMIN && Object.values(AdminRoleEnum).find((role) => role === targetUser.role)) {
	// 		throw new BadRequestException('Admins cannot be banned by admins, only super admin can ban admins');
	// 	}

	// 	if (targetUser.deletedAt) throw new BadRequestException('User is deleted');
	// 	if (targetUser.status === UserStatusEnum.BANNED) {
	// 		throw new BadRequestException(`User is already banned`);
	// 	}

	// 	if (targetUser.role === AdminRoleEnum.SUPER_ADMIN) throw new BadRequestException('Super admin cannot be banned');

	// 	const updatedUser = await this.UserRepo.findByIdAndUpdate(user._id, {
	// 		$set: { status: UserStatusEnum.BANNED, statusReason, statusChangedAt: new Date() },
	// 	})
	// 		.select('-password')
	// 		.exec();
	// 	if (!updatedUser) {
	// 		throw new NotFoundException('User not found');
	// 	}
	// 	return updatedUser;
	// }

	async updateUserStatusAdmin({ user, userId: targetUserId, status, statusReason }: IUpdateUserStatusPayload) {
		const isAdmin = Object.values(AdminRoleEnum).find((role) => role === user.role);
		if (!isAdmin) throw new UnauthorizedException('Only admins can change user status');

		const targetUser = await this.UserRepo.findOne({ _id: targetUserId }, { ignoreDefaultFilters: true }).lean().exec();
		if (!targetUser) throw new NotFoundException('User not found');

		if (user.role === AdminRoleEnum.ADMIN && Object.values(AdminRoleEnum).find((role) => role === targetUser.role)) {
			throw new BadRequestException(
				'Admin status cannot be changed by admins, only super admin can update status of admins',
			);
		}

		const updatedUser = await this.UserRepo.findByIdAndUpdate(user._id, {
			$set: { status, statusChangedAt: new Date(), ...(statusReason && { statusReason }) },
		})
			.select('-password')
			.exec();
		if (!updatedUser) {
			throw new NotFoundException('User not found');
		}
		return updatedUser;
	}

	async deleteUserAdmin(user: IUserBody, targetUserId: string) {
		const isAdmin = user.role === AdminRoleEnum.ADMIN;
		if (!isAdmin) throw new UnauthorizedException('Only admins can delete user');

		const targetUser = await this.UserRepo.findOne({ _id: targetUserId }, { ignoreDefaultFilters: true }).lean().exec();
		if (!targetUser) throw new NotFoundException('User not found');

		if (user.role === AdminRoleEnum.ADMIN && Object.values(AdminRoleEnum).find((role) => role === targetUser.role)) {
			throw new BadRequestException(
				'Admin status cannot be changed by admins, only super admin can update status of admins',
			);
		}

		if (targetUser.deletedAt) throw new BadRequestException('User is already deleted');

		const updatedUser = await this.UserRepo.findByIdAndUpdate(user._id, { $set: { deletedAt: new Date() } })
			.select('-password')
			.exec();
		if (!updatedUser) {
			throw new NotFoundException('User not found');
		}
		return updatedUser;
	}

	async recoverUserAdmin(user: IUserBody, targetUserId: string) {
		const isAdmin = user.role === AdminRoleEnum.ADMIN;
		if (!isAdmin) throw new UnauthorizedException('Only admins can recover user');

		const targetUser = await this.UserRepo.findOne({ _id: targetUserId }, { ignoreDefaultFilters: true }).lean().exec();
		if (!targetUser) throw new NotFoundException('User not found');

		if (user.role === AdminRoleEnum.ADMIN && Object.values(AdminRoleEnum).find((role) => role === targetUser.role)) {
			throw new BadRequestException(
				'Admin status cannot be changed by admins, only super admin can update status of admins',
			);
		}

		if (!targetUser?.deletedAt) throw new BadRequestException('User is already not deleted');

		const updatedUser = await this.UserRepo.findByIdAndUpdate(user._id, { $set: { deletedAt: null } })
			.select('-password')
			.exec();
		if (!updatedUser) {
			throw new NotFoundException('User not found');
		}
		return updatedUser;
	}
}
