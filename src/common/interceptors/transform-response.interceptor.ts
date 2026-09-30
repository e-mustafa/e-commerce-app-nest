import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { map, Observable } from 'rxjs';
import { ISuccessResponse } from '../types';

@Injectable()
export class TransformResponseInterceptor<T> implements NestInterceptor<T, ISuccessResponse<T>> {
	intercept(
		context: ExecutionContext,
		next: CallHandler<T>,
	): Observable<ISuccessResponse<T>> | Promise<Observable<ISuccessResponse<T>>> {
		const ctx = context.switchToHttp();
		const res = ctx.getResponse<Response>();
		const status = res.status || 200;

		return next.handle().pipe<ISuccessResponse<T>>(
			map((payload: T) => {
				let message: string | undefined = undefined;
				let data: T | undefined = undefined;

				if (typeof payload === 'string') message = payload;

				if (Array.isArray(payload)) data = payload;

				let resObject = {};
				if (typeof payload === 'object' && payload !== null && !Array.isArray(payload)) {
					resObject = payload;
				}

				return {
					message,
					status,
					...(data && { data }),
					...resObject,
					success: true,
				};
			}),
		);
	}
}
