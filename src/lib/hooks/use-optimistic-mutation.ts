import { useState } from 'react';
import { queryCache } from '@/lib/cache/query-cache';

interface MutationOptions<T, R> {
  mutationFn: (data?: T) => Promise<R>;
  onSuccess?: (data: R) => void;
  onError?: (error: Error) => void;
  onSettled?: () => void;
  optimisticUpdate?: () => void;
  rollbackUpdate?: () => void;
  invalidateQueries?: string[];
}

export function useOptimisticMutation<T = void, R = void>({
  mutationFn,
  onSuccess,
  onError,
  onSettled,
  optimisticUpdate,
  rollbackUpdate,
  invalidateQueries = []
}: MutationOptions<T, R>) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const mutate = async (data?: T) => {
    setLoading(true);
    setError(null);

    try {
      // Apply optimistic update if provided
      if (optimisticUpdate) {
        optimisticUpdate();
      }

      // Perform the actual mutation
      const result = await mutationFn(data);

      // Call success callback
      onSuccess?.(result);

      // Invalidate affected queries
      await Promise.all(
        invalidateQueries.map(queryKey => queryCache.invalidate(queryKey))
      );

      return result;
    } catch (err) {
      // Rollback optimistic update if provided
      if (rollbackUpdate) {
        rollbackUpdate();
      }

      const error = err instanceof Error ? err : new Error('An error occurred');
      setError(error);
      onError?.(error);
      throw error;
    } finally {
      setLoading(false);
      onSettled?.();
    }
  };

  return {
    mutate,
    loading,
    error
  };
}