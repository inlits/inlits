import { useState, useCallback } from 'react';
import { queryCache } from '@/lib/cache/query-cache';

interface OptimisticStateOptions<T> {
  queryKey: string;
  initialState: T;
}

export function useOptimisticState<T>({
  queryKey,
  initialState
}: OptimisticStateOptions<T>) {
  const [state, setState] = useState<T>(initialState);
  const [previousState, setPreviousState] = useState<T>(initialState);

  const update = useCallback(async (
    newState: T,
    updateFn: (state: T) => Promise<T>
  ) => {
    // Store current state
    setPreviousState(state);

    // Update optimistically
    setState(newState);

    try {
      // Perform actual API call
      const result = await updateFn(newState);
      
      // Update with actual data
      setState(result);

      // Invalidate related queries
      await queryCache.invalidate(queryKey);

      return result;
    } catch (error) {
      // Rollback on error
      setState(previousState);
      throw error;
    }
  }, [state, previousState, queryKey]);

  return {
    state,
    update
  };
}