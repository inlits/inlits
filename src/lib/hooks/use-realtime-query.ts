import { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import { realtimeManager } from '../supabase/realtime';
import { useOptimisticState } from './use-optimistic-state';

interface UseRealtimeQueryOptions<T> {
  table: string;
  select?: string;
  filter?: Record<string, any>;
  orderBy?: { column: string; ascending?: boolean };
  limit?: number;
  enabled?: boolean;
}

export function useRealtimeQuery<T extends { id: string }>(
  options: UseRealtimeQueryOptions<T>
) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { state: data, update: setData } = useOptimisticState<T[]>({
    queryKey: `${options.table}-list`,
    initialState: []
  });

  useEffect(() => {
    if (!options.enabled) return;

    const loadData = async () => {
      try {
        setLoading(true);
        let query = supabase
          .from(options.table)
          .select(options.select || '*');

        if (options.filter) {
          Object.entries(options.filter).forEach(([key, value]) => {
            query = query.eq(key, value);
          });
        }

        if (options.orderBy) {
          query = query.order(options.orderBy.column, {
            ascending: options.orderBy.ascending
          });
        }

        if (options.limit) {
          query = query.limit(options.limit);
        }

        const { data: initialData, error } = await query;

        if (error) throw error;
        setData(initialData as T[]);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to load data'));
      } finally {
        setLoading(false);
      }
    };

    loadData();

    // Subscribe to real-time updates
    const cleanup = realtimeManager.subscribe(
      {
        table: options.table,
        event: '*'
      },
      {
        onData: (payload: any) => {
          setData(current => {
            const newData = [...current];
            const index = newData.findIndex(item => item.id === payload.id);

            if (payload.eventType === 'INSERT' && index === -1) {
              return [...newData, payload.new];
            }

            if (payload.eventType === 'UPDATE' && index !== -1) {
              newData[index] = { ...newData[index], ...payload.new };
              return [...newData];
            }

            if (payload.eventType === 'DELETE' && index !== -1) {
              return newData.filter(item => item.id !== payload.id);
            }

            return newData;
          });
        },
        onError: (err) => {
          console.error('Subscription error:', err);
          setError(err);
        }
      }
    );

    return cleanup;
  }, [
    options.table,
    options.select,
    JSON.stringify(options.filter),
    JSON.stringify(options.orderBy),
    options.limit,
    options.enabled
  ]);

  return {
    data,
    loading,
    error,
    refetch: () => {
      setLoading(true);
      setError(null);
      // Re-run the effect
      const event = new Event('refetch');
      window.dispatchEvent(event);
    }
  };
}