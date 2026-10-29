import { AUser, AuthAdmin } from '@/common/decorators';
import type { Id } from '@/common/types';
import { Query, Resolver } from '@nestjs/graphql';
import { Cart } from '../cart.model';
import { CartService } from '../cart.service';

@Resolver(() => Cart)
@AuthAdmin()
export class CartResolver {
	constructor(private readonly service: CartService) {}

	@Query(() => Cart, { name: 'getCart' })
	async getCart(@AUser('_id') userId: Id) {
		return this.service.getCartAndSyncPrices(userId);
	}
}
