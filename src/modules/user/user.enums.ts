export const GenderEnum = {
	MALE: 0,
	FEMALE: 1,
} as const;

export type GenderEnum = (typeof GenderEnum)[keyof typeof GenderEnum];
export type TGendersKey = keyof typeof GenderEnum;

export const ProviderEnum = {
	SYSTEM: 'system',
	GOOGLE: 'google',
	FACEBOOK: 'facebook',
	TWITTER: 'twitter',
} as const;

export type ProviderEnum = (typeof ProviderEnum)[keyof typeof ProviderEnum];

export const RoleEnum = {
	USER: 0,
	ADMIN: 1,
	SUPER_ADMIN: 2,
} as const;

export type RoleEnum = (typeof RoleEnum)[keyof typeof RoleEnum];

export const AdminRoleEnum = {
	ADMIN: 1,
	SUPER_ADMIN: 2,
} as const;

export type AdminRoleEnum = (typeof AdminRoleEnum)[keyof typeof AdminRoleEnum];
export const AdminRoles = Object.values(AdminRoleEnum);

export const UserStatusEnum = {
	ACTIVE: 'active',
	INACTIVE: 'inactive',
	BANNED: 'banned',
	// 'pending_deletion'
	DELETING: 'pending_deletion',
} as const;

export type UserStatusEnum = (typeof UserStatusEnum)[keyof typeof UserStatusEnum];

export const StatusReasonEnum = {
	USER_REQUEST: 'USER_REQUEST',
	ADMIN_ACTION: 'ADMIN_ACTION',
	SECURITY_SUSPICION: 'SECURITY_SUSPICION',
	INACTIVITY_TIMEOUT: 'INACTIVITY_TIMEOUT',
	POLICY_VIOLATION: 'POLICY_VIOLATION',
	// USER_REACTIVATION = 'USER_REACTIVATION',
} as const;
export type StatusReasonEnum = (typeof StatusReasonEnum)[keyof typeof StatusReasonEnum];
