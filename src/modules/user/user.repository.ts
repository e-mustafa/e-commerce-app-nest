import { BaseRepository } from '@/providers/database/base.repository';
import { IQueryOptions } from '@/providers/database/query-builder';
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { QueryFilter } from 'mongoose';
import { UserStatusEnum } from './user.enums';
import { User } from './user.model';
import type { HUser, IUser, UserModel } from './user.types';

@Injectable()
export class UserRepository extends BaseRepository<HUser> {
	protected activeFilter: QueryFilter<HUser> = {
		status: UserStatusEnum.ACTIVE,
		$or: [{ deletedAt: { $exists: false } }, { deletedAt: null }],
	};

	constructor(@InjectModel(User.name) userModel: UserModel) {
		super(userModel);
	}

	protected override getDefaultFilter(): QueryFilter<HUser> {
		return this.activeFilter;
	}

	findByEmail(email: string, options?: IQueryOptions): QueryFilter<IUser> {
		return this.findOne({ email }, options);
	}
}
