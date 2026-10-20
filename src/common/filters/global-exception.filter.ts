import { type EnvConfig, envConfig } from '@/config';
import { Catch, ExceptionFilter, HttpException, HttpStatus, Inject, Logger, Optional } from '@nestjs/common';
import { GqlExecutionContext, GraphQLExecutionContext } from '@nestjs/graphql';
import { Request, Response } from 'express';
import { GraphQLError } from 'graphql';
import { AppException } from '../exceptions';
import { IFieldErrors } from '../types';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
	private readonly logger = new Logger(GlobalExceptionFilter.name);
	private readonly isDev: boolean = false;
	constructor(
		@Optional()
		@Inject(envConfig.KEY)
		private readonly ENV: EnvConfig,
	) {
		this.isDev = this.ENV.isDev;
	}

	catch(exception: unknown, host: GraphQLExecutionContext): void {
		const contextType = host.getType();
		let isGraphQL = false;

		let req = host.switchToHttp().getRequest<Request>();
		let res = host.switchToHttp().getResponse<Response>();

		if (contextType === 'graphql') {
			isGraphQL = true;
			req = GqlExecutionContext.create(host).getContext().req;
			res = GqlExecutionContext.create(host).getContext().res;
		}

		const startTime = req?.startAt || 0;
		console.log({ startTime });
		let statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
		let message: string | string[] = 'Internal server error';
		let context = 'server_error';
		let errors: IFieldErrors | undefined;
		let isOperational = false;
		let remainingSeconds: number | undefined = undefined;

		// Handle custom application exceptions
		if (exception instanceof AppException) {
			statusCode = exception.getStatus();
			message = exception.message;
			context = exception.context;
			errors = exception.errors;
			isOperational = exception.isOperational;
			remainingSeconds = exception.remainingSeconds;
		}
		// Handle standard NestJS HTTP exceptions (e.g., built-in ValidationPipe)
		else if (exception instanceof HttpException) {
			statusCode = exception.getStatus();
			context = exception.constructor.name.replace('Exception', '').toLowerCase();
			isOperational = true;

			const responseContent = exception.getResponse();
			if (typeof responseContent === 'string') {
				message = responseContent;
			} else if (typeof responseContent === 'object' && responseContent !== null) {
				const resObj = responseContent as Record<string, unknown>;
				message = (resObj.message as string | string[]) || exception.message;

				if (resObj.errors && typeof resObj.errors === 'object') {
					errors = resObj.errors as IFieldErrors;
				}
				// else if (Array.isArray(resObj.message)) {
				// 	// Formats default NestJS class-validator pipeline errors cleanly
				// 	errors = { validation: resObj.message };
				// }
			}
		}
		// Handle unexpected native JavaScript runtime errors
		else if (exception instanceof Error) {
			message = exception.message;
		}

		const statusLabel = `${statusCode}`.startsWith('4') ? 'Failed' : 'Error';

		// Log error appropriately based on status code severity
		const logMessage = `[${req.method}] ${req.url} - Status: ${statusCode}:${statusLabel} - ${startTime ? `${Date.now() - startTime} ms` : ''} - Message: ${Array.isArray(message) ? message.join(', ') : message}`;
		if (statusCode >= 500) {
			this.logger.error(logMessage, exception instanceof Error ? exception.stack : undefined, context);
		} else {
			this.logger.warn(`[${context}] ${logMessage}`);
		}

		// Base response shape matching client API contract
		const baseResponseBody = {
			success: false,
			message,
			statusCode,
			duration: startTime ? `${Date.now() - startTime}ms` : undefined,
			status: statusLabel,
			errors,
			isOperational,
			...(remainingSeconds !== undefined && { remainingSeconds }),
		};

		if (isGraphQL) {
			const devErrorInfo =
				!this.isDev || process.env.NODE_ENV === 'production'
					? {}
					: {
							error: {
								context,
								timestamp: new Date().toISOString(),
								...(exception instanceof Error ? { name: exception.name, stack: exception.stack } : { exception }),
							},
						};

			throw new GraphQLError(Array.isArray(message) ? message.join(', ') : message, {
				extensions: {
					code: context.toUpperCase(),
					...baseResponseBody,
					...devErrorInfo,
				},
			});
		}

		// Return production response (clean details)
		if (!this.isDev || process.env.NODE_ENV === 'production') {
			res?.status(statusCode).json(baseResponseBody);
			return;
		}

		// Return development response (rich debug context)
		const devResponseBody = {
			...baseResponseBody,
			error: {
				context,
				timestamp: new Date().toISOString(),
				path: req.url,
				method: req.method,
				...(exception instanceof Error ? { name: exception.name, stack: exception.stack } : { exception }),
			},
		};

		res.status(statusCode).json(devResponseBody);
	}
}
