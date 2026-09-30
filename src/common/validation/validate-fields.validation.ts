import z, { ZodType } from 'zod';

// Types for validation errors map and schema structures
type TErrors = Record<string, string>;

/**
 * Formats ZodError issues into a flat key-value map.
 */
/**
 * Formats ZodError issues into a flat key-value map.
 */
export const formatZodErrors = (errors: z.core.$ZodIssue[] = []): TErrors => {
	const formattedErrors: TErrors = {};

	errors?.forEach((issue) => {
		// Fallback to '_root' if path is empty (e.g., schema-level errors)
		const path = issue.path.length > 0 ? issue.path.join('.') : '_root';

		// Retain only the first error message per field
		if (!formattedErrors[path]) {
			formattedErrors[path] = issue.message;
		}
	});

	return formattedErrors;
};

export const validateFields = <T extends ZodType>(
	schema: T,
	data: unknown,
): { success: boolean; errors?: TErrors; data?: z.infer<T> } | undefined => {
	if (!schema) return { success: false };

	const result = schema.safeParse(data ?? {});

	if (!result.success) {
		return { success: false, errors: formatZodErrors(result.error.issues) };
	}

	return { success: result.success, data: result.data };
};
