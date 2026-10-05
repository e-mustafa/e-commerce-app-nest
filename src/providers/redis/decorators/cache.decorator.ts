import { applyDecorators, SetMetadata, UseInterceptors } from '@nestjs/common';
import { CacheInterceptor } from '../interceptors';

// Constant key to register TTL metadata
export const CACHE_TTL_METADATA = 'cache_ttl_metadata';

/**
 * Custom cache decorator to enable HTTP caching on specific endpoints
 * @param ttl Optional custom Time-To-Live in seconds
 */
export const Cache = (ttl?: number) => {
	return applyDecorators(SetMetadata(CACHE_TTL_METADATA, ttl), UseInterceptors(CacheInterceptor));
};
