import { AUser, AuthAdmin } from '@/common/decorators';
import { ValidationPipe } from '@/common/pipes';
import type { IUserBody } from '@/common/types';
import { Args, Query, Resolver } from '@nestjs/graphql';
import { type BrandParamIdDTO, brandParamIdSchema, brandQuerySchema } from '../brand.dto';
import { Brand } from '../brand.model';
import { BrandService } from '../brand.service';
import { BrandParamsArgs, BrandQueryArgs, PaginatedBrands } from './brand.gql.dto';

@Resolver(() => Brand)
@AuthAdmin()
export class BrandResolver {
	constructor(private readonly service: BrandService) {}

	@Query(() => PaginatedBrands, { name: 'listBrands' })
	async listBrands(
		@AUser() user: IUserBody,
		@Args({ type: () => BrandQueryArgs }, new ValidationPipe(brandQuerySchema.query)) args: BrandQueryArgs,
	) {
		return this.service.listBrands({ user, ...args });
	}

	@Query(() => Brand, { name: 'getBrand' })
	async getBrand(
		@AUser() user: IUserBody,
		@Args({ type: () => BrandParamsArgs }, new ValidationPipe(brandParamIdSchema.params)) args: BrandParamIdDTO,
	) {
		return this.service.getBrand(user, args.brandId);
	}

	// @Mutation(() => Brand, { name: 'createBrand' })
	// async createBrand(
	// 	@AUser('_id') userId: Id,
	// 	@Args({ type: () => Brand }, new ValidationPipe(createBrandSchema.body)) args: CreateBrandDTO,
	// ) {
	// 	return this.service.createBrandAdmin({ userId, ...args });
	// }
}
