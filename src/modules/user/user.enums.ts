export enum GenderEnum {
	MALE = 'male',
	FEMALE = 'female',
}

export enum AccountProviderEnum {
	SYSTEM = 'system',
	GOOGLE = 'google',
	FACEBOOK = 'facebook',
	TWITTER = 'twitter',
}

export enum RoleEnum {
	USER = 'user',
	ADMIN = 'admin',
	SUPER_ADMIN = 'super_admin',
}

export enum AdminRoleEnum {
	ADMIN = 'admin',
	SUPER_ADMIN = 'super_admin',
}

export const AdminRoles = Object.values(AdminRoleEnum);

export enum UserStatusEnum {
	ACTIVE = 'active',
	INACTIVE = 'inactive',
	BANNED = 'banned',
	// 'pending_deletion'
	DELETING = 'pending_deletion',
}

export enum StatusReasonEnum {
	USER_REQUEST = 'USER_REQUEST',
	ADMIN_ACTION = 'ADMIN_ACTION',
	SECURITY_SUSPICION = 'SECURITY_SUSPICION',
	INACTIVITY_TIMEOUT = 'INACTIVITY_TIMEOUT',
	POLICY_VIOLATION = 'POLICY_VIOLATION',
	// USER_REACTIVATION = 'USER_REACTIVATION',
}
