import { AUser, AuthAdmin } from '@/common/decorators';
import { ValidationPipe } from '@/common/pipes';
import type { IUserBody } from '@/common/types';
import { Args, Query, Resolver } from '@nestjs/graphql';
import { type ProductParamIdDTO, productParamIdSchema, productQuerySchema } from '../product.dto';
import { Product } from '../product.model';
import { ProductService } from '../product.service';
import { ProductParamsArgs, ProductQueryArgs, PaginatedProducts } from './product.gql.dto';

@Resolver(() => Product)
@AuthAdmin()
export class ProductResolver {
	constructor(private readonly service: ProductService) {}

	@Query(() => PaginatedProducts, { name: 'listProducts' })
	async listProducts(
		@AUser() user: IUserBody,
		@Args({ type: () => ProductQueryArgs }, new ValidationPipe(productQuerySchema.query)) args: ProductQueryArgs,
	) {
		return this.service.listProducts({ user, ...args });
	}

	@Query(() => Product, { name: 'getProduct' })
	async getProduct(
		@AUser() user: IUserBody,
		@Args({ type: () => ProductParamsArgs }, new ValidationPipe(productParamIdSchema.params)) args: ProductParamIdDTO,
	) {
		return this.service.getProduct(user, args.productId);
	}

	// @Mutation(() => Product, { name: 'createProduct' })
	// async createProduct(
	// 	@AUser('_id') userId: Id,
	// 	@Args({ type: () => Product }, new ValidationPipe(createProductSchema.body)) args: CreateProductDTO,
	// ) {
	// 	return this.service.createProductAdmin({ userId, ...args });
	// }
}
