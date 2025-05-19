import React, { useEffect, useRef, useCallback } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { ContentCard } from './content-card';
import { ContentItem } from '@/lib/types';

interface InfiniteContentGridProps {
  items: ContentItem[];
  loading: boolean;
  hasMore: boolean;
  onLoadMore: () => void;
}

export function InfiniteContentGrid({ 
  items, 
  loading, 
  hasMore, 
  onLoadMore 
}: InfiniteContentGridProps) {
  const parentRef = useRef<HTMLDivElement>(null);
  const observerTarget = useRef(null);

  // Set up virtualization
  const rowVirtualizer = useVirtualizer({
    count: Math.ceil(items.length / 4), // 4 items per row
    getScrollElement: () => parentRef.current,
    estimateSize: () => 400, // Estimated row height
    overscan: 5 // Number of items to render outside of the visible area
  });

  const handleObserver = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      const [target] = entries;
      if (target.isIntersecting && hasMore && !loading) {
        onLoadMore();
      }
    },
    [hasMore, loading, onLoadMore]
  );

  useEffect(() => {
    const element = observerTarget.current;
    if (!element) return;

    const observer = new IntersectionObserver(handleObserver, {
      threshold: 0.5,
    });

    observer.observe(element);

    return () => {
      if (element) observer.unobserve(element);
    };
  }, [handleObserver]);

  return (
    <div 
      ref={parentRef} 
      className="h-[calc(100vh-200px)] overflow-auto"
    >
      <div
        className="relative w-full"
        style={{
          height: `${rowVirtualizer.getTotalSize()}px`,
        }}
      >
        {rowVirtualizer.getVirtualItems().map((virtualRow) => {
          const startIndex = virtualRow.index * 4;
          const rowItems = items.slice(startIndex, startIndex + 4);

          return (
            <div
              key={virtualRow.key}
              className="absolute top-0 left-0 w-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
              style={{
                transform: `translateY(${virtualRow.start}px)`,
              }}
            >
              {rowItems.map((item) => (
                <ContentCard key={item.id} item={item} />
              ))}
            </div>
          );
        })}
      </div>

      <div ref={observerTarget} className="h-10 flex items-center justify-center">
        {loading && (
          <div className="animate-pulse flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-primary/50"></div>
            <div className="w-2 h-2 rounded-full bg-primary/50"></div>
            <div className="w-2 h-2 rounded-full bg-primary/50"></div>
          </div>
        )}
      </div>
    </div>
  );
}