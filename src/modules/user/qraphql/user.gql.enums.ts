import { registerEnumType } from '@nestjs/graphql';
import { AccountProviderEnum, GenderEnum, RoleEnum, StatusReasonEnum, UserStatusEnum } from '../user.enums';

registerEnumType(GenderEnum, {
	name: 'GenderEnum',
	description: 'Gender of the user',
});

registerEnumType(AccountProviderEnum, {
	name: 'AccountProviderEnum',
	description: 'Provider of the user account',
});

registerEnumType(RoleEnum, {
	name: 'RoleEnum',
	description: 'Role of the user',
});

registerEnumType(UserStatusEnum, {
	name: 'UserStatusEnum',
	description: 'Status of the user',
});

registerEnumType(StatusReasonEnum, {
	name: 'StatusReasonEnum',
	description: 'Reason for the status change of the user',
});
