import { AUser } from '@/common/decorators';
import { AuthGuard } from '@/common/guards';
import type { Id, IUserBody } from '@/common/types';
import { Cache, InvalidateCache } from '@/providers/redis/decorators';
import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import type * as dto from './order.dto';
import * as S from './order.dto';
import { OrderService } from './order.service';

const routes = {
	base: 'orders',

	listMyOrders: '/',
	createOrder: '/checkout',

	getOrder: '/:orderId',
	cancelOrder: '/:orderId/cancel',
};

const invalidations = ['/orders', '/orders/:orderId'];

@UseGuards(AuthGuard)
@Controller(routes.base)
export class OrderController {
	constructor(private readonly service: OrderService) {}

	@Get(routes.listMyOrders)
	@Cache()
	async listMyOrders(
		@AUser() user: IUserBody,
		@Query({ schema: S.getOrderQuerySchema.query }) query: dto.GetOrderQueryDTO,
	) {
		const { data, metadata } = await this.service.listOrders({ user, ...query });
		return { data, metadata };
	}

	@Get(routes.getOrder)
	@Cache()
	async getOrder(@AUser() user: IUserBody, @Param({ schema: S.updateOrderSchema.params }) params: dto.UpdateOrderParamDTO) {
		const data = await this.service.getOrder(user, params.orderId);
		return { data };
	}

	@Post(routes.createOrder)
	@InvalidateCache(...invalidations)
	async createOrder(@AUser('_id') userId: Id, @Body({ schema: S.createOrderSchema.body }) body: dto.CreateOrderDTO) {
		const data = await this.service.createOrder({ userId, ...body });
		return { message: 'Order created successfully', data };
	}

	@Patch(routes.cancelOrder)
	@InvalidateCache(...invalidations)
	async cancelOrder(
		@AUser() user: IUserBody,
		@Param({ schema: S.updateOrderSchema.params }) params: dto.UpdateOrderParamDTO,
	) {
		const data = await this.service.cancelOrder(user, params.orderId);
		return { message: 'Order cancelled successfully', data };
	}
}
