import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { observeLinks, prefetchLikelyRoutes } from './lib/route-prefetcher';
import App from './App.tsx';
import './index.css';

// Polyfill requestIdleCallback for older browsers
const requestIdleCallback = 
  window.requestIdleCallback || 
  ((cb: IdleRequestCallback) => setTimeout(cb, 1));

// Add global error handler for network issues
window.addEventListener('error', (event) => {
  if (event.message.includes('network') || 
      event.message.includes('connection') ||
      event.message.includes('fetch') ||
      event.message.includes('xhr')) {
    console.error('Network error detected:', event.message);
    // Dispatch custom event that our error boundary can listen for
    window.dispatchEvent(new CustomEvent('network:error', { 
      detail: { message: event.message }
    }));
  }
});

// Add unhandled promise rejection handler
window.addEventListener('unhandledrejection', (event) => {
  const message = event.reason?.message || String(event.reason);
  if (message.includes('network') || 
      message.includes('connection') ||
      message.includes('fetch') ||
      message.includes('xhr')) {
    console.error('Network promise rejection detected:', message);
    // Dispatch custom event that our error boundary can listen for
    window.dispatchEvent(new CustomEvent('network:error', { 
      detail: { message }
    }));
  }
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);

// Start observing links for prefetching
observeLinks();

// Prefetch likely routes after initial render
requestIdleCallback(() => {
  prefetchLikelyRoutes();
});