import { useState, useCallback } from 'react';
import { queryCache } from '@/lib/cache/query-cache';

interface OptimisticListOptions<T> {
  queryKey: string;
  initialData?: T[];
  idField?: keyof T;
}

export function useOptimisticList<T>({
  queryKey,
  initialData = [],
  idField = 'id' as keyof T
}: OptimisticListOptions<T>) {
  const [items, setItems] = useState<T[]>(initialData);

  const addItem = useCallback(async (
    newItem: T,
    addFn: (item: T) => Promise<T>
  ) => {
    // Add item optimistically
    setItems(prev => [...prev, newItem]);

    try {
      // Perform actual API call
      const result = await addFn(newItem);
      
      // Update with actual data
      setItems(prev => 
        prev.map(item => 
          item[idField] === newItem[idField] ? result : item
        )
      );

      // Invalidate related queries
      await queryCache.invalidate(queryKey);

      return result;
    } catch (error) {
      // Rollback on error
      setItems(prev => 
        prev.filter(item => item[idField] !== newItem[idField])
      );
      throw error;
    }
  }, [queryKey, idField]);

  const updateItem = useCallback(async (
    updatedItem: T,
    updateFn: (item: T) => Promise<T>
  ) => {
    // Store previous state
    const previousItems = [...items];

    // Update optimistically
    setItems(prev =>
      prev.map(item =>
        item[idField] === updatedItem[idField] ? updatedItem : item
      )
    );

    try {
      // Perform actual API call
      const result = await updateFn(updatedItem);
      
      // Update with actual data
      setItems(prev =>
        prev.map(item =>
          item[idField] === updatedItem[idField] ? result : item
        )
      );

      // Invalidate related queries
      await queryCache.invalidate(queryKey);

      return result;
    } catch (error) {
      // Rollback on error
      setItems(previousItems);
      throw error;
    }
  }, [items, queryKey, idField]);

  const removeItem = useCallback(async (
    itemToRemove: T,
    removeFn: (item: T) => Promise<void>
  ) => {
    // Store previous state
    const previousItems = [...items];

    // Remove optimistically
    setItems(prev =>
      prev.filter(item => item[idField] !== itemToRemove[idField])
    );

    try {
      // Perform actual API call
      await removeFn(itemToRemove);

      // Invalidate related queries
      await queryCache.invalidate(queryKey);
    } catch (error) {
      // Rollback on error
      setItems(previousItems);
      throw error;
    }
  }, [items, queryKey, idField]);

  const reorderItems = useCallback(async (
    newOrder: T[],
    reorderFn: (items: T[]) => Promise<void>
  ) => {
    // Store previous state
    const previousItems = [...items];

    // Update optimistically
    setItems(newOrder);

    try {
      // Perform actual API call
      await reorderFn(newOrder);

      // Invalidate related queries
      await queryCache.invalidate(queryKey);
    } catch (error) {
      // Rollback on error
      setItems(previousItems);
      throw error;
    }
  }, [items, queryKey]);

  return {
    items,
    addItem,
    updateItem,
    removeItem,
    reorderItems,
    setItems
  };
}