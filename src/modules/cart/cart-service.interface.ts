import { Id } from '@/common/types';
import type * as dto from './cart.dto';

export interface IAddToCartPayload extends dto.AddToCartDTO {
	userId: Id;
}

export interface IGetCartPayload extends dto.GetCartQueryDTO {
	userId: Id;
}

export interface ISyncCartPayload extends dto.SyncCartDTO {
	userId: Id;
}
