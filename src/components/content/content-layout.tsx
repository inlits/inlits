import React, { useRef, useEffect, useState, useCallback } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { ContentCard } from './content-card';
import type { ContentItem } from '@/lib/types';

interface ContentLayoutProps {
  audiobooks: ContentItem[];
  ebooks: ContentItem[];
  articles: ContentItem[];
  podcasts: ContentItem[];
  activeShelf?: string | null;
  onAddToShelf?: (contentId: string, contentType: string) => void;
}

export function ContentLayout({ 
  audiobooks, 
  ebooks, 
  articles, 
  podcasts, 
  activeShelf,
  onAddToShelf
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

  // Create content section with books
  const createContentSection = (startIndex: number, isFirstSection: boolean, showHeading: boolean) => {
    const booksPerRow = {
      xl: 7, // Extra large screens
      lg: 6, // Large screens
      md: 4, // Medium screens
      sm: 3, // Small screens
      base: 2 // Mobile
    };

    const articlesPerRow = {
      xl: 5, // Extra large screens
      lg: 4, // Large screens
      md: 3, // Medium screens
      sm: 2, // Small screens
      base: 1 // Mobile
    };

    // Get books for this section
    const sectionBooks = combinedBooks.slice(startIndex, startIndex + booksPerRow.xl);
    
    // Get featured articles and podcasts first
    const featuredArticles = articles
      .filter(item => item.featured)
      .sort((a, b) => b.views - a.views);
    const featuredPodcasts = podcasts
      .filter(item => item.featured)
      .sort((a, b) => b.views - a.views);

    // Get remaining articles and podcasts
    const remainingArticles = articles
      .filter(item => !item.featured)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    const remainingPodcasts = podcasts
      .filter(item => !item.featured)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    // Combine featured and remaining content
    const sectionArticles = [...featuredArticles, ...remainingArticles]
      .slice(startIndex / 2, startIndex / 2 + articlesPerRow.xl);
    const sectionPodcasts = [...featuredPodcasts, ...remainingPodcasts]
      .slice(startIndex / 2, startIndex / 2 + articlesPerRow.xl);

    // References for scrolling
    const booksRowRef = useRef<HTMLDivElement>(null);
    const articlesRef = useRef<HTMLDivElement>(null);
    const podcastsRef = useRef<HTMLDivElement>(null);

    // Scroll functions
    const scroll = (ref: React.RefObject<HTMLDivElement>, direction: 'left' | 'right') => {
      if (!ref.current) return;
      
      const scrollAmount = 300;
      const container = ref.current;
      const scrollPosition = direction === 'left' 
        ? container.scrollLeft - scrollAmount 
        : container.scrollLeft + scrollAmount;
      
      container.scrollTo({
        left: scrollPosition,
        behavior: 'smooth'
      });
    };

    return (
      <div className="space-y-6">
        {/* Books row */}
        {sectionBooks.length > 0 && (
          <div className="space-y-2">
            {showHeading && (
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold">
                  {isFirstSection ? 'Featured Books' : 'More Books to Explore'}
                </h2>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => scroll(booksRowRef, 'left')}
                    className="p-1.5 rounded-full hover:bg-primary hover:text-primary-foreground transition-colors"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button 
                    onClick={() => scroll(booksRowRef, 'right')}
                    className="p-1.5 rounded-full hover:bg-primary hover:text-primary-foreground transition-colors"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              </div>
            )}
            <div 
              ref={booksRowRef}
              className="flex overflow-x-auto gap-4 pb-2 scrollbar-hide"
            >
              {sectionBooks.map(item => (
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
        )}

        {/* Articles row - only show in first section */}
        {isFirstSection && sectionArticles.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Latest Articles</h2>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => scroll(articlesRef, 'left')}
                  className="p-1.5 rounded-full hover:bg-primary hover:text-primary-foreground transition-colors"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button 
                  onClick={() => scroll(articlesRef, 'right')}
                  className="p-1.5 rounded-full hover:bg-primary hover:text-primary-foreground transition-colors"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>
            <div 
              ref={articlesRef}
              className="flex overflow-x-auto gap-4 pb-2 scrollbar-hide"
            >
              {sectionArticles.map(item => (
                <div key={item.id} className="flex-shrink-0 w-[280px]">
                  <ContentCard 
                    item={item} 
                    activeShelf={activeShelf}
                    onAddToShelf={onAddToShelf}
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Podcasts row - only show in first section */}
        {isFirstSection && sectionPodcasts.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Featured Podcasts</h2>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => scroll(podcastsRef, 'left')}
                  className="p-1.5 rounded-full hover:bg-primary hover:text-primary-foreground transition-colors"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button 
                  onClick={() => scroll(podcastsRef, 'right')}
                  className="p-1.5 rounded-full hover:bg-primary hover:text-primary-foreground transition-colors"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>
            <div 
              ref={podcastsRef}
              className="flex overflow-x-auto gap-4 pb-2 scrollbar-hide"
            >
              {sectionPodcasts.map(item => (
                <div key={item.id} className="flex-shrink-0 w-[280px]">
                  <ContentCard 
                    item={item} 
                    activeShelf={activeShelf}
                    onAddToShelf={onAddToShelf}
                  />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  // Helper function to chunk arrays
  const chunk = <T,>(arr: T[], size: number): T[][] => {
    return Array.from({ length: Math.ceil(arr.length / size) }, (_, i) =>
      arr.slice(i * size, i * size + size)
    );
  };

  // Calculate how many sections we need to display all books
  const booksPerRow = 7; // Books per row on XL screens
  const booksPerSection = booksPerRow;
  const totalBookSections = Math.ceil(combinedBooks.length / booksPerSection);
  
  // Limit visible sections based on state
  const sectionsToShow = Math.min(totalBookSections, visibleSections);
  
  // Create sections array
  const sections = [];
  
  // First section with all content types
  sections.push(createContentSection(0, true, true));
  
  // Show "More Books to Explore" heading only once
  if (combinedBooks.length > booksPerRow) {
    sections.push(createContentSection(booksPerRow, false, true));
  }
  
  // Additional sections without headings (infinite scroll style)
  for (let i = 2; i < sectionsToShow; i++) {
    const startIndex = i * booksPerSection;
    if (startIndex < combinedBooks.length) {
      sections.push(createContentSection(startIndex, false, false));
    }
  }

  return (
    <div className="space-y-8">
      {sections}
      
      {/* Infinite scroll trigger */}
      {sectionsToShow < totalBookSections && (
        <div 
          ref={loadMoreTriggerRef} 
          className="h-20 flex items-center justify-center"
        >
          <div className="animate-pulse flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-primary/50"></div>
            <div className="w-2 h-2 rounded-full bg-primary/50"></div>
            <div className="w-2 h-2 rounded-full bg-primary/50"></div>
          </div>
        </div>
      )}
    </div>
  );
}