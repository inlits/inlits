import React, { useRef, useEffect } from 'react';
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

  // Create content sections that will repeat
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

    // Get books for two rows
    const sectionBooks = combinedBooks.slice(startIndex, startIndex + booksPerRow.xl * 2);
    const bookRows = chunk(sectionBooks, booksPerRow.xl);

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
    const booksRow1Ref = useRef<HTMLDivElement>(null);
    const booksRow2Ref = useRef<HTMLDivElement>(null);
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

    // For the "Popular Books" section, sort by views
    let popularBooks = [];
    if (isFirstSection && bookRows[1]) {
      // Create a copy of the second row and sort by views
      popularBooks = [...bookRows[1]].sort((a, b) => b.views - a.views);
    }

    return (
      <div className="space-y-2">
        {/* First row of books */}
        {bookRows[0]?.length > 0 && (
          <div className="space-y-2">
            {showHeading && (
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold">
                  {isFirstSection ? 'Featured Books' : 'More Books to Explore'}
                </h2>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => scroll(booksRow1Ref, 'left')}
                    className="p-1.5 rounded-full hover:bg-primary hover:text-primary-foreground transition-colors"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button 
                    onClick={() => scroll(booksRow1Ref, 'right')}
                    className="p-1.5 rounded-full hover:bg-primary hover:text-primary-foreground transition-colors"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              </div>
            )}
            <div 
              ref={booksRow1Ref}
              className="flex overflow-x-auto gap-4 pb-2 scrollbar-hide"
            >
              {bookRows[0].map(item => (
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

        {/* Second row of books - only show in first section */}
        {isFirstSection && bookRows[1]?.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Popular Books</h2>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => scroll(booksRow2Ref, 'left')}
                  className="p-1.5 rounded-full hover:bg-primary hover:text-primary-foreground transition-colors"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button 
                  onClick={() => scroll(booksRow2Ref, 'right')}
                  className="p-1.5 rounded-full hover:bg-primary hover:text-primary-foreground transition-colors"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>
            <div 
              ref={booksRow2Ref}
              className="flex overflow-x-auto gap-4 pb-2 scrollbar-hide"
            >
              {popularBooks.map(item => (
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

  // Create multiple sections
  const sections = [];
  
  // First section with all content types
  sections.push(createContentSection(0, true, true));
  
  // Show "More Books to Explore" heading only once
  if (combinedBooks.length > 14) {
    sections.push(createContentSection(14, false, true));
  }
  
  // Additional sections with just books (infinite scroll style) without headings
  // Display all remaining books by creating sections for each chunk
  const remainingBooksStartIndex = 28; // After the first two sections (14 + 14)
  const booksPerRow = 7; // Books per row
  
  // Create at least 5 more sections for all remaining books
  const minSections = 5;
  const remainingSectionBooks = combinedBooks.slice(remainingBooksStartIndex);
  const numSections = Math.max(minSections, Math.ceil(remainingSectionBooks.length / booksPerRow));
  
  for (let i = 0; i < numSections; i++) {
    const startIndex = remainingBooksStartIndex + (i * booksPerRow);
    if (startIndex < combinedBooks.length) {
      sections.push(createContentSection(startIndex, false, false));
    }
  }

  return <div className="space-y-6">{sections}</div>;
}