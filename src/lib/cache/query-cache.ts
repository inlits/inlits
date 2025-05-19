import { memoryCache } from './memory-cache';
import { browserCache } from './browser-cache';

interface QueryCacheOptions {
  key: string;
  ttl?: number;
  storage?: 'memory' | 'browser';
}

export const queryCache = {
  async get<T>(options: QueryCacheOptions): Promise<T | null> {
    const cache = options.storage === 'browser' ? browserCache : memoryCache;
    return cache.get<T>(options.key);
  },

  async set<T>(options: QueryCacheOptions, data: T): Promise<void> {
    const cache = options.storage === 'browser' ? browserCache : memoryCache;
    return cache.set(options.key, data, options.ttl);
  },

  async invalidate(key: string): Promise<void> {
    await Promise.all([
      memoryCache.remove(key),
      browserCache.remove(key)
    ]);
  },

  async clear(): Promise<void> {
    await Promise.all([
      memoryCache.clear(),
      browserCache.clear()
    ]);
  }
};