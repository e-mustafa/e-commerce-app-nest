import { AUser, AuthAdmin } from '@/common/decorators';
import type { Id, IFile, IUserBody } from '@/common/types';
import { appConfig } from '@/config';
import { UseUpload } from '@/providers/upload';
import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UploadedFiles } from '@nestjs/common';
import { ICreateBrandPayload, IUpdateBrandPayload } from './brand-service.interface';
import type * as dto from './brand.dto';
import * as S from './brand.dto';
import { BrandService } from './brand.service';

const routes = {
	base: 'admin/brands',

	listBrands: '/',
	createBrand: '/',

	getBrand: '/:brandId',
	updateBrand: '/:brandId',
	deleteBrand: '/:brandId',

	togglePublished: '/:brandId/publish',
};

// UseGuards(AuthGuard, RolesGuard)
// @Roles(RoleEnum.ADMIN, RoleEnum.SUPER_ADMIN)
// or
@AuthAdmin() //[RoleEnum.ADMIN, RoleEnum.SUPER_ADMIN]
// TODO - add receptor to add domain to uploaded file url - if used local upload
@Controller(routes.base)
export class BrandAdminController {
	constructor(private readonly service: BrandService) {}

	@Get(routes.listBrands)
	async listBrands(@AUser() user: IUserBody, @Query({ schema: S.brandQuerySchema.query }) query: dto.BrandQueryDTO) {
		const { data, metadata } = await this.service.listBrands({ user, ...query });
		return { metadata, data };
	}

	@Get(routes.getBrand)
	async getBrand(@AUser() user: IUserBody, @Param({ schema: S.brandParamIdSchema.params }) params: dto.BrandParamIdDTO) {
		const data = await this.service.getBrand(user, params.brandId);
		return { data };
	}

	@Post(routes.createBrand)
	@UseUpload({
		fields: [
			{ name: 'icon', maxCount: 1 },
			{ name: 'cover', maxCount: 1 },
		],
		maxSize: appConfig().brand.attachments.maxSize,
		// dir: (req) => `brands/${req.body?.slug || 'general'}`, -> temp folder
		// fileType: fileTypes.images,
	})
	async createBrand(
		@AUser('_id') userId: Id,
		@Body({ schema: S.createBrandSchema.body }) body: dto.CreateBrandDTO,
		@UploadedFiles() files: { icon?: IFile[]; cover?: IFile[] },
	) {
		const data = await this.service.createBrandAdmin({
			...body,
			userId,
			icon: files?.icon?.[0] || undefined,
			cover: files?.cover?.[0] || undefined,
		} as ICreateBrandPayload);
		return { message: 'Brand created successfully', data };
	}

	@Patch(routes.updateBrand)
	@UseUpload({
		fields: [
			{ name: 'icon', maxCount: 1 },
			{ name: 'cover', maxCount: 1 },
		],
		maxSize: appConfig().brand.attachments.maxSize,
		// dir: (req) => `brands/${req.body?.slug || 'general'}`,
		// fileType: fileTypes.images,
	})
	@Patch(routes.updateBrand)
	async updateBrand(
		@AUser('_id') userId: Id,
		@Param('brandId') brandId: Id,
		@Body({ schema: S.updateBrandSchema.body }) body: dto.UpdateBrandDTO,
		@UploadedFiles() files: { icon?: IFile[]; cover?: IFile[] },
	) {
		const data = await this.service.updateBrandAdmin({
			...body,
			brandId,
			userId,
			files: {
				icon: files?.icon?.[0] || undefined,
				cover: files?.cover?.[0] || undefined,
			},
		} as IUpdateBrandPayload);
		return { message: 'Brand Updated successfully', data };
	}

	@Delete(routes.deleteBrand)
	async deleteBrand(@Param('brandId') brandId: Id) {
		const data = await this.service.deleteBrandAdmin(brandId);
		return { message: 'Brand deleted successfully', data };
	}

	@Patch(routes.togglePublished)
	async togglePublished(@Param('brandId') brandId: Id) {
		const data = await this.service.togglePublishedAdmin(brandId);
		return { message: `Brand ${data?.publishedAt ? 'published' : 'unpublished'} successfully`, data };
	}
}
