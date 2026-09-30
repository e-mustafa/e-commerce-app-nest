import { generalFields } from '@/common/validation';
import { appConfig } from '@/config';
import { sortOrderEnum } from '@/providers/database/query.enum';
import z from 'zod';

const { defaultOrder, defaultLimit } = appConfig().notification;

export const addDeviceTokenSchema = {
	body: z.strictObject({
		token: generalFields.token,
	}),
};
export type AddDeviceTokenDTO = z.infer<typeof addDeviceTokenSchema.body>;

export const getNotificationsSchema = {
	query: z.object({
		page: generalFields.page.default(1).optional(),
		limit: generalFields.limit.default(defaultLimit || 10).optional(),
		order: generalFields.order.default(defaultOrder || sortOrderEnum.DESC).optional(),
		unreadOnly: z.coerce.boolean().optional(),
	}),
};
export type GetNotificationsQueryDTO = z.infer<typeof getNotificationsSchema.query>;

export const paramsIdSchema = {
	params: z.strictObject({
		notificationId: generalFields.id,
	}),
};

export type ParamsIdSchemaDTO = z.infer<typeof paramsIdSchema.params>;
