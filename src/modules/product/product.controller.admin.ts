import { AUser, AuthAdmin } from '@/common/decorators';
import type { Id, IFile, IUserBody } from '@/common/types';
import { appConfig } from '@/config';
import { InvalidateCache } from '@/providers/redis/decorators';
import { UseUpload } from '@/providers/upload';
import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UploadedFiles } from '@nestjs/common';
import type * as dto from './product.dto';
import * as S from './product.dto';
import { ProductService } from './product.service';

const routes = {
	base: 'admin/products',

	listProducts: '/',
	createProduct: '/',

	getProduct: '/:identifier',
	updateProduct: '/:productId',
	deleteProduct: '/:productId',

	togglePublished: '/:productId/publish',
};

// UseGuards(AuthGuard, RolesGuard)
// @Roles(RoleEnum.ADMIN, RoleEnum.SUPER_ADMIN)
// or
@AuthAdmin() //[RoleEnum.ADMIN, RoleEnum.SUPER_ADMIN]
@Controller(routes.base)
export class ProductAdminController {
	constructor(private readonly service: ProductService) {}

	@Get(routes.listProducts)
	async listProducts(@AUser() user: IUserBody, @Query({ schema: S.productQuerySchema.query }) query: dto.ProductQueryDTO) {
		const { data, metadata } = await this.service.listProducts({ user, ...query });
		return { metadata, data };
	}

	@Get(routes.getProduct)
	async getProduct(
		@AUser() user: IUserBody,
		@Param({ schema: S.productParamIdentifierSchema.params }) params: dto.ProductParamIdentifierDTO,
	) {
		const data = await this.service.getProduct(user, params.identifier);
		return { data };
	}

	@Post(routes.createProduct)
	@InvalidateCache('/products')
	@UseUpload({
		fieldName: 'images',
		maxCount: appConfig().product.attachments.maxCount || 10,
		maxSize: appConfig().product.attachments.maxSize || 10 * 1024 * 1024,
		// dir: (req) => `products/${req.body?.slug || 'general'}`,
		// fileType: fileTypes.images,
	})
	async createProduct(
		@AUser('_id') userId: Id,
		@Body({ schema: S.createProductSchema.body }) body: dto.CreateProductDTO,
		@UploadedFiles() files: IFile[],
	) {
		const data = await this.service.createProductAdmin({ ...body, userId, files });
		return { message: 'Product created successfully', data };
	}

	@Patch(routes.updateProduct)
	@InvalidateCache()
	@UseUpload({
		fieldName: 'images',
		maxCount: appConfig().product.attachments.maxCount || 10,
		maxSize: appConfig().product.attachments.maxSize || 10 * 1024 * 1024,
		// dir: (req) => `products/${req.body?.slug || 'general'}`,
		// fileType: fileTypes.images,
	})
	async updateProduct(
		@AUser('_id') userId: Id,
		@Param('productId') productId: string,
		@Body({ schema: S.updateProductSchema.body }) body: dto.UpdateProductDTO,
		@UploadedFiles() files: IFile[],
	) {
		const data = await this.service.updateProductAdmin({ ...body, productId, userId, files });
		return { message: 'Product Updated successfully', data };
	}

	@Delete(routes.deleteProduct)
	@InvalidateCache()
	async deleteProduct(@Param('productId') productId: Id) {
		const data = await this.service.deleteProductAdmin(productId);
		return { message: 'Product deleted successfully', data };
	}
	//TODO - set as toggle delete/restore

	@Patch(routes.togglePublished)
	@InvalidateCache()
	async togglePublished(@Param('productId') productId: Id) {
		const data = await this.service.togglePublishedAdmin(productId);
		return { message: `Product ${data?.publishedAt ? 'published' : 'unpublished'} successfully`, data };
	}
}
