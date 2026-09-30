import { BaseRepository } from '@/providers/database/base.repository';
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Cart } from './cart.model';
import type { CartModel, HCart } from './cart.types';

@Injectable()
export class CartRepository extends BaseRepository<HCart> {
	constructor(@InjectModel(Cart.name) productModel: CartModel) {
		super(productModel);
	}
}
