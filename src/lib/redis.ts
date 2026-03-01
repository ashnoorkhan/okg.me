import { Redis } from '@upstash/redis';

// Only instantiate Redis if the environment variables are available
const requiredEnvs = ['UPSTASH_REDIS_REST_URL', 'UPSTASH_REDIS_REST_TOKEN'];
const hasRedisEnvs = requiredEnvs.every((env) => Boolean(process.env[env]) && !process.env[env]?.includes('upstash-redis-'));

// Global cache to prevent multiple instances in development
const globalForRedis = global as unknown as { redis: Redis | null };

export const redis = globalForRedis.redis || (hasRedisEnvs
    ? new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL!,
        token: process.env.UPSTASH_REDIS_REST_TOKEN!,
    })
    : null);

if (process.env.NODE_ENV !== 'production') {
    globalForRedis.redis = redis;
}
