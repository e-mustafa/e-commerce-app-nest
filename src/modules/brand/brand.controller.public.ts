import { AUser } from '@/common/decorators';
import type { IUserBody } from '@/common/types';
import { Controller, Get, Param, Query } from '@nestjs/common';
import type * as dto from './brand.dto';
import * as S from './brand.dto';
import { BrandService } from './brand.service';

const routes = {
	base: 'brands',

	listBrands: '/',
	getBrand: '/:brandId',
};

// TODO - add receptor to add domain to uploaded file url - if used local upload
@Controller(routes.base)
export class BrandController {
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
}
