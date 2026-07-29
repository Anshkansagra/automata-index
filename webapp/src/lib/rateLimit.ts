import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

// 100 requests per 60s per IP — generous enough for normal browsing
// (including Next.js link-prefetch traffic) while still blocking
// scraping/abuse bursts. Applies site-wide via the proxy.
export const rateLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(100, "60 s"),
  prefix: "cortexa-ratelimit",
  analytics: true,
});

// Separate bucket for the public API (keyed per API key, not per IP) — a
// generous but bounded quota for the free tier, independent of the
// site-wide per-IP limit above so a legitimate API consumer sharing an
// egress IP with other traffic isn't unfairly throttled.
export const apiKeyRateLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(60, "60 s"),
  prefix: "cortexa-api-ratelimit",
  analytics: true,
});
