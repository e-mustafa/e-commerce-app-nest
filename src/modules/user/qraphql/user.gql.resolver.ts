import { AUser, AuthAdmin } from '@/common/decorators';
import { ValidationPipe } from '@/common/pipes';
import type { IUserBody } from '@/common/types';
import { Args, Query, Resolver } from '@nestjs/graphql';
import { type UserParamIdDTO, userParamIdSchema, usersQuerySchema } from '../user.dto';
import { User } from '../user.model';
import UserService from '../user.service';
import { PaginatedUsers, UserParamsArgs, UserQueryArgs } from './user.gql.dto';

@Resolver(() => User)
@AuthAdmin()
export class UserResolver {
	constructor(private readonly service: UserService) {}

	@Query(() => PaginatedUsers, { name: 'listUsers' })
	async listUsers(
		@AUser() user: IUserBody,
		@Args({ type: () => UserQueryArgs }, new ValidationPipe(usersQuerySchema.query)) args: UserQueryArgs,
	) {
		return this.service.listUsersAdmin({ user, ...args });
	}

	@Query(() => User, { name: 'getUser' })
	async getUser(
		@AUser() user: IUserBody,
		@Args({ type: () => UserParamsArgs }, new ValidationPipe(userParamIdSchema.params)) args: UserParamIdDTO,
	) {
		return this.service.getUser(user, args.userId);
	}

	// @Mutation(() => User, { name: 'createUser' })
	// async createUser(
	// 	@AUser('_id') userId: Id,
	// 	@Args({ type: () => User }, new ValidationPipe(createUserSchema.body)) args: CreateUserDTO,
	// ) {
	// 	return this.service.createUserAdmin({ userId, ...args });
	// }
}
