import { LRUCache } from "lru-cache";

interface RateLimitRecord {
  count: number;
  resetTime: number;
}

const rateLimitCache = new LRUCache<string, RateLimitRecord>({
  max: 500,
  ttl: 60000, // 1 minute
});

/**
 * Check if a request is within rate limit
 * @param identifier - Unique identifier for the client (e.g., user ID, IP)
 * @param limit - Maximum requests per window (default: 20)
 * @returns Object with allowed status, remaining requests, and reset time
 */
export function checkRateLimit(
  identifier: string,
  limit: number = 20
): { allowed: boolean; remaining: number; resetTime: number } {
  const now = Date.now();
  const record = rateLimitCache.get(identifier);

  if (!record || now >= record.resetTime) {
    rateLimitCache.set(identifier, {
      count: 1,
      resetTime: now + 60000,
    });
    return { allowed: true, remaining: limit - 1, resetTime: now + 60000 };
  }

  if (record.count >= limit) {
    return {
      allowed: false,
      remaining: 0,
      resetTime: record.resetTime,
    };
  }

  record.count++;
  rateLimitCache.set(identifier, record);
  return { allowed: true, remaining: limit - record.count, resetTime: record.resetTime };
}
