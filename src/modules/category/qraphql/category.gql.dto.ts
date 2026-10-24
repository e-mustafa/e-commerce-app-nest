import { PaginatedResponse } from '@/common/graphql';
import { SortOrderEnum } from '@/providers/database';
import { ArgsType, Field, Int, ObjectType } from '@nestjs/graphql';
import { CategoryParamIdDTO, CategoryQueryDTO } from '../category.dto';
import { Category } from '../category.model';

@ObjectType()
export class PaginatedCategories extends PaginatedResponse(Category) {}

@ArgsType()
export class CategoryQueryArgs implements CategoryQueryDTO {
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
export class CategoryParamsArgs implements CategoryParamIdDTO {
	@Field(() => String)
	categoryId: string;
}
