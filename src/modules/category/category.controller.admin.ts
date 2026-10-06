import { AUser, AuthAdmin } from '@/common/decorators';
import type { Id, IFile, IUserBody } from '@/common/types';
import { appConfig } from '@/config';
import { InvalidateCache } from '@/providers/redis/decorators';
import { UseUpload } from '@/providers/upload';
import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UploadedFiles } from '@nestjs/common';
import { ICreateCategoryPayload, IUpdateCategoryPayload } from './category-service.interface';
import type * as dto from './category.dto';
import * as S from './category.dto';
import { CategoryService } from './category.service';

const routes = {
	base: 'admin/categories',

	listCategories: '/',
	createCategory: '/',

	getCategory: '/:categoryId',
	updateCategory: '/:categoryId',
	deleteCategory: '/:categoryId',

	togglePublished: '/:categoryId/publish',
};

const invalidations = ['/categories', '/categories/:categoryId'];

// UseGuards(AuthGuard, RolesGuard)
// @Roles(RoleEnum.ADMIN, RoleEnum.SUPER_ADMIN)
// or
@AuthAdmin() //[RoleEnum.ADMIN, RoleEnum.SUPER_ADMIN]
@Controller(routes.base)
export class CategoryAdminController {
	constructor(private readonly service: CategoryService) {}

	@Get(routes.listCategories)
	async listCategories(
		@AUser() user: IUserBody,
		@Query({ schema: S.categoryQuerySchema.query }) query: dto.CategoryQueryDTO,
	) {
		const { data, metadata } = await this.service.listCategories({ user, ...query });
		return { metadata, data };
	}

	@Get(routes.getCategory)
	async getCategory(
		@AUser() user: IUserBody,
		@Param({ schema: S.categoryParamIdSchema.params }) params: dto.CategoryParamIdDTO,
	) {
		const data = await this.service.getCategory(user, params.categoryId);
		return { data };
	}

	@Post(routes.createCategory)
	@InvalidateCache(invalidations[0])
	@UseUpload({
		fields: [
			{ name: 'icon', maxCount: 1 },
			{ name: 'cover', maxCount: 1 },
		],
		maxSize: appConfig().category.attachments.maxSize,
		// dir: (req) => `categories/${req.body?.slug || 'general'}`,
		// fileType: fileTypes.images,
	})
	async createCategory(
		@AUser('_id') userId: Id,
		@Body({ schema: S.createCategorySchema.body }) body: dto.CreateCategoryDTO,
		@UploadedFiles() files: { icon?: IFile[]; cover?: IFile[] },
	) {
		const data = await this.service.createCategoryAdmin({
			...body,
			userId,
			icon: files?.icon?.[0] || undefined,
			cover: files?.cover?.[0] || undefined,
		} as ICreateCategoryPayload);
		return { message: 'Category created successfully', data };
	}

	@Patch(routes.updateCategory)
	@InvalidateCache(...invalidations)
	@UseUpload({
		fields: [
			{ name: 'icon', maxCount: 1 },
			{ name: 'cover', maxCount: 1 },
		],
		maxSize: appConfig().category.attachments.maxSize,
		// dir: (req) => `categories/${req.body?.slug || 'general'}`,
		// fileType: fileTypes.images,
	})
	@Patch(routes.updateCategory)
	async updateCategory(
		@AUser('_id') userId: Id,
		@Param('categoryId') categoryId: Id,
		@Body({ schema: S.updateCategorySchema.body }) body: dto.UpdateCategoryDTO,
		@UploadedFiles() files: { icon?: IFile[]; cover?: IFile[] },
	) {
		const data = await this.service.updateCategoryAdmin({
			...body,
			categoryId,
			userId,
			files: {
				icon: files?.icon?.[0] || undefined,
				cover: files?.cover?.[0] || undefined,
			},
		} as IUpdateCategoryPayload);
		return { message: 'Category Updated successfully', data };
	}

	@Delete(routes.deleteCategory)
	@InvalidateCache(...invalidations)
	async deleteCategory(@Param('categoryId') categoryId: Id) {
		const data = await this.service.deleteCategoryAdmin(categoryId);
		return { message: 'Category deleted successfully', data };
	}

	@Patch(routes.togglePublished)
	@InvalidateCache(...invalidations)
	async togglePublished(@Param('categoryId') categoryId: Id) {
		const data = await this.service.togglePublishedAdmin(categoryId);
		return { message: `Category ${data?.publishedAt ? 'published' : 'unpublished'} successfully`, data };
	}
}
