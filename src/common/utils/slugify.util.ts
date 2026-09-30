/**
 * Utility helper to convert strings into URL-safe slugs (supports Arabic and English characters).
 *
 * @param text - The input string to transform.
 * @returns The transformed URL-friendly slug string.
 */
export const slugify = (text: string): string =>
	text
		.toString()
		.trim()
		.toLowerCase()
		.replace(/\s+/g, '-') // Replace spaces with -
		.replace(/[^\w\u0600-\u06FF\-]+/g, '') // Remove all non-word chars except Arabic range and hyphens
		.replace(/\-\-+/g, '-') // Replace multiple - with single -
		.replace(/^-+/, '') // Trim - from start of text
		.replace(/-+$/, ''); // Trim - from end of text
