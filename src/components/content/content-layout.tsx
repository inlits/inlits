import React, { useRef, useEffect, useState } from 'react';
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

interface ContentSectionProps {
  sectionBooks: ContentItem[];
  sectionArticles: ContentItem[];
  sectionPodcasts: ContentItem[];
  isFirstSection: boolean;
  showHeading: boolean;
  activeShelf?: string | null;
  onAddToShelf?: (contentId: string, contentType: string) => void;
}

function ContentSection({
  sectionBooks,
  sectionArticles,
  sectionPodcasts,
  isFirstSection,
  showHeading,
  activeShelf,
  onAddToShelf
}: ContentSectionProps) {
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

  // Get content for sections
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
  const combinedArticles = [...featuredArticles, ...remainingArticles];
  const combinedPodcasts = [...featuredPodcasts, ...remainingPodcasts];

  // Calculate how many sections we need to display all books
  const booksPerSection = booksPerRow.xl;
  const totalBookSections = Math.ceil(combinedBooks.length / booksPerSection);
  
  // Limit visible sections based on state
  const sectionsToShow = Math.min(totalBookSections, visibleSections);
  
  // Create sections array
  const sections = [];
  
  for (let i = 0; i < sectionsToShow; i++) {
    const startIndex = i * booksPerSection;
    const sectionBooks = combinedBooks.slice(startIndex, startIndex + booksPerSection);
    
    // Only show articles and podcasts in the first section
    const sectionArticles = i === 0 
      ? combinedArticles.slice(0, articlesPerRow.xl)
      : [];
    const sectionPodcasts = i === 0 
      ? combinedPodcasts.slice(0, articlesPerRow.xl)
      : [];

    const isFirstSection = i === 0;
    const showHeading = i === 0 || (i === 1 && combinedBooks.length > booksPerRow.xl);

    sections.push(
      <ContentSection
        key={i}
        sectionBooks={sectionBooks}
        sectionArticles={sectionArticles}
        sectionPodcasts={sectionPodcasts}
        isFirstSection={isFirstSection}
        showHeading={showHeading}
        activeShelf={activeShelf}
        onAddToShelf={onAddToShelf}
      />
    );
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