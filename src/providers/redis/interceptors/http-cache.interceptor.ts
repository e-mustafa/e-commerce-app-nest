import { type AppConfig, appConfig } from '@/config';
import { CallHandler, ExecutionContext, Inject, Injectable, Logger, NestInterceptor } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { Observable, of, tap } from 'rxjs';
import { CACHE_TTL_METADATA } from '../decorators/cache.decorator';
import { RedisService } from '../redis.service';

export const cachePrefix = 'cache:';

@Injectable()
export class CacheInterceptor implements NestInterceptor {
	private readonly DEFAULT_TTL: number = 360; // Default TTL in seconds
	private readonly logger = new Logger(CacheInterceptor.name);

	constructor(
		private readonly redisService: RedisService,
		private readonly reflector: Reflector,
		@Inject(appConfig.KEY) private readonly APP: AppConfig,
	) {
		if (this.APP.cache.defaultTTL) this.DEFAULT_TTL = this.APP.cache.defaultTTL;
	}
	async intercept(context: ExecutionContext, next: CallHandler): Promise<Observable<unknown>> {
		const req = context.switchToHttp().getRequest<Request>();

		if (req.method !== 'GET') return next.handle();

		const ttl =
			this.reflector.getAllAndOverride<number>(CACHE_TTL_METADATA, [context.getHandler(), context.getClass()]) ||
			this.DEFAULT_TTL;

		// res.set('Cache-Control', 'no-cache, no-store, must-revalidate'); // HTTP 1.1.
		// res.set('Expires', '0'); // Proxies.
		// res.set('Pragma', 'no-cache'); // HTTP 1.0.

		const cacheKey = `${cachePrefix}${req.originalUrl || req.url}`;

		try {
			const cachedData = await this.redisService.get(cacheKey);
			if (cachedData) {
				return of(JSON.parse(cachedData));
			}
		} catch (error) {
			this.logger.warn(`[cache_Redis] Failed to get cached data from redis: `, error);
		}

		return next.handle().pipe(
			tap(async (data: unknown) => {
				if (!data) return;
				try {
					await this.redisService.set(cacheKey, JSON.stringify(data), ttl);
				} catch (error) {
					this.logger.warn(`[cache_Redis] Failed to set cached data to redis: `, error);
				}
			}),
		);
	}
}
