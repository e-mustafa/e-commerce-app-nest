export const SortOrderEnum = {
	ASC: 'asc',
	DESC: 'desc',
} as const;

export type SortOrderEnum = (typeof SortOrderEnum)[keyof typeof SortOrderEnum];
