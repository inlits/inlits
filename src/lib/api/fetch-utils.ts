import { queryCache } from '@/lib/cache/query-cache';
import { supabase } from '@/lib/supabase';

interface FetchOptions {
  cacheKey?: string;
  cacheTTL?: number;
  cacheStorage?: 'memory' | 'browser';
  skipCache?: boolean;
}

export async function fetchWithCache<T>(
  fetcher: () => Promise<T>,
  options: FetchOptions = {}
): Promise<T> {
  const {
    cacheKey,
    cacheTTL,
    cacheStorage = 'memory',
    skipCache = false
  } = options;

  // If no cache key or skip cache, just fetch
  if (!cacheKey || skipCache) {
    return fetcher();
  }

  // Try to get from cache first
  const cached = await queryCache.get<T>({ 
    key: cacheKey,
    storage: cacheStorage 
  });

  if (cached !== null) {
    return cached;
  }

  // If not in cache, fetch and cache
  const data = await fetcher();
  await queryCache.set({ 
    key: cacheKey,
    ttl: cacheTTL,
    storage: cacheStorage 
  }, data);

  return data;
}

// Cache invalidation triggers
export const invalidateQueries = {
  profile: async (userId: string) => {
    await queryCache.invalidate(`profile:${userId}`);
  },
  content: async (contentId: string) => {
    await queryCache.invalidate(`content:${contentId}`);
  },
  contentList: async () => {
    await queryCache.invalidate('content:list');
  },
  followers: async (userId: string) => {
    await queryCache.invalidate(`followers:${userId}`);
  }
};

// Prefetch common routes data
export const prefetchRouteData = {
  home: async () => {
    const cacheKey = 'content:list';
    const { data } = await supabase
      .from('articles')
      .select('*')
      .limit(12)
      .order('created_at', { ascending: false });

    if (data) {
      await queryCache.set({ 
        key: cacheKey,
        storage: 'memory',
        ttl: 5 * 60 * 1000 // 5 minutes
      }, data);
    }
  },

  profile: async (userId: string) => {
    const cacheKey = `profile:${userId}`;
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (data) {
      await queryCache.set({
        key: cacheKey,
        storage: 'browser',
        ttl: 30 * 60 * 1000 // 30 minutes
      }, data);
    }
  }
};