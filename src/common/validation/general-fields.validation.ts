import { GenderEnum } from '@/modules/user';
import { sortOrderEnum } from '@/providers/database';
import { Readable } from 'node:stream';
import z from 'zod';

// Regex for strong password: Min 8 chars, 1 uppercase, 1 lowercase, 1 number, 1 special character
const strongPasswordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

// Regex for Egyptian phone number: 01[0125][0-9]{8} -> 01012345678
const phoneRegex = /^01[0125][0-9]{8}$/;

const otpRegex = /^\d{6}$/;

const usernameRegex = /^[a-zA-Z0-9_]{6,30}$/;

export const objectIdRegex = /^[0-9a-fA-F]{24}$/;

// const emailRegex = /^\w+([-.]?\w+)*@\w+([-.]?\w+)*(\.\w{2,3})+$/;
// /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

export const uploadFileSchema = z.object({
	fieldname: z.string(),
	originalname: z.string(),
	encoding: z.string(),
	// mimetype: z.mime(),
	mimetype: z.string(),
	// Handles buffer validation cleanly for memoryStorage setups
	buffer: z
		.custom<Buffer>((val) => Buffer.isBuffer(val), {
			message: 'File buffer is required',
		})
		.optional(),
	stream: z.custom<Readable>().optional(), // Added to satisfy Express.Multer.File requirements
	destination: z.string().optional(),
	filename: z.string().optional(),
	size: z.number().positive('File cannot be empty'),
	path: z.string().optional(),
	filePath: z.string().optional(),
});

// Dynamic file schema factory for strict typing and custom error messages
export const getFileSchema = (errorMessage = 'File is required') =>
	z.object(
		uploadFileSchema.shape,
		// {
		// 	...uploadFileSchema.shape,
		// 	fieldname: z.string(),
		// 	originalname: z.string(),
		// 	encoding: z.string(),
		// 	mimetype: z.string(),
		// 	buffer: z
		// 		.custom<Buffer>((val) => Buffer.isBuffer(val), {
		// 			message: 'File buffer is required',
		// 		})
		// 		.optional(),
		// 	stream: z.custom<Readable>().optional(),
		// 	destination: z.string().optional(),
		// 	filename: z.string().optional(),
		// 	size: z.number().positive('File cannot be empty'),
		// 	path: z.string().optional(),
		// 	filePath: z.string().optional(),
		// },
		{
			error: errorMessage,
		},
	);

export const attachmentsDBSchema = z.strictObject({
	id: z.string().trim(),
	url: z.string().trim(),
	resourceType: z.string().trim(),
});
export const DBImageVSchema = z.object({
	id: z.string().min(1, 'Image id is required'),
	url: z.string().min(1, 'Image url is required'),
});

export const generalFields = {
	id: z.string('ID is required').trim().regex(objectIdRegex, 'ID is in-valid'),
	idOrUsername: z.custom((value) => {
		if (typeof value === 'string') {
			return objectIdRegex.test(value) || usernameRegex.test(value);
		}
		return false;
	}, 'ID or username is required'),
	slug: z
		.string('Slug is required')
		.trim()
		.min(2, 'Slug must be at least 2 characters long')
		.max(150, 'Slug must be at most 150 characters long')
		.toLowerCase()
		.regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug must contain only lowercase alphanumeric characters and single hyphens'),
	firstName: z
		.string({ error: 'First name is required' })
		.min(3, 'First name must be at least 3 characters long')
		.max(30, 'First name must be at most 30 characters long'),

	lastName: z
		.string({ error: 'Last name is required' })
		.min(2, 'Last name must be at least 2 characters long')
		.max(30, 'Last name must be at most 30 characters long'),

	username: z
		.string({ error: 'Username is required' })
		.min(6, 'Username must be at least 6 characters long')
		.max(30, 'Username must be at most 30 characters long')
		.regex(usernameRegex, 'Invalid username, Username must contain only letters, numbers, and underscores')
		.lowercase(),

	email: z.email({ error: 'Email is required' }).trim().lowercase(),

	password: z
		.string({ error: 'Password is required' })
		.regex(
			strongPasswordRegex,
			'Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special character',
		),

	confirmPassword: z.string({ error: 'Confirm password is required' }),

	bio: z.string().max(160, 'Bio must be at most 160 characters long'),
	gender: z.union([
		z.enum(GenderEnum),
		z.enum(Object.keys(GenderEnum)).transform((val) => GenderEnum[val as keyof typeof GenderEnum]),
	]),
	// birthdate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format, use YYYY-MM-DD'),
	birthdate: z.coerce.date(),
	phone: z.string({ error: 'Phone is required' }).regex(phoneRegex, 'Invalid phone number'),

	otp: z.string({ error: 'OTP is required' }).regex(otpRegex, 'OTP must be 6 digits'),
	token: z.string({ error: 'Token is required' }).min(6, 'Invalid token structure'),

	file: uploadFileSchema,

	page: z.coerce.number().int().min(1).default(1),
	limit: z.coerce.number().int().min(1).max(100).default(10),
	order: z.enum(Object.values(sortOrderEnum)),
	search: z
		.string()
		.trim()
		.max(100, 'Search must be at most 5000 character')
		.optional()
		.transform((val) => (val ? val : undefined)),

	// postContent: z
	// 	.string()
	// 	.min(2, 'Content must be at least 2 character.')
	// 	.max(5000, 'Content must be at most 5000 character.')
};

export const arrayIdsSchema = z.array(generalFields.id).max(10, 'Tagged users cannot exceed 10 users');

export const paramsIdSchema = {
	params: z.strictObject({
		id: generalFields.id,
	}),
};
export type IParamsIdDTO = z.infer<typeof paramsIdSchema.params>;

export const querySchema = {
	query: z.object({
		page: generalFields.page.optional(),
		limit: generalFields.limit.optional(),
		order: generalFields.order.optional(),
		search: generalFields.search.optional(),
	}),
};
export type QueryDTO = z.infer<typeof querySchema.query>;

/**
 * Helper function to safely parse FormData array fields (JSON string or comma-separated).
 * Accepts a full ZodArray schema to allow flexible array validations (.min, .max, .nonempty, etc.).
 */
export const parseFormDataArray = <T extends z.ZodTypeAny = typeof generalFields.id>(arraySchema: z.ZodArray<T>) => {
	// Fallback to default arrayIds schema when arraySchema is omitted

	return z.preprocess((val) => {
		if (!val) return undefined;
		if (typeof val === 'string') {
			try {
				const parsed = JSON.parse(val);
				if (Array.isArray(parsed)) return parsed;
			} catch {
				return val
					.split(',')
					.map((item) => item.trim())
					.filter(Boolean);
			}
		}
		return val;
	}, arraySchema);
};

export const taggedUsers = parseFormDataArray(arrayIdsSchema).optional();
