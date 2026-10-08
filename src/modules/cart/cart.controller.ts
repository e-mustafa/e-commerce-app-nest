import { AUser } from '@/common/decorators';
import { AuthGuard } from '@/common/guards';
import type { Id } from '@/common/types';
import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { type AddToCartDTO, addToCartSchema, type SyncCartDTO, syncCartSchema } from './cart.dto';
import { CartService } from './cart.service';

const routes = {
	base: 'cart',

	getCart: '/',
	addToCart: '/',
	syncCart: '/sync',
	clearCart: '/clear',
	removeProduct: '/:productId',
	incrementProduct: '/:productId/quantity/increment',
	decrementProduct: '/:productId/quantity/decrement',
};

@UseGuards(AuthGuard)
@Controller(routes.base)
export class CartController {
	constructor(private readonly service: CartService) {}

	@Get(routes.getCart)
	async getCart(@AUser('_id') userId: Id) {
		const data = await this.service.getCart(userId);
		return { data };
	}

	@Post(routes.addToCart)
	async addToCart(@AUser('_id') userId: Id, @Body({ schema: addToCartSchema.body }) body: AddToCartDTO) {
		const data = await this.service.addToCart({ userId, ...body });
		return { message: 'Product created successfully', data };
	}

	@Post(routes.syncCart) // add array of items
	async syncCart(@AUser('_id') userId: Id, @Body({ schema: syncCartSchema.body }) body: SyncCartDTO) {
		const data = await this.service.syncCart({ userId, ...body });
		return { message: 'Cart synced successfully', data };
	}

	@Delete(routes.removeProduct)
	async removeProduct(@AUser('_id') userId: Id, @Param('productId') productId: Id) {
		const data = await this.service.removeProduct(userId, productId);
		return { message: 'Product removed successfully', data };
	}

	@Delete(routes.clearCart)
	async clearCart(@AUser('_id') userId: Id) {
		const data = await this.service.clearCart(userId);
		return { message: 'Cart cleared successfully', data };
	}

	@Patch(routes.incrementProduct)
	async incrementProduct(@AUser('_id') userId: Id, @Param('productId') productId: Id) {
		const data = await this.service.incrementProduct(userId, productId);
		return { message: 'Product quantity incremented successfully', data };
	}

	@Patch(routes.decrementProduct)
	async decrementProduct(@AUser('_id') userId: Id, @Param('productId') productId: Id) {
		const data = await this.service.decrementProduct(userId, productId);
		return { message: 'Product quantity decremented successfully', data };
	}
}
