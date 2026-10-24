import { registerEnumType } from '@nestjs/graphql';
import { OrderStatusEnum, PaymentMethodEnum, PaymentStatusEnum, ShippingStatusEnum } from '../order.enums';

registerEnumType(OrderStatusEnum, {
	name: 'OrderStatusEnum',
	description: 'Defines the status of the order',
});

registerEnumType(PaymentMethodEnum, {
	name: 'PaymentMethodEnum',
	description: 'Defines the payment method of the order',
});

registerEnumType(PaymentStatusEnum, {
	name: 'PaymentStatusEnum',
	description: 'Defines the payment status of the order',
});

registerEnumType(ShippingStatusEnum, {
	name: 'ShippingStatusEnum',
	description: 'Defines the shipping status of the order',
});
