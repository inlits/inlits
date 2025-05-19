import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { searchContent } from '@/lib/search';
import { ContentGrid } from '@/components/content/content-grid';
import { Loader2, AlertCircle, Filter, ChevronLeft, ChevronRight, X } from 'lucide-react';
import type { ContentItem } from '@/lib/types';

type SortOption = 'relevance' | 'date' | 'views' | 'rating';

const contentTypes = [
  { value: 'all', label: 'All' },
  { value: 'article', label: 'Articles' },
  { value: 'book', label: 'E-Books' },
  { value: 'audiobook', label: 'Audiobooks' },
  { value: 'podcast', label: 'Podcasts' },
  { value: 'summary', label: 'Book Summaries' }
];

const sortOptions = [
  { value: 'relevance', label: 'Most Relevant' },
  { value: 'date', label: 'Most Recent' },
  { value: 'views', label: 'Most Viewed' },
  { value: 'rating', label: 'Highest Rated' }
];

const languages = [
  { value: 'all', label: 'All Languages' },
  { value: 'en', label: 'English' },
  { value: 'ur', label: 'Urdu' },
  { value: 'hi', label: 'Hindi' }
];

export function SearchPage() {
  const [searchParams] = useSearchParams();
  const query = searchParams.get('q') || '';
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<ContentItem[]>([]);
  const [totalResults, setTotalResults] = useState(0);
  const [page, setPage] = useState(1);
  
  // Filter states
  const [selectedType, setSelectedType] = useState<string>('all');
  const [sortBy, setSortBy] = useState<SortOption>('relevance');
  const [language, setLanguage] = useState<string>('all');
  const [showFilters, setShowFilters] = useState(false);

  // Refs for carousel scrolling
  const carouselRef = useRef<HTMLDivElement>(null);
  const [showLeftScroll, setShowLeftScroll] = useState(false);
  const [showRightScroll, setShowRightScroll] = useState(false);

  // Check if carousel needs scroll buttons
  const checkScrollButtons = () => {
    if (carouselRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = carouselRef.current;
      setShowLeftScroll(scrollLeft > 0);
      setShowRightScroll(scrollLeft < scrollWidth - clientWidth);
    }
  };

  // Handle carousel scroll
  const handleScroll = (direction: 'left' | 'right') => {
    if (carouselRef.current) {
      const scrollAmount = 200;
      carouselRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  // Update scroll buttons when content changes
  useEffect(() => {
    checkScrollButtons();
    window.addEventListener('resize', checkScrollButtons);
    return () => window.removeEventListener('resize', checkScrollButtons);
  }, [results]);

  useEffect(() => {
    const loadResults = async () => {
      if (!query.trim()) {
        setResults([]);
        setTotalResults(0);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const { items, total } = await searchContent({
          query,
          type: selectedType === 'all' ? undefined : selectedType,
          limit: 12,
          offset: (page - 1) * 12
        });

        setResults(items);
        setTotalResults(total);
      } catch (err) {
        console.error('Search error:', err);
        setError(err instanceof Error ? err.message : 'Failed to load search results');
        setResults([]);
        setTotalResults(0);
      } finally {
        setLoading(false);
      }
    };

    loadResults();
  }, [query, selectedType, sortBy, language, page]);

  const handleRetry = () => {
    setError(null);
    setPage(1);
    setLoading(true);
  };

  // Close filters when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('[data-filters]')) {
        setShowFilters(false);
      }
    };

    if (showFilters) {
      document.addEventListener('mousedown', handleClickOutside);
      // Prevent scrolling when filters are open
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.body.style.overflow = '';
    };
  }, [showFilters]);

  return (
    <div className="space-y-4">
      {/* Header */}
      <h1 className="text-2xl font-semibold">
        {query ? `Search results for "${query}"` : 'Search'}
        {totalResults > 0 && (
          <span className="text-base font-normal text-muted-foreground ml-2">
            {totalResults} {totalResults === 1 ? 'result' : 'results'}
          </span>
        )}
      </h1>

      {/* Filters Bar */}
      <div className="relative flex items-center gap-2">
        {/* Scroll Left Button */}
        {showLeftScroll && (
          <button
            onClick={() => handleScroll('left')}
            className="absolute left-0 z-20 h-full px-2 flex items-center justify-center bg-gradient-to-r from-background via-background to-transparent"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
        )}

        {/* Content Type Carousel */}
        <div
          ref={carouselRef}
          className="flex-1 flex items-center gap-2 overflow-x-auto scrollbar-hide scroll-smooth"
          onScroll={checkScrollButtons}
        >
          {contentTypes.map(type => (
            <button
              key={type.value}
              onClick={() => setSelectedType(type.value)}
              className={`shrink-0 whitespace-nowrap px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                selectedType === type.value
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted hover:bg-primary hover:text-primary-foreground'
              }`}
            >
              {type.label}
            </button>
          ))}
        </div>

        {/* Scroll Right Button */}
        {showRightScroll && (
          <button
            onClick={() => handleScroll('right')}
            className="absolute right-[56px] z-20 h-full px-2 flex items-center justify-center bg-gradient-to-l from-background via-background to-transparent"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        )}

        {/* Sort & Filter Button */}
        <div className="relative shrink-0" data-filters>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-full transition-colors ${
              showFilters
                ? 'bg-primary text-primary-foreground'
                : 'border hover:bg-primary hover:text-primary-foreground'
            }`}
          >
            <Filter className="w-4 h-4" />
            <span className="hidden md:inline">Filter</span>
          </button>

          {/* Filter Dropdown */}
          {showFilters && (
            <>
              {/* Backdrop */}
              <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40" />
              
              {/* Filter Panel */}
              <div className="fixed inset-y-0 right-0 w-full md:w-[400px] bg-background border-l shadow-xl z-50">
                <div className="flex flex-col h-full">
                  {/* Header */}
                  <div className="flex items-center justify-between p-4 border-b">
                    <h3 className="font-semibold">Filters</h3>
                    <button
                      onClick={() => setShowFilters(false)}
                      className="p-2 hover:bg-muted rounded-full transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Filter Options */}
                  <div className="flex-1 p-6 space-y-6">
                    {/* Sort Options */}
                    <div>
                      <h4 className="text-sm font-medium mb-3">Sort By</h4>
                      <div className="space-y-2">
                        {sortOptions.map(option => (
                          <button
                            key={option.value}
                            onClick={() => {
                              setSortBy(option.value as SortOption);
                              setShowFilters(false);
                            }}
                            className={`w-full flex items-center justify-between px-4 py-2 text-sm rounded-lg transition-colors ${
                              sortBy === option.value
                                ? 'bg-primary text-primary-foreground'
                                : 'hover:bg-primary hover:text-primary-foreground'
                            }`}
                          >
                            {option.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Language */}
                    <div>
                      <h4 className="text-sm font-medium mb-3">Language</h4>
                      <div className="space-y-2">
                        {languages.map(option => (
                          <button
                            key={option.value}
                            onClick={() => {
                              setLanguage(option.value);
                              setShowFilters(false);
                            }}
                            className={`w-full flex items-center justify-between px-4 py-2 text-sm rounded-lg transition-colors ${
                              language === option.value
                                ? 'bg-primary text-primary-foreground'
                                : 'hover:bg-primary hover:text-primary-foreground'
                            }`}
                          >
                            {option.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="p-4 border-t">
                    <button
                      onClick={() => {
                        setSortBy('relevance');
                        setLanguage('all');
                        setShowFilters(false);
                      }}
                      className="w-full px-4 py-2 text-sm text-primary hover:underline"
                    >
                      Reset all filters
                    </button>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Results */}
      {loading ? (
        <div className="min-h-[400px] flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : error ? (
        <div className="min-h-[400px] flex flex-col items-center justify-center text-center">
          <AlertCircle className="w-12 h-12 text-destructive mb-4" />
          <p className="text-destructive">{error}</p>
          <button
            onClick={handleRetry}
            className="mt-4 px-4 py-2 text-sm font-medium text-primary bg-primary/10 rounded-lg hover:bg-primary/20 transition-colors"
          >
            Try again
          </button>
        </div>
      ) : results.length > 0 ? (
        <ContentGrid
          items={results}
          page={page}
          totalPages={Math.ceil(totalResults / 12)}
          onPageChange={setPage}
        />
      ) : query ? (
        <div className="min-h-[400px] flex items-center justify-center text-center">
          <div className="space-y-2">
            <p className="text-lg font-medium">No results found</p>
            <p className="text-muted-foreground">
              Try adjusting your search or filters to find what you're looking for
            </p>
          </div>
        </div>
      ) : (
        <div className="min-h-[400px] flex items-center justify-center text-center">
          <p className="text-muted-foreground">
            Enter a search term to find content
          </p>
        </div>
      )}
    </div>
  );
}

export default SearchPage;