import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';

/**
 * Mark a route as publicly accessible — no JWT required and
 * no maintenance-mode block applied.
 */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
