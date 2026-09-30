import { SetMetadata } from '@nestjs/common';

// Key used to store optional auth metadata
export const IS_OPTIONAL_AUTH_KEY = 'isOptionalAuth';

// Custom decorator to bypass strict authentication when applied to route handlers
export const OptionalAuth = () => SetMetadata(IS_OPTIONAL_AUTH_KEY, true);
