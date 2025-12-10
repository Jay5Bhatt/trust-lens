import { LRUCache } from "lru-cache";
import type { Redis as RedisType } from "ioredis";

let redisClient: RedisType | null = null;
let lruCache: LRUCache<string, any> | null = null;
let cacheInitialized = false;
let cacheInitializing: Promise<void> | null = null;

/**
 * Initialize cache - use Redis if REDIS_URL is provided, otherwise use LRU cache
 * Lazy-loaded to prevent import-time errors
 * NEVER throws - always fails gracefully
 */
async function initializeCache(): Promise<void> {
  if (cacheInitialized) {
    return;
  }

  // If already initializing, wait for it
  if (cacheInitializing) {
    try {
      await cacheInitializing;
    } catch (error) {
      // Ignore errors from previous initialization attempt
      console.warn("Cache: Previous initialization had errors", error);
    }
    return;
  }

  // Start initialization
  cacheInitializing = (async () => {
    try {
      if (process.env.REDIS_URL) {
        try {
          // Use dynamic import to avoid ESM import issues
          const RedisModule = await import("ioredis");
          // Use unknown intermediate type as TypeScript requires
          const Redis = (RedisModule.default || RedisModule) as unknown as new (url: string, options?: any) => RedisType;
          
          // Create Redis client with timeout protection
          redisClient = new Redis(process.env.REDIS_URL, {
            maxRetriesPerRequest: 3,
            retryStrategy: (times) => {
              if (times > 3) return null; // Stop retrying after 3 attempts
              return Math.min(times * 200, 2000);
            },
            connectTimeout: 5000, // 5 second connection timeout
            enableReadyCheck: true,
            enableOfflineQueue: false, // Don't queue commands if offline
          }) as RedisType;
          
          // Test connection with timeout using ping
          await Promise.race([
            redisClient.ping(),
            new Promise((_, reject) => 
              setTimeout(() => reject(new Error("Redis connection timeout")), 5000)
            )
          ]);
          
          console.log("Cache: Using Redis");
          cacheInitialized = true;
          cacheInitializing = null;
          return;
        } catch (redisError) {
          // Redis failed, clean up and fall through to LRU cache
          console.warn("Cache: Redis initialization failed, falling back to LRU cache", redisError);
          redisClient = null;
          // Don't return here - fall through to LRU cache initialization
        }
      }
    } catch (error) {
      // Catch any unexpected errors during initialization
      console.error("Cache: Unexpected error during initialization", error);
      redisClient = null;
    }

    // Fallback to LRU cache (always succeeds)
    try {
      lruCache = new LRUCache<string, any>({
        max: 100, // Maximum number of items (reduced from 500 to save memory)
        ttl: 1000 * 60 * 60 * 24, // 24 hours TTL
      });
      console.log("Cache: Using in-memory LRU cache");
    } catch (lruError) {
      // Even LRU cache failed - log but continue
      console.error("Cache: LRU cache initialization failed", lruError);
    }

    cacheInitialized = true;
    cacheInitializing = null;
  })();

  await cacheInitializing;
}

/**
 * Get value from cache
 */
export async function getCache(key: string): Promise<any | null> {
  try {
    await initializeCache(); // Lazy initialization
  } catch (error) {
    // Initialization failed, but continue with null return
    console.warn("Cache: Initialization error in getCache", error);
  }
  
  if (redisClient) {
    try {
      const value = await redisClient.get(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      console.error("Cache get error:", error);
      // Fall through to LRU cache
    }
  }

  if (lruCache) {
    try {
      return lruCache.get(key) ?? null;
    } catch (error) {
      console.error("Cache LRU get error:", error);
      return null;
    }
  }

  return null;
}

/**
 * Set value in cache
 */
export async function setCache(key: string, value: any, ttlSeconds?: number): Promise<void> {
  try {
    await initializeCache(); // Lazy initialization
  } catch (error) {
    // Initialization failed, but continue
    console.warn("Cache: Initialization error in setCache", error);
  }
  
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
      // Fall through to LRU cache
    }
  }

  if (lruCache) {
    try {
      const ttl = ttlSeconds ? ttlSeconds * 1000 : undefined;
      lruCache.set(key, value, { ttl });
    } catch (error) {
      console.error("Cache LRU set error:", error);
    }
  }
}

/**
 * Delete value from cache
 */
export async function deleteCache(key: string): Promise<void> {
  try {
    await initializeCache(); // Lazy initialization
  } catch (error) {
    // Initialization failed, but continue
    console.warn("Cache: Initialization error in deleteCache", error);
  }
  
  if (redisClient) {
    try {
      await redisClient.del(key);
    } catch (error) {
      console.error("Cache delete error:", error);
      // Fall through to LRU cache
    }
  }

  if (lruCache) {
    try {
      lruCache.delete(key);
    } catch (error) {
      console.error("Cache LRU delete error:", error);
    }
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
