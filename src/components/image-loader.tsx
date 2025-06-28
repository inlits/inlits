import React, { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { useLazyImage } from '@/lib/lazy-loading';

interface ImageLoaderProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  fallback?: React.ReactNode;
  lowQualityUrl?: string;
  loadingStrategy?: 'lazy' | 'eager';
}

export function ImageLoader({ 
  src, 
  alt, 
  className, 
  fallback, 
  lowQualityUrl,
  loadingStrategy = 'lazy',
  ...props 
}: ImageLoaderProps) {
  const { currentSrc, isLoaded, error } = useLazyImage(src || '', lowQualityUrl);
  const [shouldLoad, setShouldLoad] = useState(loadingStrategy === 'eager');
  const elementId = React.useId(); // Generate unique ID using React.useId()

  useEffect(() => {
    if (loadingStrategy === 'lazy') {
      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            setShouldLoad(true);
            observer.disconnect();
          }
        },
        { threshold: 0.1 }
      );

      const element = document.getElementById(elementId);
      if (element) {
        observer.observe(element);
      }

      return () => observer.disconnect();
    }
  }, [loadingStrategy, elementId]);

  if (error && fallback) {
    return <>{fallback}</>;
  }

  return (
    <div id={elementId} className="relative">
      {shouldLoad && (
        <img
          src={currentSrc || src}
          alt={alt}
          className={`${className} ${!isLoaded ? 'blur-sm' : 'blur-0'} transition-all duration-300`}
          loading={loadingStrategy}
          onError={(e) => {
            // If image fails to load and we have a fallback URL, try that
            if (fallback && e.currentTarget.src !== 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7') {
              e.currentTarget.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
            }
          }}
          {...props}
        />
      )}
      {(!isLoaded && shouldLoad) && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/50">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      )}
    </div>
  );
}