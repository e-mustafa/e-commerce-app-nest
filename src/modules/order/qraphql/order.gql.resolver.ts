import { AUser, AuthAdmin } from '@/common/decorators';
import { ValidationPipe } from '@/common/pipes';
import type { IUserBody } from '@/common/types';
import { Args, Query, Resolver } from '@nestjs/graphql';
import { type OrderParamIdDTO, orderParamIdSchema, orderQuerySchema } from '../order.dto';
import { Order } from '../order.model';
import { OrderService } from '../order.service';
import { OrderParamsArgs, OrderQueryArgs, PaginatedOrders } from './order.gql.dto';

@Resolver(() => Order)
@AuthAdmin()
export class OrderResolver {
	constructor(private readonly service: OrderService) {}

	@Query(() => PaginatedOrders, { name: 'listOrders' })
	async listOrders(
		@AUser() user: IUserBody,
		@Args({ type: () => OrderQueryArgs }, new ValidationPipe(orderQuerySchema.query)) args: OrderQueryArgs,
	) {
		return this.service.listOrders({ user, ...args });
	}

	@Query(() => Order, { name: 'getOrder' })
	async getOrder(
		@AUser() user: IUserBody,
		@Args({ type: () => OrderParamsArgs }, new ValidationPipe(orderParamIdSchema.params)) args: OrderParamIdDTO,
	) {
		return this.service.getOrder(user, args.orderId);
	}

	// @Mutation(() => Order, { name: 'createOrder' })
	// async createOrder(
	// 	@AUser('_id') userId: Id,
	// 	@Args({ type: () => Order }, new ValidationPipe(createOrderSchema.body)) args: CreateOrderDTO,
	// ) {
	// 	return this.service.createOrderAdmin({ userId, ...args });
	// }
}
