import { PaginatedResponse } from '@/common/graphql';
import { SortOrderEnum } from '@/providers/database';
import { ArgsType, Field, Int, ObjectType } from '@nestjs/graphql';
import { BrandParamIdDTO, BrandQueryDTO } from '../brand.dto';
import { Brand } from '../brand.model';

@ObjectType()
export class PaginatedBrands extends PaginatedResponse(Brand) {}

@ArgsType()
export class BrandQueryArgs implements BrandQueryDTO {
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

	@Field(() => String, { nullable: true })
	createdBy?: string;
}

@ArgsType()
export class BrandParamsArgs implements BrandParamIdDTO {
	@Field(() => String)
	brandId: string;
}
