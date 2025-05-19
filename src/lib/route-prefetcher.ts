import { prefetchRouteData } from '@/lib/api/fetch-utils';

// Routes that should be prefetched
const PREFETCH_ROUTES = [
  { path: '/', prefetch: prefetchRouteData.home },
  { path: '/profile', prefetch: () => prefetchRouteData.profile('current') }
];

// Prefetch data for visible links
const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      const link = entry.target as HTMLAnchorElement;
      const route = PREFETCH_ROUTES.find(r => r.path === link.pathname);
      if (route) {
        route.prefetch().catch(console.error);
        observer.unobserve(link);
      }
    }
  });
}, {
  rootMargin: '50px'
});

/**
 * Start observing links for prefetching
 */
export function observeLinks(): void {
  const links = document.querySelectorAll('a');
  links.forEach(link => {
    if (PREFETCH_ROUTES.some(route => route.path === link.pathname)) {
      observer.observe(link);
    }
  });
}

/**
 * Stop observing links and clean up
 */
export function stopObservingLinks(): void {
  observer.disconnect();
}

/**
 * Prefetch routes that are likely to be visited next
 * based on current route and user behavior patterns
 */
export function prefetchLikelyRoutes(): void {
  // Get current route
  const currentPath = window.location.pathname;

  // Define route relationships
  const relatedRoutes: Record<string, string[]> = {
    '/': ['/library', '/quick-bites', '/followed'],
    '/library': ['/reader', '/player'],
    '/profile': ['/settings', '/history'],
    '/creator': ['/dashboard']
  };

  // Find related routes to current path
  const routesToPrefetch = Object.entries(relatedRoutes)
    .filter(([base]) => currentPath.startsWith(base))
    .flatMap(([, routes]) => routes);

  // Prefetch related routes during idle time
  if ('requestIdleCallback' in window) {
    requestIdleCallback(() => {
      routesToPrefetch.forEach(route => {
        const prefetchRoute = PREFETCH_ROUTES.find(r => r.path === route);
        if (prefetchRoute) {
          prefetchRoute.prefetch().catch(console.error);
        }
      });
    });
  } else {
    // Fallback for browsers without requestIdleCallback
    setTimeout(() => {
      routesToPrefetch.forEach(route => {
        const prefetchRoute = PREFETCH_ROUTES.find(r => r.path === route);
        if (prefetchRoute) {
          prefetchRoute.prefetch().catch(console.error);
        }
      });
    }, 0);
  }
}

// Export all functions
export default {
  observeLinks,
  stopObservingLinks,
  prefetchLikelyRoutes
};