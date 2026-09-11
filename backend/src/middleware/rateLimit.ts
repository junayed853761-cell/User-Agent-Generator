import { Request, Response, NextFunction } from 'express';
import { rateLimitConfig } from '../config/rateLimits.js';

interface ClientHistory {
  timestamps: number[];
}

const memoryStore = new Map<string, ClientHistory>();

// Periodic cleanup of stale client history (every 5 minutes)
setInterval(() => {
  const now = Date.now();
  for (const [ip, history] of memoryStore.entries()) {
    history.timestamps = history.timestamps.filter((t) => now - t < 120000);
    if (history.timestamps.length === 0) {
      memoryStore.delete(ip);
    }
  }
}, 300000);

export function rateLimiter(tier: 'anonymous' | 'authenticated' | 'admin' = 'anonymous') {
  const config = rateLimitConfig[tier];

  return (req: Request, res: Response, next: NextFunction) => {
    const clientKey = (req.headers['x-forwarded-for'] as string) || req.ip || '127.0.0.1';
    const now = Date.now();

    let client = memoryStore.get(clientKey);
    if (!client) {
      client = { timestamps: [] };
      memoryStore.set(clientKey, client);
    }

    // Filter out timestamps outside window
    client.timestamps = client.timestamps.filter((t) => now - t < config.windowMs);

    if (client.timestamps.length >= config.maxRequests) {
      const resetInSeconds = Math.ceil((config.windowMs - (now - client.timestamps[0])) / 1000);
      res.setHeader('Retry-After', resetInSeconds);
      res.setHeader('X-RateLimit-Limit', config.maxRequests);
      res.setHeader('X-RateLimit-Remaining', 0);
      return res.status(429).json({
        error: {
          code: 'RATE_LIMIT_EXCEEDED',
          message: `Rate limit exceeded. Please retry after ${resetInSeconds} seconds.`,
        },
      });
    }

    client.timestamps.push(now);
    res.setHeader('X-RateLimit-Limit', config.maxRequests);
    res.setHeader('X-RateLimit-Remaining', config.maxRequests - client.timestamps.length);
    next();
  };
}
