export interface RateLimitTier {
  windowMs: number;
  maxRequests: number;
}

export const rateLimitConfig: {
  anonymous: RateLimitTier;
  authenticated: RateLimitTier;
  admin: RateLimitTier;
} = {
  anonymous: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 60, // 60 requests per minute
  },
  authenticated: {
    windowMs: 60 * 1000,
    maxRequests: 300,
  },
  admin: {
    windowMs: 60 * 1000,
    maxRequests: 1200,
  },
};
