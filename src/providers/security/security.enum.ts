export const HashEnum = {
	BCRYPT: 'bcrypt',
	ARGON2: 'argon2',
} as const;

export type HashEnum = (typeof HashEnum)[keyof typeof HashEnum];

export const TokenTypeEnum = {
	ACCESS: 'ACCESS',
	REFRESH: 'REFRESH',
} as const;
export type TokenTypeEnum = (typeof TokenTypeEnum)[keyof typeof TokenTypeEnum];


export const CookiesKeysEnum = {
	accessToken: 'access-token',
	refreshToken: 'refresh-token',
	tokenId: 'tokenId',
} as const;
export type CookiesKeysEnum = (typeof CookiesKeysEnum)[keyof typeof CookiesKeysEnum];
