import { PaginatedResponse } from '@/common/graphql';
import { ObjectType } from '@nestjs/graphql';
import { Favorite } from '../favorite.model';

@ObjectType()
export class PaginatedFavorites extends PaginatedResponse(Favorite) {}

// @ArgsType()
// export class FavoriteQueryArgs implements FavoriteQueryDTO {
// 	@Field(() => Int, { nullable: true, defaultValue: 1 })
// 	page?: number;

// 	@Field(() => Int, { nullable: true, defaultValue: 10 })
// 	limit?: number;

// 	@Field(() => String, { nullable: true, defaultValue: 'asc' })
// 	order?: SortOrderEnum;

// 	@Field(() => String, { nullable: true })
// 	search?: string;
// }
