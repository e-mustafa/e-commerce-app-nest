import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { map, Observable } from 'rxjs';
import { SKIP_IMAGE_PATH_TRANSFORM_KEY } from '../decorators';

/**
 * Standard API response structure contract.
 */
export interface ApiResponseWrapper<T = unknown> {
	data?: T;
	[key: string]: unknown;
}

@Injectable()
export class ImagePathInterceptor<T = unknown> implements NestInterceptor<T, T | ApiResponseWrapper<T>> {
	constructor(private readonly reflector: Reflector) {}

	intercept(
		context: ExecutionContext,
		next: CallHandler<T | ApiResponseWrapper<T>>,
	): Observable<T | ApiResponseWrapper<T>> {
		// Bypass transformation if the endpoint is decorated with @SkipImagePathTransform()
		const isSkipped = this.reflector.getAllAndOverride<boolean>(SKIP_IMAGE_PATH_TRANSFORM_KEY, [
			context.getHandler(),
			context.getClass(),
		]);
		if (isSkipped) return next.handle();

		const req = context.switchToHttp().getRequest<Request>();
		const baseUrl = `${req.protocol}://${req.get('host')}`;

		return next.handle().pipe(
			map((res) => {
				if (!res) return res;

				// Extract payload if standard API response wrapper is used
				const responseObj = res as ApiResponseWrapper<T>;
				const targetData = responseObj.data ?? res;

				if (Array.isArray(targetData)) {
					targetData.forEach((item) => {
						if (item && typeof item === 'object') {
							this.processEntity(item as Record<string, unknown>, baseUrl);
						}
					});
				} else if (targetData && typeof targetData === 'object') {
					this.processEntity(targetData as Record<string, unknown>, baseUrl);
				}

				return res;
			}),
		);
	}

	/**
	 * Constructs a fully qualified URL using standard URL API.
	 */
	private buildFullUrl(urlPath?: string, baseUrl?: string): string | undefined {
		if (!urlPath || !baseUrl) return urlPath;

		if (urlPath.startsWith('http://') || urlPath.startsWith('https://')) {
			return urlPath;
		}

		try {
			return new URL(urlPath, baseUrl).href;
		} catch {
			return urlPath;
		}
	}

	/**
	 * Recursively processes image fields for target entities and child entities.
	 */
	private processEntity(item: Record<string, unknown>, baseUrl: string): void {
		if (!item || typeof item !== 'object') return;

		// Transform avatar URL
		if (item.avatar && typeof item.avatar === 'object' && 'url' in item.avatar && typeof item.avatar.url === 'string') {
			item.avatar.url = this.buildFullUrl(item.avatar.url, baseUrl);
		}

		// Transform cover URL
		if (item.cover && typeof item.cover === 'object' && 'url' in item.cover && typeof item.cover.url === 'string') {
			item.cover.url = this.buildFullUrl(item.cover.url, baseUrl);
		}

		// Transform icon URL
		if (item.icon && typeof item.icon === 'object' && 'url' in item.icon && typeof item.icon.url === 'string') {
			item.icon.url = this.buildFullUrl(item.icon.url, baseUrl);
		}

		// Transform images array URLs
		if (item.images && Array.isArray(item.images)) {
			item.images.forEach((img) => {
				if (img && typeof img === 'object' && 'url' in img && typeof img.url === 'string') {
					img.url = this.buildFullUrl(img.url, baseUrl);
				}
			});
		}

		// Recursively traverse nested relation objects
		Object.keys(item).forEach((key) => {
			const subVal = item[key];
			if (subVal && typeof subVal === 'object' && !['icon', 'cover', 'images'].includes(key)) {
				if (Array.isArray(subVal)) {
					subVal.forEach((subItem) => {
						if (subItem && typeof subItem === 'object') {
							this.processEntity(subItem as Record<string, unknown>, baseUrl);
						}
					});
				} else {
					this.processEntity(subVal as Record<string, unknown>, baseUrl);
				}
			}
		});
	}
}
