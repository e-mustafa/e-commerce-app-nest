import { PaginatedResponse } from '@/common/graphql';
import { SortOrderEnum } from '@/providers/database';
import { ArgsType, Field, Float, Int, ObjectType } from '@nestjs/graphql';
import { ProductParamIdDTO, ProductQueryDTO } from '../product.dto';
import { Product } from '../product.model';

@ObjectType()
export class PaginatedProducts extends PaginatedResponse(Product) {}

@ArgsType()
export class ProductQueryArgs implements ProductQueryDTO {
	@Field(() => Int, { nullable: true, defaultValue: 1 })
	page?: number;

	@Field(() => Int, { nullable: true, defaultValue: 10 })
	limit?: number;

	@Field(() => String, { nullable: true, defaultValue: 'asc' })
	order?: SortOrderEnum;

	@Field(() => String, { nullable: true })
	search?: string;

	@Field(() => Boolean, { nullable: true })
	isPublished?: boolean;

	@Field(() => Boolean, { nullable: true })
	isActive?: boolean;

	@Field(() => String, { nullable: true })
	category?: string;

	@Field(() => String, { nullable: true })
	brand?: string;

	@Field(() => [String], { nullable: true })
	tag?: string[];

	@Field(() => Float, { nullable: true })
	price?: number;

	@Field(() => Int, { nullable: true })
	stock?: number;

	@Field(() => String, { nullable: true })
	stockType?: string;

	@Field(() => String, { nullable: true })
	sortBy?: string;

	@Field(() => String, { nullable: true })
	createdBy?: string;
}

@ArgsType()
export class ProductParamsArgs implements ProductParamIdDTO {
	@Field(() => String)
	productId: string;
}
