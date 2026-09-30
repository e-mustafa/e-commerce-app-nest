import { HttpStatus } from '@nestjs/common';
import { IFieldErrors } from '../types';
import { AppException } from './app.exception';

export class InternalException extends AppException {
	constructor(
		message: string = 'Sorry, Something went wrong.',
		context?: string,
		statusCode: number = HttpStatus.INTERNAL_SERVER_ERROR,
		originalError?: unknown,
	) {
		super(statusCode, message, context, undefined, false, undefined, originalError);
	}
}

/**
 * Specific Exception for field validation errors
 */
export class ValidationErrorsException extends AppException {
	constructor(errors: IFieldErrors, message: string = 'Validation fields error', context?: string) {
		super(HttpStatus.BAD_REQUEST, message, context, errors, true);
	}
}

/**
 * HTTP 400 Bad Request
 */
export class BadRequestException extends AppException {
	constructor(
		message: string = 'Bad request',
		errors: IFieldErrors | undefined = undefined,
		context?: string,
		originalError?: unknown,
	) {
		super(HttpStatus.BAD_REQUEST, message, context, errors, true, undefined, originalError);
	}
}

/**
 * HTTP 404 Not Found
 */
export class NotFoundException extends AppException {
	constructor(
		message: string = 'Not found',
		context?: string,
		errors: IFieldErrors | undefined = undefined,
		originalError?: unknown,
	) {
		super(HttpStatus.NOT_FOUND, message, context, errors, true, undefined, originalError);
	}
}

/**
 * HTTP 409 Conflict
 */
export class ConflictException extends AppException {
	constructor(
		message: string = 'Conflict detected',
		errors: IFieldErrors | undefined = undefined,
		context?: string,
		originalError?: unknown,
	) {
		super(HttpStatus.CONFLICT, message, context, errors, true, undefined, originalError);
	}
}

/**
 * HTTP 401 Unauthorized
 */
export class UnauthorizedException extends AppException {
	constructor(
		message: string = 'Unauthorized access',
		context?: string,
		errors: IFieldErrors | undefined = undefined,
		originalError?: unknown,
	) {
		super(HttpStatus.UNAUTHORIZED, message, context, errors, true, undefined, originalError);
	}
}

/**
 * HTTP 403 Forbidden
 */
export class ForbiddenException extends AppException {
	constructor(
		message: string = 'Forbidden resource',
		context?: string,
		errors: IFieldErrors | undefined = undefined,
		originalError?: unknown,
	) {
		super(HttpStatus.FORBIDDEN, message, context, errors, true, undefined, originalError);
	}
}

/**
 * HTTP 429 Too Many Requests
 */
export class TooManyRequestsException extends AppException {
	constructor(message: string = 'Too many requests, please try again later', remainingSeconds?: number, context?: string) {
		super(HttpStatus.TOO_MANY_REQUESTS, message, context, undefined, true, remainingSeconds);
	}
}

// // ManyRequestsException
// export class ManyRequestsException extends AppException {
// 	constructor(message: string = 'Too many requests, please try again later', remainingSeconds?: number, context?: string) {
// 		super(HttpStatus.TOO_MANY_REQUESTS, message, context, {}, true, remainingSeconds);
// 	}
// }
