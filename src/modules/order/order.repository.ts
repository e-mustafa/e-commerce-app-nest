import { BaseRepository } from '@/providers/database/base.repository';
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { QueryFilter } from 'mongoose';
import { Order } from './order.model';
import type { IOrder, OrderModel } from './order.types';

@Injectable()
export class OrderRepository extends BaseRepository<IOrder> {
	protected activeFilter: QueryFilter<IOrder> = {
		$or: [{ deletedAt: { $exists: false } }, { deletedAt: null }],
	};

	constructor(@InjectModel(Order.name) orderModel: OrderModel) {
		super(orderModel);
	}

	protected override getDefaultFilter(): QueryFilter<IOrder> {
		return this.activeFilter;
	}
}
