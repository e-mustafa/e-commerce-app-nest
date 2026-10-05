import { AUser } from '@/common/decorators';
import type { IUserBody } from '@/common/types';
import { Cache } from '@/providers/redis/decorators';
import { Controller, Get, Param, Query } from '@nestjs/common';
import type * as dto from './category.dto';
import * as S from './category.dto';
import { CategoryService } from './category.service';

const routes = {
	base: 'categories',

	listCategories: '/',
	getCategory: '/:categoryId',
};

@Controller(routes.base)
export class CategoryController {
	constructor(private readonly service: CategoryService) {}

	@Get(routes.listCategories)
	@Cache()
	async listCategories(
		@AUser() user: IUserBody,
		@Query({ schema: S.categoryQuerySchema.query }) query: dto.CategoryQueryDTO,
	) {
		const { data, metadata } = await this.service.listCategories({ user, ...query });
		return { metadata, data };
	}

	@Get(routes.getCategory)
	@Cache()
	async getCategory(
		@AUser() user: IUserBody,
		@Param({ schema: S.categoryParamIdSchema.params }) params: dto.CategoryParamIdDTO,
	) {
		const data = await this.service.getCategory(user, params.categoryId);
		return { data };
	}
}
