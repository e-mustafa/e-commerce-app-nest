import { AUser, AuthAdmin } from '@/common/decorators';
import type { IUserBody } from '@/common/types';
import { InvalidateCache } from '@/providers/redis/decorators';
import { Body, Controller, Delete, Get, Param, Patch, Query } from '@nestjs/common';
import type * as dto from './order.dto';
import * as S from './order.dto';
import { OrderService } from './order.service';

const routes = {
	base: '/admin/orders',

	listOrders: '/',
	getOrder: '/:orderId',
	updateOrder: '/:orderId',
	deleteOrder: '/:orderId',
	recoverOrder: '/:orderId/recover',
};

const invalidations = ['/admin/orders', '/products', '/admin/orders/:orderId'];

@AuthAdmin()
@Controller(routes.base)
export class OrderAdminController {
	constructor(private readonly service: OrderService) {}

	@Get(routes.listOrders)
	async listOrders(@AUser() user: IUserBody, @Query({ schema: S.getOrderQuerySchema.query }) query: dto.GetOrderQueryDTO) {
		const { data, metadata } = await this.service.listOrders({ user, ...query });
		return { data, metadata };
	}

	@Get(routes.getOrder)
	async getOrder(@AUser() user: IUserBody, @Param({ schema: S.updateOrderSchema.params }) params: dto.UpdateOrderParamDTO) {
		const data = await this.service.getOrder(user, params.orderId);
		return { data };
	}

	@Patch(routes.updateOrder)
	@InvalidateCache(...invalidations)
	async updateOrder(
		@AUser() user: IUserBody,
		@Body({ schema: S.updateOrderSchema.body }) body: dto.UpdateOrderDTO,
		@Param({ schema: S.updateOrderSchema.params }) params: dto.UpdateOrderParamDTO,
	) {
		const data = await this.service.updateOrderAdmin({
			user,
			orderId: params.orderId,
			...body,
		});
		return { message: 'Order updated successfully', data };
	}

	@Delete(routes.deleteOrder)
	@InvalidateCache(...invalidations)
	async deleteOrder(
		@AUser() user: IUserBody,
		@Param({ schema: S.updateOrderSchema.params }) params: dto.UpdateOrderParamDTO,
	) {
		const data = await this.service.deleteOrderAdmin(user, params.orderId);
		return { message: 'Order deleted successfully', data };
	}

	@Patch(routes.recoverOrder)
	@InvalidateCache(...invalidations)
	async recoverOrder(
		@AUser() user: IUserBody,
		@Param({ schema: S.updateOrderSchema.params }) params: dto.UpdateOrderParamDTO,
	) {
		const data = await this.service.recoverOrderAdmin(user, params.orderId);
		return { message: 'Order recovered successfully', data };
	}
}
