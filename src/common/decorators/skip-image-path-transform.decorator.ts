import { SetMetadata } from '@nestjs/common';

export const SKIP_IMAGE_PATH_TRANSFORM_KEY = 'skipImagePathTransform';

/**
 * Custom decorator to disable image path resolution on specific endpoints.
 */
export const SkipImagePathTransform = () => SetMetadata(SKIP_IMAGE_PATH_TRANSFORM_KEY, true);
