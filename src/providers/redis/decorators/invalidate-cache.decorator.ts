import { applyDecorators, SetMetadata, UseInterceptors } from '@nestjs/common';
import { InvalidateCacheInterceptor } from '../interceptors';

export const INVALIDATE_CACHE_METADATA = 'invalidate_cache_metadata';

/**
 * Custom decorator to invalidate Redis cache patterns after successful mutation operations
 * @param patterns Array of string patterns to invalidate (e.g. 'cache:/products*')
 */
export const InvalidateCache = (...patterns: string[]) => {
	return applyDecorators(SetMetadata(INVALIDATE_CACHE_METADATA, patterns), UseInterceptors(InvalidateCacheInterceptor));
};
