import { useState, useEffect } from 'react';
import { memoryCache } from '@/lib/cache/memory-cache';
import { browserCache } from '@/lib/cache/browser-cache';

interface UseCachedQueryOptions<T> {
  queryKey: string;
  queryFn: () => Promise<T>;
  cacheTime?: number;
  staleTime?: number;
  storage?: 'memory' | 'browser';
  enabled?: boolean;
  onSuccess?: (data: T) => void;
  onError?: (error: Error) => void;
}

export function useCachedQuery<T>({
  queryKey,
  queryFn,
  cacheTime = 5 * 60 * 1000, // 5 minutes
  staleTime = 0,
  storage = 'memory',
  enabled = true,
  onSuccess,
  onError
}: UseCachedQueryOptions<T>) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [loading, setLoading] = useState(true);
  const [isStale, setIsStale] = useState(false);

  const cache = storage === 'browser' ? browserCache : memoryCache;

  useEffect(() => {
    let mounted = true;
    let staleTimeout: NodeJS.Timeout;

    const fetchData = async () => {
      if (!enabled) {
        setLoading(false);
        return;
      }

      try {
        // Try to get from cache first
        const cachedData = await cache.get<T>(queryKey);
        
        if (cachedData) {
          setData(cachedData);
          setLoading(false);
          onSuccess?.(cachedData);

          // Set stale timeout
          if (staleTime > 0) {
            staleTimeout = setTimeout(() => {
              setIsStale(true);
            }, staleTime);
          }
        }

        // If no cache or data is stale, fetch fresh data
        if (!cachedData || isStale) {
          const freshData = await queryFn();
          
          if (mounted) {
            setData(freshData);
            setError(null);
            onSuccess?.(freshData);
            
            // Cache the fresh data
            await cache.set(queryKey, freshData, cacheTime);
          }
        }
      } catch (err) {
        if (mounted) {
          setError(err instanceof Error ? err : new Error('An error occurred'));
          onError?.(err as Error);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    fetchData();

    return () => {
      mounted = false;
      clearTimeout(staleTimeout);
    };
  }, [queryKey, enabled, isStale]);

  const refetch = async () => {
    setLoading(true);
    try {
      const freshData = await queryFn();
      setData(freshData);
      setError(null);
      onSuccess?.(freshData);
      await cache.set(queryKey, freshData, cacheTime);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('An error occurred'));
      onError?.(err as Error);
    } finally {
      setLoading(false);
    }
  };

  return { data, error, loading, refetch };
}