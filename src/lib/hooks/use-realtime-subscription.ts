import { useEffect } from 'react';
import { supabase } from '../supabase';

interface UseRealtimeSubscriptionOptions {
  table: string;
  event?: 'INSERT' | 'UPDATE' | 'DELETE' | '*';
  filter?: string;
  enabled?: boolean;
  onData?: (payload: any) => void;
  onError?: (error: Error) => void;
}

export function useRealtimeSubscription(options: UseRealtimeSubscriptionOptions) {
  useEffect(() => {
    if (!options.enabled) return;

    // Create channel with unique name
    const channel = supabase.channel(`${options.table}-${Date.now()}`)
      .on(
        'postgres_changes',
        {
          event: options.event || '*',
          schema: 'public',
          table: options.table,
          filter: options.filter
        },
        (payload) => {
          try {
            options.onData?.(payload);
          } catch (error) {
            options.onError?.(error as Error);
          }
        }
      )
      .subscribe((status) => {
        if (status === 'CHANNEL_ERROR') {
          options.onError?.(new Error('Failed to subscribe to changes'));
        }
      });

    // Cleanup subscription
    return () => {
      supabase.removeChannel(channel);
    };
  }, [
    options.table,
    options.event,
    options.filter,
    options.enabled,
    options.onData,
    options.onError
  ]);
}