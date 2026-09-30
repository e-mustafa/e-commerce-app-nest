export const sortOrderEnum = {
	ASC: 'asc',
	DESC: 'desc',
} as const;

export type TSortOrder = (typeof sortOrderEnum)[keyof typeof sortOrderEnum];
