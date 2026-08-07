import "server-only";

/**
 * Fixed-window per-identity rate limiter.
 *
 * IMPORTANT — this is in-memory and therefore per-instance. On a serverless
 * deployment each cold start gets its own empty map, so the effective limit is
 * (limit x instances). It is a cost guardrail against a single client hammering
 * the route, not a security boundary.
 *
 * Phase 6/7 replaces the store with Firestore or Upstash so the window is
 * shared across instances. The interface below is what that swap targets.
 */

interface Window {
  count: number;
  resetAt: number;
}

const windows = new Map<string, Window>();

/** Bounds memory if a deployment stays warm and sees many distinct identities. */
const MAX_TRACKED = 10_000;

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  retryAfterMs: number;
}

export const rateLimit = (
  identity: string,
  limit: number,
  windowMs: number,
): RateLimitResult => {
  const now = Date.now();
  const existing = windows.get(identity);

  if (existing === undefined || now >= existing.resetAt) {
    if (windows.size >= MAX_TRACKED) {
      for (const [key, window] of windows) {
        if (now >= window.resetAt) windows.delete(key);
      }
      // Still full after clearing expired entries — drop everything rather than
      // grow without bound. Worst case a few clients get a fresh window.
      if (windows.size >= MAX_TRACKED) windows.clear();
    }

    windows.set(identity, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: limit - 1, retryAfterMs: 0 };
  }

  if (existing.count >= limit) {
    return {
      allowed: false,
      remaining: 0,
      retryAfterMs: existing.resetAt - now,
    };
  }

  existing.count += 1;
  return {
    allowed: true,
    remaining: limit - existing.count,
    retryAfterMs: 0,
  };
};

/**
 * Best-effort caller identity.
 *
 * Falls back to IP because there is no auth until Phase 6. IP is spoofable via
 * `x-forwarded-for` unless the platform overwrites it, so this is a throttle,
 * not an identity check. Phase 6 swaps this for the verified Firebase uid.
 */
export const requestIdentity = (request: Request): string => {
  const forwarded = request.headers.get("x-forwarded-for");
  const first = forwarded?.split(",")[0]?.trim();
  return first || request.headers.get("x-real-ip") || "anonymous";
};
