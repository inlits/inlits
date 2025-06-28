import { useEffect, useRef, useState } from 'react';

// Polyfill requestIdleCallback
const requestIdleCallback = 
  window.requestIdleCallback || 
  ((cb: IdleRequestCallback) => setTimeout(cb, 1));

// Intersection Observer hook for lazy loading
export function useIntersectionObserver(
  options: IntersectionObserverInit = { threshold: 0.1 }
) {
  const [isIntersecting, setIntersecting] = useState(false);
  const targetRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!targetRef.current) return;

    const observer = new IntersectionObserver(([entry]) => {
      setIntersecting(entry.isIntersecting);
    }, options);

    observer.observe(targetRef.current);

    return () => {
      observer.disconnect();
    };
  }, [options]);

  return { targetRef, isIntersecting };
}

// Lazy image loading hook with better error handling
export function useLazyImage(src: string, lowQualityUrl?: string) {
  const [currentSrc, setCurrentSrc] = useState(lowQualityUrl || '');
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState(false);
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    
    if (!src) return;

    const img = new Image();
    img.src = src;

    const handleLoad = () => {
      if (isMounted.current) {
        setCurrentSrc(src);
        setIsLoaded(true);
        setError(false);
      }
    };

    const handleError = () => {
      if (isMounted.current) {
        setError(true);
        setIsLoaded(true);
      }
    };

    img.addEventListener('load', handleLoad);
    img.addEventListener('error', handleError);

    return () => {
      isMounted.current = false;
      img.removeEventListener('load', handleLoad);
      img.removeEventListener('error', handleError);
    };
  }, [src]);

  return { currentSrc, isLoaded, error };
}

// Lazy load components with better error handling
export function useLazyComponent<T>(
  importFn: () => Promise<{ default: React.ComponentType<T> }>,
  options: IntersectionObserverInit = { threshold: 0.1 }
) {
  const [Component, setComponent] = useState<React.ComponentType<T> | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const { targetRef, isIntersecting } = useIntersectionObserver(options);
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;

    if (isIntersecting && !Component) {
      requestIdleCallback(() => {
        importFn()
          .then(module => {
            if (isMounted.current) {
              setComponent(() => module.default);
              setError(null);
            }
          })
          .catch(err => {
            if (isMounted.current) {
              console.error('Error lazy loading component:', err);
              setError(err instanceof Error ? err : new Error('Failed to load component'));
            }
          });
      });
    }

    return () => {
      isMounted.current = false;
    };
  }, [isIntersecting, Component, importFn]);

  return { Component, targetRef, error };
}