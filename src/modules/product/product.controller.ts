import { AUser } from '@/common/decorators';
import type { IUserBody } from '@/common/types';
import { appConfig } from '@/config';
import { Cache } from '@/providers/redis/decorators';
import { Controller, Get, Param, Query } from '@nestjs/common';
import type * as dto from './product.dto';
import * as S from './product.dto';
import { ProductService } from './product.service';

const routes = {
	base: '/products',

	listProducts: '/',
	getProduct: '/:identifier',
};

@Controller(routes.base)
@Cache(appConfig().product.cacheTTL)
export class ProductController {
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
}
