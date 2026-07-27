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
