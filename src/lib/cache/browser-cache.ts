import { createCache } from './cache-utils';

// Browser cache implementation using localStorage with TTL
const browserCache = createCache({
  storage: localStorage,
  prefix: 'inlits_browser_',
  defaultTTL: 24 * 60 * 60 * 1000 // 24 hours
});

export { browserCache };