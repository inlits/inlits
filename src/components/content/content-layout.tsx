import React, { useRef, useEffect, useState, useCallback } from 'react';
import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { ContentCard } from './content-card';
import type { ContentItem } from '@/lib/types';

interface ContentLayoutProps {
  audiobooks: ContentItem[];
  ebooks: ContentItem[];
  articles: ContentItem[];
  podcasts: ContentItem[];
  activeShelf?: string | null;
  onAddToShelf?: (contentId: string, contentType: string) => void;
  onLoadMore?: (contentType: 'audiobooks' | 'ebooks' | 'articles' | 'podcasts') => void;
  hasMore?: {
    audiobooks: boolean;
    ebooks: boolean;
    articles: boolean;
    podcasts: boolean;
  };
  loadingMore?: boolean;
}

export function ContentLayout({ 
  audiobooks, 
  ebooks, 
  articles, 
  podcasts, 
  activeShelf,
  onAddToShelf,
  onLoadMore,
  hasMore,
  loadingMore
}: ContentLayoutProps) {
  // Get featured content first
  const featuredBooks = [...audiobooks, ...ebooks]
    .filter(item => item.featured)
    .sort((a, b) => {
      // Sort by views first, then by date
      if (a.views !== b.views) return b.views - a.views;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

  // Get remaining content
  const remainingBooks = [...audiobooks, ...ebooks]
    .filter(item => !item.featured)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  // Combine featured and remaining content
  const combinedBooks = [...featuredBooks, ...remainingBooks];
  
  // State for infinite scroll
  const [visibleSections, setVisibleSections] = useState(3); // Start with 3 sections
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreTriggerRef = useRef<HTMLDivElement>(null);

  // Set up intersection observer for infinite scroll
  useEffect(() => {
    if (observerRef.current) {
      observerRef.current.disconnect();
    }

    observerRef.current = new IntersectionObserver(entries => {
      const [entry] = entries;
      if (entry.isIntersecting) {
        // Load more sections when the trigger element is visible
        setVisibleSections(prev => prev + 2); // Load 2 more sections at a time
      }
    }, {
      rootMargin: '200px', // Load more before user reaches the end
    });

    if (loadMoreTriggerRef.current) {
      observerRef.current.observe(loadMoreTriggerRef.current);
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [visibleSections]);

  // Create a section component for books
  const BookSection = useCallback(({ 
    books, 
    title, 
    startIndex,
    contentType
  }: { 
    books: ContentItem[], 
    title: string, 
    startIndex: number,
    contentType?: 'audiobooks' | 'ebooks'
  }) => {
    const rowRef = useRef<HTMLDivElement>(null);
    const [showLoadMore, setShowLoadMore] = useState(false);

    // Check if we need to show load more button
    useEffect(() => {
      if (contentType && hasMore && onLoadMore) {
        const typeHasMore = contentType === 'audiobooks' ? hasMore.audiobooks : hasMore.ebooks;
        const isLastSection = startIndex + 7 >= books.length;
        setShowLoadMore(typeHasMore && isLastSection);
      }
    }, [books.length, startIndex, contentType]);

    const scroll = (direction: 'left' | 'right') => {
      if (!rowRef.current) return;
      
      const scrollAmount = 300;
      const container = rowRef.current;
      const scrollPosition = direction === 'left' 
        ? container.scrollLeft - scrollAmount 
        : container.scrollLeft + scrollAmount;
      
      container.scrollTo({
        left: scrollPosition,
        behavior: 'smooth'
      });
    };

    return (
      <div className="space-y-2 mb-8">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">{title}</h2>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => scroll('left')}
              className="p-1.5 rounded-full hover:bg-primary hover:text-primary-foreground transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button 
              onClick={() => scroll('right')}
              className="p-1.5 rounded-full hover:bg-primary hover:text-primary-foreground transition-colors"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
        <div 
          ref={rowRef}
          className="flex overflow-x-auto gap-4 pb-2 scrollbar-hide"
        >
          {books.slice(startIndex, startIndex + 7).map(item => (
            <div key={item.id} className="flex-shrink-0 w-[180px]">
              <ContentCard 
                item={item} 
                activeShelf={activeShelf}
                onAddToShelf={onAddToShelf}
              />
            </div>
          ))}
          {/* Load More Button */}
          {showLoadMore && contentType && onLoadMore && (
            <div className="flex-shrink-0 w-[180px] h-[280px] flex items-center justify-center">
              <button
                onClick={() => onLoadMore(contentType)}
                disabled={loadingMore}
                className="w-full h-full border-2 border-dashed border-primary/30 rounded-lg hover:border-primary/50 transition-colors flex flex-col items-center justify-center gap-2 text-primary hover:bg-primary/5"
              >
                {loadingMore ? (
                  <>
                    <Loader2 className="w-6 h-6 animate-spin" />
                    <span className="text-sm">Loading...</span>
                  </>
                ) : (
                  <>
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                      <ChevronRight className="w-6 h-6" />
                    </div>
                    <span className="text-sm font-medium">Load More</span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }, [activeShelf, onAddToShelf, hasMore, onLoadMore, loadingMore]);

  // Create sections for articles and podcasts
  const ArticlesSection = useCallback(() => {
    const rowRef = useRef<HTMLDivElement>(null);
    const [showLoadMore, setShowLoadMore] = useState(false);

    // Check if we need to show load more button
    useEffect(() => {
      if (hasMore && onLoadMore) {
        setShowLoadMore(hasMore.articles && articles.length > 0);
      }
    }, [articles.length]);

    const scroll = (direction: 'left' | 'right') => {
      if (!rowRef.current) return;
      
      const scrollAmount = 300;
      const container = rowRef.current;
      const scrollPosition = direction === 'left' 
        ? container.scrollLeft - scrollAmount 
        : container.scrollLeft + scrollAmount;
      
      container.scrollTo({
        left: scrollPosition,
        behavior: 'smooth'
      });
    };

    // Get featured articles first
    const featuredArticles = articles
      .filter(item => item.featured)
      .sort((a, b) => b.views - a.views);
    
    // Get remaining articles
    const remainingArticles = articles
      .filter(item => !item.featured)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    
    // Combine featured and remaining articles
    const combinedArticles = [...featuredArticles, ...remainingArticles];

    if (combinedArticles.length === 0) return null;

    return (
      <div className="space-y-2 mb-8">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Latest Articles</h2>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => scroll('left')}
              className="p-1.5 rounded-full hover:bg-primary hover:text-primary-foreground transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button 
              onClick={() => scroll('right')}
              className="p-1.5 rounded-full hover:bg-primary hover:text-primary-foreground transition-colors"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
        <div 
          ref={rowRef}
          className="flex overflow-x-auto gap-4 pb-2 scrollbar-hide"
        >
          {combinedArticles.slice(0, 10).map(item => (
            <div key={item.id} className="flex-shrink-0 w-[280px]">
              <ContentCard 
                item={item} 
                activeShelf={activeShelf}
                onAddToShelf={onAddToShelf}
              />
            </div>
          ))}
          {/* Load More Button */}
          {showLoadMore && onLoadMore && (
            <div className="flex-shrink-0 w-[280px] h-[200px] flex items-center justify-center">
              <button
                onClick={() => onLoadMore('articles')}
                disabled={loadingMore}
                className="w-full h-full border-2 border-dashed border-primary/30 rounded-lg hover:border-primary/50 transition-colors flex flex-col items-center justify-center gap-2 text-primary hover:bg-primary/5"
              >
                {loadingMore ? (
                  <>
                    <Loader2 className="w-6 h-6 animate-spin" />
                    <span className="text-sm">Loading...</span>
                  </>
                ) : (
                  <>
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                      <ChevronRight className="w-6 h-6" />
                    </div>
                    <span className="text-sm font-medium">Load More Articles</span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }, [articles, activeShelf, onAddToShelf, hasMore, onLoadMore, loadingMore]);

  const PodcastsSection = useCallback(() => {
    const rowRef = useRef<HTMLDivElement>(null);
    const [showLoadMore, setShowLoadMore] = useState(false);

    // Check if we need to show load more button
    useEffect(() => {
      if (hasMore && onLoadMore) {
        setShowLoadMore(hasMore.podcasts && podcasts.length > 0);
      }
    }, [podcasts.length]);

    const scroll = (direction: 'left' | 'right') => {
      if (!rowRef.current) return;
      
      const scrollAmount = 300;
      const container = rowRef.current;
      const scrollPosition = direction === 'left' 
        ? container.scrollLeft - scrollAmount 
        : container.scrollLeft + scrollAmount;
      
      container.scrollTo({
        left: scrollPosition,
        behavior: 'smooth'
      });
    };

    // Get featured podcasts first
    const featuredPodcasts = podcasts
      .filter(item => item.featured)
      .sort((a, b) => b.views - a.views);
    
    // Get remaining podcasts
    const remainingPodcasts = podcasts
      .filter(item => !item.featured)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    
    // Combine featured and remaining podcasts
    const combinedPodcasts = [...featuredPodcasts, ...remainingPodcasts];

    if (combinedPodcasts.length === 0) return null;

    return (
      <div className="space-y-2 mb-8">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Featured Podcasts</h2>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => scroll('left')}
              className="p-1.5 rounded-full hover:bg-primary hover:text-primary-foreground transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button 
              onClick={() => scroll('right')}
              className="p-1.5 rounded-full hover:bg-primary hover:text-primary-foreground transition-colors"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
        <div 
          ref={rowRef}
          className="flex overflow-x-auto gap-4 pb-2 scrollbar-hide"
        >
          {combinedPodcasts.slice(0, 10).map(item => (
            <div key={item.id} className="flex-shrink-0 w-[280px]">
              <ContentCard 
                item={item} 
                activeShelf={activeShelf}
                onAddToShelf={onAddToShelf}
              />
            </div>
          ))}
          {/* Load More Button */}
          {showLoadMore && onLoadMore && (
            <div className="flex-shrink-0 w-[280px] h-[200px] flex items-center justify-center">
              <button
                onClick={() => onLoadMore('podcasts')}
                disabled={loadingMore}
                className="w-full h-full border-2 border-dashed border-primary/30 rounded-lg hover:border-primary/50 transition-colors flex flex-col items-center justify-center gap-2 text-primary hover:bg-primary/5"
              >
                {loadingMore ? (
                  <>
                    <Loader2 className="w-6 h-6 animate-spin" />
                    <span className="text-sm">Loading...</span>
                  </>
                ) : (
                  <>
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                      <ChevronRight className="w-6 h-6" />
                    </div>
                    <span className="text-sm font-medium">Load More Podcasts</span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }, [podcasts, activeShelf, onAddToShelf, hasMore, onLoadMore, loadingMore]);

  // Calculate how many book sections we need
  const booksPerSection = 7; // 7 books per row
  const totalSections = Math.ceil(combinedBooks.length / booksPerSection);
  
  // Log the total number of books and sections
  console.log(`Total books: ${combinedBooks.length}, Total sections: ${totalSections}`);
  
  // Ensure we show at least 3 sections or all sections if there are fewer
  const minSections = Math.min(totalSections, 3);
  const actualVisibleSections = Math.max(visibleSections, minSections);

  return (
    <div className="space-y-6">
      {/* Featured Books Section */}
      {featuredBooks.length > 0 && (
        <BookSection 
          books={featuredBooks} 
          title="Featured Books" 
          startIndex={0}
          contentType="audiobooks"
        />
      )}

      {/* Articles Section */}
      <ArticlesSection />

      {/* Podcasts Section */}
      <PodcastsSection />

      {/* More Books to Explore Sections */}
      {remainingBooks.length > 0 && (
        <BookSection 
          books={remainingBooks} 
          title="More Books to Explore" 
          startIndex={0}
          contentType="ebooks"
        />
      )}

      {/* Additional Book Sections - without titles */}
      {Array.from({ length: Math.min(actualVisibleSections - 1, totalSections - 1) }).map((_, i) => {
        // Calculate the correct starting index for each section
        // We need to skip the first section (index 0) which is already shown above
        const startIndex = (i + 1) * booksPerSection;
        
        // Only render if there are books to show in this section
        if (startIndex < remainingBooks.length) {
          return (
            <div key={`section-${i+1}`} className="mb-8">
              <div 
                className="flex overflow-x-auto gap-4 pb-2 scrollbar-hide"
              >
                {remainingBooks.slice(startIndex, startIndex + booksPerSection).map(item => (
                  <div key={item.id} className="flex-shrink-0 w-[180px]">
                    <ContentCard 
                      item={item} 
                      activeShelf={activeShelf}
                      onAddToShelf={onAddToShelf}
                    />
                  </div>
                ))}
              </div>
            </div>
          );
        }
        return null;
      })}
    </div>
  );
}