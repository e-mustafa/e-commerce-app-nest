import { AUser, AuthAdmin } from '@/common/decorators';
import { ValidationPipe } from '@/common/pipes';
import type { IUserBody } from '@/common/types';
import { Args, Query, Resolver } from '@nestjs/graphql';
import { type CategoryParamIdDTO, categoryParamIdSchema, categoryQuerySchema } from '../category.dto';
import { Category } from '../category.model';
import { CategoryService } from '../category.service';
import { CategoryParamsArgs, CategoryQueryArgs, PaginatedCategories } from './category.gql.dto';

@Resolver(() => Category)
@AuthAdmin()
export class CategoryResolver {
	constructor(private readonly service: CategoryService) {}

	@Query(() => PaginatedCategories, { name: 'listCategories' })
	async listCategories(
		@AUser() user: IUserBody,
		@Args({ type: () => CategoryQueryArgs }, new ValidationPipe(categoryQuerySchema.query)) args: CategoryQueryArgs,
	) {
		return this.service.listCategories({ user, ...args });
	}

	@Query(() => Category, { name: 'getCategory' })
	async getCategory(
		@AUser() user: IUserBody,
		@Args({ type: () => CategoryParamsArgs }, new ValidationPipe(categoryParamIdSchema.params)) args: CategoryParamIdDTO,
	) {
		return this.service.getCategory(user, args.categoryId);
	}

	// @Mutation(() => Category, { name: 'createCategory' })
	// async createCategory(
	// 	@AUser('_id') userId: Id,
	// 	@Args({ type: () => Category }, new ValidationPipe(createCategorySchema.body)) args: CreateCategoryDTO,
	// ) {
	// 	return this.service.createCategoryAdmin({ userId, ...args });
	// }
}
