import { PaginatedResponse } from '@/common/graphql';
import { SortOrderEnum } from '@/providers/database';
import { ArgsType, Field, Int, ObjectType } from '@nestjs/graphql';
import { OrderParamIdDTO, OrderQueryDTO } from '../order.dto';
import { OrderStatusEnum, PaymentMethodEnum, PaymentStatusEnum } from '../order.enums';
import { Order } from '../order.model';

@ObjectType()
export class PaginatedOrders extends PaginatedResponse(Order) {}

@ArgsType()
export class OrderQueryArgs implements OrderQueryDTO {
	@Field(() => Int, { nullable: true, defaultValue: 1 })
	page?: number;

	@Field(() => Int, { nullable: true, defaultValue: 10 })
	limit?: number;

	@Field(() => String, { nullable: true, defaultValue: 'asc' })
	order?: SortOrderEnum;

	@Field(() => String, { nullable: true })
	search?: string;

	@Field(() => String, { nullable: true })
	userId?: string;

	@Field(() => String, { nullable: true })
	status?: OrderStatusEnum;

	@Field(() => String, { nullable: true })
	paymentStatus: PaymentStatusEnum;

	@Field(() => String, { nullable: true })
	paymentMethod: PaymentMethodEnum;
}

@ArgsType()
export class OrderParamsArgs implements OrderParamIdDTO {
	@Field(() => String)
	orderId: string;
}
