import { useState, useEffect, useCallback } from 'react';
import { memoryCache } from '@/lib/cache/memory-cache';
import { browserCache } from '@/lib/cache/browser-cache';

interface UseInfiniteQueryOptions<T> {
  queryKey: string;
  queryFn: (page: number) => Promise<T[]>;
  cacheTime?: number;
  storage?: 'memory' | 'browser';
  enabled?: boolean;
  pageSize?: number;
  onSuccess?: (data: T[]) => void;
  onError?: (error: Error) => void;
}

export function useInfiniteQuery<T>({
  queryKey,
  queryFn,
  cacheTime = 5 * 60 * 1000, // 5 minutes
  storage = 'memory',
  enabled = true,
  pageSize = 10,
  onSuccess,
  onError
}: UseInfiniteQueryOptions<T>) {
  const [data, setData] = useState<T[]>([]);
  const [error, setError] = useState<Error | null>(null);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);

  const cache = storage === 'browser' ? browserCache : memoryCache;

  const loadMore = useCallback(async () => {
    if (!enabled || loading || !hasMore) return;

    setLoading(true);
    try {
      // Try to get from cache first
      const cacheKey = `${queryKey}_page_${page}`;
      const cachedData = await cache.get<T[]>(cacheKey);

      if (cachedData) {
        setData(prev => [...prev, ...cachedData]);
        setPage(prev => prev + 1);
        setHasMore(cachedData.length === pageSize);
        onSuccess?.(cachedData);
      } else {
        const freshData = await queryFn(page);
        setData(prev => [...prev, ...freshData]);
        setPage(prev => prev + 1);
        setHasMore(freshData.length === pageSize);
        onSuccess?.(freshData);

        // Cache the fresh data
        await cache.set(cacheKey, freshData, cacheTime);
      }
    } catch (err) {
      setError(err instanceof Error ? err : new Error('An error occurred'));
      onError?.(err as Error);
    } finally {
      setLoading(false);
    }
  }, [page, enabled, loading, hasMore, queryKey, pageSize]);

  const refresh = async () => {
    setData([]);
    setPage(1);
    setHasMore(true);
    setError(null);
    await loadMore();
  };

  return {
    data,
    error,
    loading,
    hasMore,
    loadMore,
    refresh
  };
}