import { type EnvConfig, envConfig } from '@/config/env.config';
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

		const patternsToInvalidate: string[] = [];

		if (metadataPatterns && metadataPatterns.length > 0) {
			// Format user-provided patterns with dynamic parameters resolution
			for (const pattern of metadataPatterns) {
				patternsToInvalidate.push(...this.formatPattern(pattern, req));
			}
		} else {
			// Automatically derive targeted module and item patterns
			patternsToInvalidate.push(...this.extractAutoPatterns(req));
		}

		return next.handle().pipe(
			tap(async () => {
				// Deduplicate patterns to prevent redundant Redis calls
				const uniquePatterns = Array.from(new Set(patternsToInvalidate));

				for (const pattern of uniquePatterns) {
					try {
						await this.redisService.deletePattern(pattern);
						this.logger.log(`[cache_Redis] Successfully invalidated pattern: ${pattern}`);
					} catch (error: unknown) {
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
	 * Formats pattern into Redis keys, resolving dynamic route parameters (e.g. :productId)
	 */
	private formatPattern(pattern: string, req: Request): string[] {
		if (pattern.startsWith(`${cachePrefix}`)) {
			return [pattern.endsWith('*') ? pattern : `${pattern}*`];
		}

		let resolvedPattern = pattern;
		const params = req.params as Record<string, string>;

		if (params && Object.keys(params).length > 0) {
			for (const [key, value] of Object.entries(params)) {
				resolvedPattern = resolvedPattern.replace(`:${key}`, value).replace(`{${key}}`, value);
			}
		}

		const fullPrefix = this.getFullApiPrefix();
		const cleanPattern = resolvedPattern.startsWith('/') ? resolvedPattern : `/${resolvedPattern}`;
		const basePath = cleanPattern.startsWith(fullPrefix) ? cleanPattern : `${fullPrefix}${cleanPattern}`;

		// Handle root list pattern invalidation specifically to avoid wiping sibling sub-paths
		if (!pattern.includes(':') && !pattern.includes('*')) {
			return [`${cachePrefix}${basePath}`, `${cachePrefix}${basePath}?*`];
		}

		const finalPattern = `${cachePrefix}${basePath}`;
		return [finalPattern.endsWith('*') ? finalPattern : `${finalPattern}*`];
	}

	/**
	 * Extracts targeted base module pattern and specific param pattern automatically
	 */
	private extractAutoPatterns(req: Request): string[] {
		const fullPrefix = this.getFullApiPrefix();
		let cleanUrl = (req.originalUrl || req.url).split('?')[0];

		if (cleanUrl.includes('/admin/')) {
			cleanUrl = cleanUrl.replace('/admin/', '/');
		} else if (cleanUrl.endsWith('/admin')) {
			cleanUrl = cleanUrl.replace('/admin', '');
		}

		const params = req.params as Record<string, string>;
		const results: string[] = [];

		const routeAfterPrefix = cleanUrl.startsWith(fullPrefix) ? cleanUrl.slice(fullPrefix.length) : cleanUrl;
		const firstSegment = routeAfterPrefix.split('/').filter(Boolean)[0];

		if (firstSegment) {
			const baseModulePath = `${cachePrefix}${fullPrefix}/${firstSegment}`;
			results.push(baseModulePath, `${baseModulePath}?*`);
		}

		const paramValues = Object.values(params || {});
		if (paramValues.length > 0 && firstSegment) {
			for (const val of paramValues) {
				results.push(`${cachePrefix}${fullPrefix}/${firstSegment}/${val}*`);
			}
		}

		return results;
	}
}
