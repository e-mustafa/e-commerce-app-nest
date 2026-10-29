import { AUser } from '@/common/decorators';
import { AuthGuard } from '@/common/guards';
import type { Id } from '@/common/types';
import { Body, Controller, Delete, Get, Param, Post, UseGuards } from '@nestjs/common';
import { type AddToFavoriteDTO, addToFavoriteSchema, type SyncFavoriteDTO, syncFavoriteSchema } from './favorite.dto';
import { FavoriteService } from './favorite.service';

const routes = {
	base: 'favorite',

	getFavorite: '/',
	addToFavorite: '/',
	clearFavorite: '/',
	syncFavorite: '/sync',
	removeProduct: '/:productId',
};

@UseGuards(AuthGuard)
@Controller(routes.base)
export class FavoriteController {
	constructor(private readonly service: FavoriteService) {}

	@Get(routes.getFavorite)
	async getFavorite(@AUser('_id') userId: Id) {
		const data = await this.service.getFavorite(userId);
		return { data };
	}

	@Post(routes.addToFavorite)
	async addToFavorite(@AUser('_id') userId: Id, @Body({ schema: addToFavoriteSchema.body }) body: AddToFavoriteDTO) {
		const data = await this.service.addToFavorite({ userId, ...body });
		return { message: 'Product added to favorite successfully', data };
	}

	@Post(routes.syncFavorite) // add array of items
	async syncFavorite(@AUser('_id') userId: Id, @Body({ schema: syncFavoriteSchema.body }) body: SyncFavoriteDTO) {
		const data = await this.service.syncFavorite({ userId, ...body });
		return { message: 'Favorite synced successfully', data };
	}

	@Delete(routes.removeProduct)
	async removeProduct(@AUser('_id') userId: Id, @Param('productId') productId: Id) {
		const data = await this.service.removeProduct(userId, productId);
		return { message: 'Product removed successfully', data };
	}

	@Delete(routes.clearFavorite)
	async clearFavorite(@AUser('_id') userId: Id) {
		const data = await this.service.clearFavorite(userId);
		return { message: 'Favorite cleared successfully', data };
	}
}
