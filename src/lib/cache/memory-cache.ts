import { createCache } from './cache-utils';

// In-memory cache implementation
const memoryStore = new Map<string, string>();
const memoryCache = createCache({
  storage: {
    getItem: (key: string) => memoryStore.get(key) || null,
    setItem: (key: string, value: string) => memoryStore.set(key, value),
    removeItem: (key: string) => memoryStore.delete(key),
    clear: () => memoryStore.clear()
  },
  prefix: 'inlits_memory_',
  defaultTTL: 5 * 60 * 1000 // 5 minutes
});

export { memoryCache };