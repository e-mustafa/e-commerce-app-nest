import { Id, IUserBody } from '@/common/types';
import type * as dto from './order.dto';

export interface ICreateOrderPayload extends dto.CreateOrderDTO {
	userId: Id;
}

export interface IUpdateOrderPayload extends dto.UpdateOrderDTO, dto.UpdateOrderParamDTO {
	user: IUserBody;
}

export interface IListOrderPayload extends dto.GetOrderQueryDTO {
	user: IUserBody;
}
