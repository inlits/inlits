import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/lib/auth';
import { getRecommendations, getSimilarContent, getTrendingContent } from '@/lib/recommendations';
import { ContentCard } from './content-card';
import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import type { ContentItem } from '@/lib/types';

interface ContentRecommendationsProps {
  type?: 'personalized' | 'similar' | 'trending';
  contentId?: string;
  contentType?: string;
  category?: string;
  limit?: number;
  title?: string;
  description?: string;
}

export function ContentRecommendations({
  type = 'personalized',
  contentId,
  contentType,
  category,
  limit = 10,
  title,
  description
}: ContentRecommendationsProps) {
  const { user } = useAuth();
  const [content, setContent] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(false);

  useEffect(() => {
    const loadRecommendations = async () => {
      try {
        setLoading(true);
        setError(null);

        let recommendedContent: ContentItem[] = [];

        switch (type) {
          case 'similar':
            if (!contentId || !contentType) {
              throw new Error('Content ID and type required for similar recommendations');
            }
            recommendedContent = await getSimilarContent(contentId, contentType, limit);
            break;

          case 'trending':
            recommendedContent = await getTrendingContent(category, 'week', limit);
            break;

          default: // personalized
            recommendedContent = await getRecommendations({
              userId: user?.id,
              category,
              limit,
              excludeIds: contentId ? [contentId] : []
            });
            break;
        }

        setContent(recommendedContent);
      } catch (err) {
        console.error('Error loading recommendations:', err);
        setError(err instanceof Error ? err.message : 'Failed to load recommendations');
      } finally {
        setLoading(false);
      }
    };

    loadRecommendations();
  }, [type, contentId, contentType, category, limit, user?.id]);

  // Check if we need to show scroll arrows
  const checkArrows = () => {
    if (!scrollRef.current) return;
    
    setShowLeftArrow(scrollRef.current.scrollLeft > 0);
    setShowRightArrow(
      scrollRef.current.scrollLeft < 
      scrollRef.current.scrollWidth - scrollRef.current.clientWidth
    );
  };

  useEffect(() => {
    checkArrows();
    window.addEventListener('resize', checkArrows);
    return () => window.removeEventListener('resize', checkArrows);
  }, [content]);

  const scroll = (direction: 'left' | 'right') => {
    if (!scrollRef.current) return;
    
    const scrollAmount = 400;
    const newScrollLeft = direction === 'left' 
      ? scrollRef.current.scrollLeft - scrollAmount
      : scrollRef.current.scrollLeft + scrollAmount;
    
    scrollRef.current.scrollTo({
      left: newScrollLeft,
      behavior: 'smooth'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        {error}
      </div>
    );
  }

  if (content.length === 0) {
    return null;
  }

  return (
    <div className="space-y-2">
      {/* Header */}
      {(title || description) && (
        <div className="flex items-center justify-between">
          <div>
            {title && <h2 className="text-xl font-semibold">{title}</h2>}
            {description && (
              <p className="text-sm text-muted-foreground">{description}</p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => scroll('left')}
              className="p-1.5 rounded-full hover:bg-primary hover:text-primary-foreground transition-colors"
              disabled={!showLeftArrow}
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={() => scroll('right')}
              className="p-1.5 rounded-full hover:bg-primary hover:text-primary-foreground transition-colors"
              disabled={!showRightArrow}
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      {/* Content Scroll */}
      <div
        ref={scrollRef}
        onScroll={checkArrows}
        className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide"
      >
        {content.map((item) => (
          <div key={item.id} className="flex-shrink-0 w-[220px]">
            <ContentCard item={item} />
          </div>
        ))}
      </div>
    </div>
  );
}