import { PaginatedResponse } from '@/common/graphql';
import { SortOrderEnum } from '@/providers/database';
import { ArgsType, Field, Int, ObjectType } from '@nestjs/graphql';
import { UserParamIdDTO, UsersQueryDTO } from '../user.dto';
import { AccountProviderEnum, GenderEnum, RoleEnum, StatusReasonEnum, UserStatusEnum } from '../user.enums';
import { User } from '../user.model';
import './user.gql.enums';

@ObjectType()
export class PaginatedUsers extends PaginatedResponse(User) {}

@ArgsType()
export class UserQueryArgs implements UsersQueryDTO {
	@Field(() => Int, { nullable: true, defaultValue: 1 })
	page?: number;

	@Field(() => Int, { nullable: true, defaultValue: 10 })
	limit?: number;

	@Field(() => String, { nullable: true, defaultValue: 'asc' })
	order?: SortOrderEnum;

	@Field(() => String, { nullable: true })
	sortBy?: string;

	@Field(() => String, { nullable: true })
	search?: string;

	@Field(() => UserStatusEnum, { nullable: true })
	status?: UserStatusEnum;

	@Field(() => StatusReasonEnum, { nullable: true })
	statusReason?: StatusReasonEnum;

	@Field(() => RoleEnum, { nullable: true })
	role: RoleEnum;

	@Field(() => GenderEnum, { nullable: true })
	gender: GenderEnum;

	@Field(() => AccountProviderEnum, { nullable: true })
	provider: AccountProviderEnum;

	@Field(() => Boolean, { nullable: true })
	isVerified?: boolean;

	@Field(() => Boolean, { nullable: true })
	isDeleted?: boolean;
}

@ArgsType()
export class UserParamsArgs implements UserParamIdDTO {
	@Field(() => String)
	userId: string;
}
