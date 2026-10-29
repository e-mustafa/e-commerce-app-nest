import { AUser, AuthAdmin } from '@/common/decorators';
import type { Id } from '@/common/types';
import { Query, Resolver } from '@nestjs/graphql';
import { Favorite } from '../favorite.model';
import { FavoriteService } from '../favorite.service';

@Resolver(() => Favorite)
@AuthAdmin()
export class FavoriteResolver {
	constructor(private readonly service: FavoriteService) {}

	@Query(() => Favorite, { name: 'getFavorite' })
	async getFavorite(@AUser('_id') userId: Id) {
		return this.service.getFavorite(userId);
	}
}
