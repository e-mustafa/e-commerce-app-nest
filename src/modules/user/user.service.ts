import { BadRequestException, NotFoundException, UnauthorizedException } from '@/common/exceptions';
import { type Id, type IFile, type IPaginatedResult, type IUploadService, type IUserBody } from '@/common/types';
import { objectIdRegex } from '@/common/validation';
import { UPLOAD_SERVICE, UploadPathBuilder } from '@/providers/upload';
import { Inject, Injectable } from '@nestjs/common';
import { QueryFilter } from 'mongoose';
import { selectUserInfo } from './user.constants';
import { GetUsersQueryDTO, UpdateProfileDTO } from './user.dto';
import { UserRepository } from './user.repository';
import { HUser, IGeneralUser, IUser } from './user.types';

@Injectable()
export default class UserService {
	constructor(
		@Inject(UPLOAD_SERVICE) private readonly uploadService: IUploadService,
		private readonly UserRepo: UserRepository,
	) {}

	async getProfile(userId: Id): Promise<IUserBody> {
		const user = await this.UserRepo.findById(userId).lean().select(selectUserInfo).exec();
		// if (!user) throw new NotFoundException('User not found');
		console.log('user', user);
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
		// console.log('uploadUserPic file', file);
		console.log('userId', userId);
		console.log('userId', typeof userId);
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
			throw new NotFoundException('User not found', 'Delete-user-img');
		}

		return updatedUser;
	}

	// Get User/s - visit user ------------------------------------------------
	async getUser(userId: Id, targetUserId: string): Promise<IUser> {
		const isId = objectIdRegex.test(targetUserId);

		const filter = isId ? { _id: targetUserId } : { username: targetUserId };

		const targetUser = await this.UserRepo.findOne(filter).lean().select(selectUserInfo).exec();
		if (!targetUser) throw new NotFoundException('User not found', 'Get-user');

		return targetUser;
	}

	async getUsers(userId: Id, { page = 1, limit = 10, search }: GetUsersQueryDTO): Promise<IPaginatedResult<IGeneralUser>> {
		// 1. Query block records to find all bidirectional block relationships

		// 3. Build query filter utilizing $nin operator
		const filter: QueryFilter<IUser> = {};

		if (search && search.trim()) {
			const searchRegex = { $regex: search.trim(), $options: 'i' };
			filter.$or = [{ username: searchRegex }, { firstName: searchRegex }, { lastName: searchRegex }];
		}

		// 4. Execute query through user repository with pagination
		const users = await this.UserRepo.find(filter).lean().select(selectUserInfo).paginate(page, limit).exec();

		return users;
	}

	async getUserStatus(userId: Id, targetUserId: string): Promise<{ lastSeenAt: Date | null }> {
		const targetUser = await this.UserRepo.findOne({ _id: targetUserId }).lean().select('_id lastSeenAt').exec();
		if (!targetUser) throw new NotFoundException('User not found', 'Get-user-status');

		// const isOnline = await chatSocketService.isUserOnline(targetUser._id);

		// return { isOnline, lastSeenAt: targetUser.lastSeenAt ?? null };
		return { lastSeenAt: targetUser.lastSeenAt ?? null };
	}
}


// TODO - add service to change user role