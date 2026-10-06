import { CallHandler, ExecutionContext, Injectable, Logger, NestInterceptor } from '@nestjs/common';
import { Request, Response } from 'express';
import { Observable } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { ISuccessResponse } from '../types';

// Extend Express Request to safely include custom time tracking properties without 'any'

@Injectable()
export class TransformResponseInterceptor<T> implements NestInterceptor<T, ISuccessResponse<T>> {
	private readonly logger = new Logger('Response_Time');

	intercept(context: ExecutionContext, next: CallHandler<T>): Observable<ISuccessResponse<T>> {
		const ctx = context.switchToHttp();
		const req = ctx.getRequest<Request>();
		const res = ctx.getResponse<Response>();

		const startTime = req.startAt;

		return next.handle().pipe(
			tap(() => {
				if (startTime) {
					const duration = Date.now() - (startTime || 0);
					this.logger.log(`[${req.method}] ${req.url} - ${res.statusCode} - ${duration}ms`);
				}
			}),
			map((payload: T | ISuccessResponse<T>): ISuccessResponse<T> => {
				const status = res.statusCode || 200;
				const duration = startTime ? `${Date.now() - startTime}ms` : undefined;

				const baseResponse = {
					success: true,
					status,
					...(duration && { duration }),
				};

				// If payload is a string, assign it to message property
				if (typeof payload === 'string') {
					return {
						...baseResponse,
						message: payload,
					} as ISuccessResponse<T>;
				}

				// If payload is a plain object, merge its properties directly
				if (typeof payload === 'object' && payload !== null && !Array.isArray(payload)) {
					return {
						...baseResponse,
						...payload,
						...((payload as ISuccessResponse<T>).data && { data: (payload as ISuccessResponse<T>).data }),
					} as ISuccessResponse<T>;
				}

				// Handle arrays, numbers, booleans, and other types inside data property
				return {
					...baseResponse,
					data: payload,
				} as ISuccessResponse<T>;
			}),
		);
	}
}
