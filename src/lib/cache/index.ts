export * from './browser-cache';
export * from './memory-cache';

// Register service worker
export async function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.register(
        '/service-worker.js',
        { scope: '/' }
      );
      console.log('ServiceWorker registered:', registration);
    } catch (error) {
      console.error('ServiceWorker registration failed:', error);
    }
  }
}

// Initialize caching system
export function initializeCache() {
  registerServiceWorker();
}