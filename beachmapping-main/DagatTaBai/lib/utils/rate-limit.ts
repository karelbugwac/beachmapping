import { NextRequest, NextResponse } from 'next/server';

interface RateLimitBucket {
  count: number;
  resetAt: number;
}

export interface RateLimitOptions {
  keyPrefix: string;
  maxRequests: number;
  windowMs: number;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetInSeconds: number;
  headers: Record<string, string>;
}

const globalForRateLimit = globalThis as unknown as {
  __dagatRateLimitBuckets?: Map<string, RateLimitBucket>;
};

const buckets =
  globalForRateLimit.__dagatRateLimitBuckets ??
  (globalForRateLimit.__dagatRateLimitBuckets = new Map<string, RateLimitBucket>());

function getClientIp(req?: NextRequest | Request): string {
  if (!req) return 'global';
  const forwarded = req.headers.get('x-forwarded-for');
  if (forwarded) {
    const first = forwarded.split(',')[0]?.trim();
    if (first) return first;
  }
  const realIp = req.headers.get('x-real-ip')?.trim();
  if (realIp) return realIp;
  return '127.0.0.1';
}

export function getClientRateLimitKey(
  req: NextRequest | Request | undefined,
  keyPrefix: string,
  extraIdentifier?: string
): string {
  const clientIp = getClientIp(req);
  const suffix = extraIdentifier ? `:${extraIdentifier.trim().toLowerCase()}` : '';
  return `${keyPrefix}:${clientIp}${suffix}`;
}

export function peekRateLimit(
  bucketKey: string,
  options: Pick<RateLimitOptions, 'maxRequests' | 'windowMs'>
): RateLimitResult {
  const now = Date.now();
  const existing = buckets.get(bucketKey);

  if (!existing || existing.resetAt <= now) {
    const resetInSeconds = Math.ceil(options.windowMs / 1000);
    return {
      allowed: true,
      remaining: options.maxRequests,
      resetInSeconds,
      headers: {
        'X-RateLimit-Limit': String(options.maxRequests),
        'X-RateLimit-Remaining': String(options.maxRequests),
        'X-RateLimit-Reset': String(resetInSeconds),
      },
    };
  }

  const resetInSeconds = Math.max(1, Math.ceil((existing.resetAt - now) / 1000));
  const remaining = Math.max(0, options.maxRequests - existing.count);
  const allowed = existing.count < options.maxRequests;

  return {
    allowed,
    remaining,
    resetInSeconds,
    headers: {
      'X-RateLimit-Limit': String(options.maxRequests),
      'X-RateLimit-Remaining': String(remaining),
      'X-RateLimit-Reset': String(resetInSeconds),
      ...(allowed ? {} : { 'Retry-After': String(resetInSeconds) }),
    },
  };
}

export function recordRateLimitHit(
  bucketKey: string,
  options: Pick<RateLimitOptions, 'maxRequests' | 'windowMs'>
): RateLimitResult {
  const now = Date.now();
  if (buckets.size > 2000) {
    for (const [key, entry] of buckets.entries()) {
      if (entry.resetAt <= now) {
        buckets.delete(key);
      }
    }
  }

  const existing = buckets.get(bucketKey);
  if (!existing || existing.resetAt <= now) {
    const resetAt = now + options.windowMs;
    buckets.set(bucketKey, { count: 1, resetAt });
    const resetInSeconds = Math.ceil(options.windowMs / 1000);
    return {
      allowed: 1 < options.maxRequests,
      remaining: Math.max(0, options.maxRequests - 1),
      resetInSeconds,
      headers: {
        'X-RateLimit-Limit': String(options.maxRequests),
        'X-RateLimit-Remaining': String(Math.max(0, options.maxRequests - 1)),
        'X-RateLimit-Reset': String(resetInSeconds),
      },
    };
  }

  existing.count += 1;
  const resetInSeconds = Math.max(1, Math.ceil((existing.resetAt - now) / 1000));
  const remaining = Math.max(0, options.maxRequests - existing.count);
  const allowed = existing.count < options.maxRequests;

  return {
    allowed,
    remaining,
    resetInSeconds,
    headers: {
      'X-RateLimit-Limit': String(options.maxRequests),
      'X-RateLimit-Remaining': String(remaining),
      'X-RateLimit-Reset': String(resetInSeconds),
      ...(allowed ? {} : { 'Retry-After': String(resetInSeconds) }),
    },
  };
}

export function clearRateLimit(bucketKey: string): void {
  buckets.delete(bucketKey);
}

export function checkRateLimit(
  req: NextRequest | Request | undefined,
  options: RateLimitOptions
): RateLimitResult {
  const now = Date.now();

  // Periodic cleanup of expired buckets
  if (buckets.size > 2000) {
    for (const [key, entry] of buckets.entries()) {
      if (entry.resetAt <= now) {
        buckets.delete(key);
      }
    }
  }

  const clientIp = getClientIp(req);
  const bucketKey = `${options.keyPrefix}:${clientIp}`;
  const existing = buckets.get(bucketKey);

  if (!existing || existing.resetAt <= now) {
    const resetAt = now + options.windowMs;
    buckets.set(bucketKey, { count: 1, resetAt });
    const resetInSeconds = Math.ceil(options.windowMs / 1000);
    return {
      allowed: true,
      remaining: Math.max(0, options.maxRequests - 1),
      resetInSeconds,
      headers: {
        'X-RateLimit-Limit': String(options.maxRequests),
        'X-RateLimit-Remaining': String(Math.max(0, options.maxRequests - 1)),
        'X-RateLimit-Reset': String(resetInSeconds),
      },
    };
  }

  existing.count += 1;
  const resetInSeconds = Math.max(1, Math.ceil((existing.resetAt - now) / 1000));
  const remaining = Math.max(0, options.maxRequests - existing.count);
  const allowed = existing.count <= options.maxRequests;

  return {
    allowed,
    remaining,
    resetInSeconds,
    headers: {
      'X-RateLimit-Limit': String(options.maxRequests),
      'X-RateLimit-Remaining': String(remaining),
      'X-RateLimit-Reset': String(resetInSeconds),
      ...(allowed ? {} : { 'Retry-After': String(resetInSeconds) }),
    },
  };
}

export function rateLimitExceededResponse(
  result: RateLimitResult,
  message = 'Too many requests. Please wait a moment and try again.'
) {
  return NextResponse.json(
    { error: message, retryAfterSeconds: result.resetInSeconds },
    { status: 429, headers: result.headers }
  );
}

