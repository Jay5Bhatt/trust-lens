import { LRUCache } from "lru-cache";
import Redis from "ioredis";

let redisClient: Redis | null = null;
let lruCache: LRUCache<string, any> | null = null;

/**
 * Initialize cache - use Redis if REDIS_URL is provided, otherwise use LRU cache
 */
function initializeCache() {
  if (process.env.REDIS_URL) {
    try {
      redisClient = new Redis(process.env.REDIS_URL, {
        maxRetriesPerRequest: 3,
        retryStrategy: (times) => {
          if (times > 3) return null; // Stop retrying after 3 attempts
          return Math.min(times * 200, 2000);
        },
      });
      console.log("Cache: Using Redis");
      return;
    } catch (error) {
      console.warn("Cache: Redis initialization failed, falling back to LRU cache", error);
    }
  }

  // Fallback to LRU cache
  lruCache = new LRUCache<string, any>({
    max: 500, // Maximum number of items
    ttl: 1000 * 60 * 60 * 24, // 24 hours TTL
  });
  console.log("Cache: Using in-memory LRU cache");
}

// Initialize on module load
initializeCache();

/**
 * Get value from cache
 */
export async function getCache(key: string): Promise<any | null> {
  if (redisClient) {
    try {
      const value = await redisClient.get(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      console.error("Cache get error:", error);
      return null;
    }
  }

  if (lruCache) {
    return lruCache.get(key) ?? null;
  }

  return null;
}

/**
 * Set value in cache
 */
export async function setCache(key: string, value: any, ttlSeconds?: number): Promise<void> {
  if (redisClient) {
    try {
      const serialized = JSON.stringify(value);
      if (ttlSeconds) {
        await redisClient.setex(key, ttlSeconds, serialized);
      } else {
        await redisClient.set(key, serialized);
      }
      return;
    } catch (error) {
      console.error("Cache set error:", error);
      return;
    }
  }

  if (lruCache) {
    const ttl = ttlSeconds ? ttlSeconds * 1000 : undefined;
    lruCache.set(key, value, { ttl });
  }
}

/**
 * Delete value from cache
 */
export async function deleteCache(key: string): Promise<void> {
  if (redisClient) {
    try {
      await redisClient.del(key);
    } catch (error) {
      console.error("Cache delete error:", error);
    }
    return;
  }

  if (lruCache) {
    lruCache.delete(key);
  }
}

/**
 * Generate cache key for chunk search results
 */
export function getChunkCacheKey(chunkText: string): string {
  // Simple hash function for cache key
  let hash = 0;
  for (let i = 0; i < chunkText.length; i++) {
    const char = chunkText.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return `chunk:${Math.abs(hash).toString(36)}`;
}

/**
 * Generate cache key for similarity score
 */
export function getSimilarityCacheKey(chunkText: string, snippetText: string): string {
  let chunkHash = 0;
  let snippetHash = 0;
  for (let i = 0; i < chunkText.length; i++) {
    chunkHash = (chunkHash << 5) - chunkHash + chunkText.charCodeAt(i);
    chunkHash = chunkHash & chunkHash;
  }
  for (let i = 0; i < snippetText.length; i++) {
    snippetHash = (snippetHash << 5) - snippetHash + snippetText.charCodeAt(i);
    snippetHash = snippetHash & snippetHash;
  }
  return `similarity:${Math.abs(chunkHash).toString(36)}:${Math.abs(snippetHash).toString(36)}`;
}

/**
 * Generate cache key for AI detection
 */
export function getAICacheKey(text: string): string {
  // Use first 1000 chars for hash to avoid huge keys
  const sample = text.slice(0, 1000);
  let hash = 0;
  for (let i = 0; i < sample.length; i++) {
    hash = (hash << 5) - hash + sample.charCodeAt(i);
    hash = hash & hash;
  }
  return `ai:${Math.abs(hash).toString(36)}`;
}
