import { PaginatedResponse } from '@/common/graphql';
import { SortOrderEnum } from '@/providers/database';
import { ArgsType, Field, Int, ObjectType } from '@nestjs/graphql';
import { CartQueryDTO } from '../cart.dto';
import { Cart } from '../cart.model';

@ObjectType()
export class PaginatedCarts extends PaginatedResponse(Cart) {}

@ArgsType()
export class CartQueryArgs implements CartQueryDTO {
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
