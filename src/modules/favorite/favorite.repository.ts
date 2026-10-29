import { BaseRepository } from '@/providers/database/base.repository';
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Favorite } from './favorite.model';
import type { FavoriteModel, HFavorite } from './favorite.types';

@Injectable()
export class FavoriteRepository extends BaseRepository<HFavorite> {
	constructor(@InjectModel(Favorite.name) favoriteModel: FavoriteModel) {
		super(favoriteModel);
	}
}
