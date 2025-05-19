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

// Helper to start observing links
export function observeLinks() {
  const links = document.querySelectorAll('a');
  links.forEach(link => {
    if (PREFETCH_ROUTES.some(route => route.path === link.pathname)) {
      observer.observe(link);
    }
  });
}

// Clean up
export function stopObservingLinks() {
  observer.disconnect();
}