import { Id } from '@/common/types';
import type * as dto from './favorite.dto';

export interface IAddToFavoritePayload extends dto.AddToFavoriteDTO {
	userId: Id;
}

export interface IGetFavoritePayload extends dto.GetFavoriteQueryDTO {
	userId: Id;
}

export interface ISyncFavoritePayload extends dto.SyncFavoriteDTO {
	userId: Id;
}
