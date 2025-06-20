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

// Add Content Security Policy
const meta = document.createElement('meta');
meta.httpEquiv = 'Content-Security-Policy';
meta.content = `
  default-src 'self';
  script-src 'self' https://www.googletagmanager.com;
  style-src 'self' 'unsafe-inline';
  img-src 'self' https://source.unsplash.com https://images.pexels.com https://*.supabase.co data:;
  font-src 'self';
  connect-src 'self' https://*.supabase.co https://www.google-analytics.com;
  media-src 'self' https://*.supabase.co;
  frame-src 'self';
  object-src 'none';
  base-uri 'self';
  form-action 'self';
  frame-ancestors 'none';
  block-all-mixed-content;
  upgrade-insecure-requests;
`.replace(/\s+/g, ' ').trim();
document.head.appendChild(meta);

// Add security headers
const securityHeaders = [
  { name: 'X-Content-Type-Options', value: 'nosniff' },
  { name: 'X-Frame-Options', value: 'DENY' },
  { name: 'X-XSS-Protection', value: '1; mode=block' },
  { name: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { name: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' }
];

// These headers can't actually be set client-side, but we're showing what should be set server-side
console.info('Security headers that should be set on the server:', securityHeaders);

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