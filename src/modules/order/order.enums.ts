export const OrderStatusEnum = {
	PENDING: 'PENDING',
	PROCESSING: 'PROCESSING',
	DELIVERED: 'DELIVERED',
	RETURNED: 'RETURNED',
	REFUNDED: 'REFUNDED',
	SHIPPED: 'SHIPPED',
	PAID: 'PAID',
	CANCELLED: 'CANCELLED',
	COMPLETED: 'COMPLETED',
} as const;
export type OrderStatusEnum = (typeof OrderStatusEnum)[keyof typeof OrderStatusEnum];

export const PaymentMethodEnum = {
	COD: 'COD',
	WALLET: 'WALLET',
	ONLINE: 'ONLINE',
};
export type PaymentMethodEnum = (typeof PaymentMethodEnum)[keyof typeof PaymentMethodEnum];

export const PaymentStatusEnum = {
	PENDING: 'PENDING',
	SUCCESS: 'SUCCESS',
	FAILED: 'FAILED',
};
export type PaymentStatusEnum = (typeof PaymentStatusEnum)[keyof typeof PaymentStatusEnum];

export const ShippingStatusEnum = {
	PENDING: 'PENDING',
	PROCESSING: 'PROCESSING',
	SUCCESS: 'SUCCESS',
	FAILED: 'FAILED',
};
export type ShippingStatusEnum = (typeof ShippingStatusEnum)[keyof typeof ShippingStatusEnum];
