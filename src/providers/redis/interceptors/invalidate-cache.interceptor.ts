import { type EnvConfig, envConfig } from '@/config/env.config'; // Ensure path matches your project structure
import { CallHandler, ExecutionContext, Inject, Injectable, Logger, NestInterceptor } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { Observable, tap } from 'rxjs';
import { INVALIDATE_CACHE_METADATA } from '../decorators';
import { RedisService } from '../redis.service';
import { cachePrefix } from './http-cache.interceptor';

@Injectable()
export class InvalidateCacheInterceptor implements NestInterceptor {
	private readonly logger = new Logger(InvalidateCacheInterceptor.name);

	constructor(
		private readonly redisService: RedisService,
		private readonly reflector: Reflector,
		@Inject(envConfig.KEY) private readonly ENV: EnvConfig,
	) {}

	intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
		const req = context.switchToHttp().getRequest<Request>();

		// Get metadata patterns passed explicitly to the decorator
		const metadataPatterns = this.reflector.getAllAndOverride<string[]>(INVALIDATE_CACHE_METADATA, [
			context.getHandler(),
			context.getClass(),
		]);

		let patternsToInvalidate: string[] = [];

		if (metadataPatterns && metadataPatterns.length > 0) {
			// Format user-provided patterns using system environment configuration
			patternsToInvalidate = metadataPatterns.map((pattern) => this.formatPattern(pattern));
		} else {
			// Automatically derive the base module pattern if no pattern is explicitly provided
			patternsToInvalidate = [this.extractBaseModulePattern(req)];
		}

		return next.handle().pipe(
			tap(async () => {
				for (const pattern of patternsToInvalidate) {
					try {
						await this.redisService.deletePattern(pattern);
						this.logger.log(`[cache_Redis] Successfully invalidated pattern: ${pattern}`);
					} catch (error) {
						this.logger.warn(`[cache_Redis] Failed to invalidate pattern ${pattern}: `, error);
					}
				}
			}),
		);
	}

	/**
	 * Constructs the full API prefix string (e.g., /api/v1) dynamically from environment configuration
	 */
	private getFullApiPrefix(): string {
		const rawPrefix = this.ENV.apiBaseUrlPrefix || '';
		const rawVersion = this.ENV.apiBaseUrlVersion || '';

		const prefix = rawPrefix.startsWith('/') ? rawPrefix : `/${rawPrefix}`;
		const version = rawVersion.startsWith('v') ? rawVersion : `v${rawVersion}`;

		return `${prefix}/${version}`.replace(/\/+/g, '/');
	}

	/**
	 * Formats given pattern string into a valid Redis key pattern using the global API prefix
	 */
	private formatPattern(pattern: string): string {
		if (pattern.startsWith('${cachePrefix}')) {
			return pattern.endsWith('*') ? pattern : `${pattern}*`;
		}

		const cleanPattern = pattern.startsWith('/') ? pattern : `/${pattern}`;
		const fullPrefix = this.getFullApiPrefix();

		if (cleanPattern.startsWith(fullPrefix)) {
			return `${cachePrefix}${cleanPattern}*`;
		}

		return `${cachePrefix}${fullPrefix}${cleanPattern}*`;
	}

	/**
	 * Extracts base module path from request URL (e.g., /api/v1/products/123 -> ${cachePrefix}/api/v1/products*)
	 */
	private extractBaseModulePattern(req: Request): string {
		const rawUrl = (req.originalUrl || req.url).split('?')[0];
		const fullPrefix = this.getFullApiPrefix();

		if (rawUrl.startsWith(fullPrefix)) {
			const routeAfterPrefix = rawUrl.slice(fullPrefix.length);
			const firstSegment = routeAfterPrefix.split('/').filter(Boolean)[0];

			if (firstSegment) {
				return `${cachePrefix}${fullPrefix}/${firstSegment}*`;
			}
		}

		return `${cachePrefix}${rawUrl}*`;
	}
}
