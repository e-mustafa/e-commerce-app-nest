import { PaginatedResponse } from '@/common/graphql';
import { SortOrderEnum } from '@/providers/database';
import { ArgsType, Field, Int, ObjectType } from '@nestjs/graphql';
import { ReviewParamIdDTO, ReviewQueryDTO } from '../review.dto';
import { Review } from '../review.model';

@ObjectType()
export class PaginatedReviews extends PaginatedResponse(Review) {}

@ArgsType()
export class ReviewQueryArgs implements ReviewQueryDTO {
	@Field(() => Int, { nullable: true, defaultValue: 1 })
	page?: number;

	@Field(() => Int, { nullable: true, defaultValue: 10 })
	limit?: number;

	@Field(() => String, { nullable: true, defaultValue: 'asc' })
	order?: SortOrderEnum;

	@Field(() => String, { nullable: true })
	search?: string;

	@Field(() => String, { nullable: true })
	author?: string;
}

@ArgsType()
export class ReviewParamsArgs implements ReviewParamIdDTO {
	@Field(() => String)
	reviewId: string;
}
