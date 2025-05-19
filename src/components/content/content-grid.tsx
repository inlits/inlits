import React from 'react';
import { ChevronDown } from 'lucide-react';
import { ContentCard } from './content-card';
import { SponsoredCard } from './sponsored-card';
import { ContentItem, SponsoredContent } from '@/lib/types';

interface ContentGridProps {
  items: ContentItem[];
  sponsoredItems?: SponsoredContent[];
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  loading?: boolean;
}

export function ContentGrid({ 
  items, 
  sponsoredItems = [], 
  page,
  totalPages,
  onPageChange,
  loading = false
}: ContentGridProps) {
  const renderPagination = () => {
    const pages = [];
    const maxVisiblePages = 5;
    let startPage = Math.max(1, page - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(
        <button
          key={i}
          onClick={() => onPageChange(i)}
          className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
            page === i
              ? 'bg-primary text-primary-foreground'
              : 'hover:bg-accent'
          }`}
        >
          {i}
        </button>
      );
    }

    return (
      <div className="flex items-center justify-center gap-2 mt-8">
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page === 1}
          className="px-3 py-1 rounded-md text-sm font-medium transition-colors hover:bg-accent disabled:opacity-50"
        >
          Previous
        </button>
        {startPage > 1 && (
          <>
            <button
              onClick={() => onPageChange(1)}
              className="px-3 py-1 rounded-md text-sm font-medium transition-colors hover:bg-accent"
            >
              1
            </button>
            {startPage > 2 && <span className="px-2">...</span>}
          </>
        )}
        {pages}
        {endPage < totalPages && (
          <>
            {endPage < totalPages - 1 && <span className="px-2">...</span>}
            <button
              onClick={() => onPageChange(totalPages)}
              className="px-3 py-1 rounded-md text-sm font-medium transition-colors hover:bg-accent"
            >
              {totalPages}
            </button>
          </>
        )}
        <button
          onClick={() => onPageChange(page + 1)}
          disabled={page === totalPages}
          className="px-3 py-1 rounded-md text-sm font-medium transition-colors hover:bg-accent disabled:opacity-50"
        >
          Next
        </button>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Content Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {loading ? (
          // Loading skeletons
          Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="aspect-video bg-muted rounded-lg mb-4" />
              <div className="space-y-2">
                <div className="h-4 bg-muted rounded w-3/4" />
                <div className="h-3 bg-muted rounded w-1/2" />
              </div>
            </div>
          ))
        ) : (
          items.map((item, index) => {
            // Insert sponsored content after every 8 items
            const sponsoredIndex = Math.floor(index / 8);
            const sponsoredItem = sponsoredItems[sponsoredIndex];

            return (
              <React.Fragment key={item.id}>
                <ContentCard item={item} />
                {sponsoredItem && (index + 1) % 8 === 0 && (
                  <SponsoredCard item={sponsoredItem} />
                )}
              </React.Fragment>
            );
          })
        )}
      </div>

      {/* Pagination */}
      {!loading && totalPages > 1 && renderPagination()}
    </div>
  );
}