interface Storage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
  clear(): void;
}

interface CacheOptions {
  storage: Storage;
  prefix: string;
  defaultTTL: number;
}

interface CacheItem<T> {
  value: T;
  expiresAt: number;
}

export function createCache({ storage, prefix, defaultTTL }: CacheOptions) {
  function getFullKey(key: string): string {
    return `${prefix}${key}`;
  }

  return {
    async get<T>(key: string): Promise<T | null> {
      try {
        const fullKey = getFullKey(key);
        const item = storage.getItem(fullKey);
        
        if (!item) return null;
        
        const { value, expiresAt }: CacheItem<T> = JSON.parse(item);
        
        if (Date.now() > expiresAt) {
          storage.removeItem(fullKey);
          return null;
        }
        
        return value;
      } catch (error) {
        console.error('Cache get error:', error);
        return null;
      }
    },

    async set<T>(key: string, value: T, ttl: number = defaultTTL): Promise<void> {
      try {
        const item: CacheItem<T> = {
          value,
          expiresAt: Date.now() + ttl
        };
        storage.setItem(getFullKey(key), JSON.stringify(item));
      } catch (error) {
        console.error('Cache set error:', error);
      }
    },

    async remove(key: string): Promise<void> {
      try {
        storage.removeItem(getFullKey(key));
      } catch (error) {
        console.error('Cache remove error:', error);
      }
    },

    async clear(): Promise<void> {
      try {
        storage.clear();
      } catch (error) {
        console.error('Cache clear error:', error);
      }
    }
  };
}