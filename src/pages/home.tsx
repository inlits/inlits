import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { ContentLayout } from '@/components/content/content-layout';
import { Loader2, AlertCircle } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { AddToShelfBanner } from '@/components/library/add-to-shelf-banner';
import type { ContentItem } from '@/lib/types';

interface HomeProps {
  selectedCategory?: string;
}

// Pagination configuration
const ITEMS_PER_PAGE = 12;
const INITIAL_LOAD_PAGES = 2; // Load 2 pages initially

// Cache for content data with pagination
const contentCache = new Map<string, {
  data: {
    audiobooks: ContentItem[];
    ebooks: ContentItem[];
    articles: ContentItem[];
    podcasts: ContentItem[];
  };
  hasMore: {
    audiobooks: boolean;
    ebooks: boolean;
    articles: boolean;
    podcasts: boolean;
  };
  timestamp: number;
}>();

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export function Home({ selectedCategory = 'all' }: HomeProps) {
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const [allContent, setAllContent] = useState<{
    audiobooks: ContentItem[];
    ebooks: ContentItem[];
    articles: ContentItem[];
    podcasts: ContentItem[];
  }>({
    audiobooks: [],
    ebooks: [],
    articles: [],
    podcasts: []
  });
  
  const [hasMore, setHasMore] = useState<{
    audiobooks: boolean;
    ebooks: boolean;
    articles: boolean;
    podcasts: boolean;
  }>({
    audiobooks: true,
    ebooks: true,
    articles: true,
    podcasts: true
  });
  
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);
  const [currentPage, setCurrentPage] = useState({
    audiobooks: 0,
    ebooks: 0,
    articles: 0,
    podcasts: 0
  });

  // Intersection observer for infinite scroll
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreTriggerRef = useRef<HTMLDivElement>(null);

  // Get shelf parameter from URL
  const shelfParam = searchParams.get('shelf');
  const [activeShelf, setActiveShelf] = useState<string | null>(shelfParam);
  const [shelfName, setShelfName] = useState<string>('');

  // Get shelf name based on the parameter
  useEffect(() => {
    if (!shelfParam) {
      setActiveShelf(null);
      return;
    }

    setActiveShelf(shelfParam);

    if (shelfParam === 'savedForLater') {
      setShelfName('Saved for Later');
    } else if (shelfParam === 'learningGoals') {
      setShelfName('2025 Learning Goals');
    } else {
      const fetchShelfName = async () => {
        try {
          const { data, error } = await supabase
            .from('custom_shelves')
            .select('name')
            .eq('id', shelfParam)
            .single();

          if (error) throw error;
          if (data) {
            setShelfName(data.name);
          }
        } catch (err) {
          console.error('Error fetching shelf name:', err);
          setShelfName('Custom Shelf');
        }
      };

      fetchShelfName();
    }
  }, [shelfParam]);

  // Load content for a specific type with pagination
  const loadContentType = useCallback(async (
    contentType: 'audiobooks' | 'ebooks' | 'articles' | 'podcasts',
    page: number = 0,
    category?: string
  ) => {
    try {
      const offset = page * ITEMS_PER_PAGE;
      let query;
      let table: string;

      // Determine table and setup query
      switch (contentType) {
        case 'audiobooks':
          table = 'audiobooks';
          query = supabase
            .from(table)
            .select(`
              id,
              title,
              description,
              cover_url,
              created_at,
              featured,
              category,
              view_count,
              author:profiles!audiobooks_author_id_fkey (
                id,
                name,
                avatar_url,
                username
              )
            `);
          break;
        case 'ebooks':
          table = 'books';
          query = supabase
            .from(table)
            .select(`
              id,
              title,
              description,
              cover_url,
              created_at,
              featured,
              category,
              view_count,
              author:profiles!books_author_id_fkey (
                id,
                name,
                avatar_url,
                username
              )
            `);
          break;
        case 'articles':
          table = 'articles';
          query = supabase
            .from(table)
            .select(`
              id,
              title,
              excerpt,
              content,
              cover_url,
              created_at,
              featured,
              category,
              view_count,
              author:profiles!articles_author_id_fkey (
                id,
                name,
                avatar_url,
                username
              )
            `);
          break;
        case 'podcasts':
          table = 'podcast_episodes';
          query = supabase
            .from(table)
            .select(`
              id,
              title,
              description,
              cover_url,
              duration,
              created_at,
              featured,
              category,
              view_count,
              author:profiles!podcast_episodes_author_id_fkey (
                id,
                name,
                avatar_url,
                username
              )
            `);
          break;
      }

      // Apply filters
      query = query.eq('status', 'published');
      
      if (category && category !== 'all') {
        query = query.eq('category', category);
      }

      // Apply pagination and ordering
      query = query
        .order('featured', { ascending: false })
        .order('created_at', { ascending: false })
        .range(offset, offset + ITEMS_PER_PAGE - 1);

      const { data, error } = await query;

      if (error) throw error;

      // Transform data to ContentItem format
      const items: ContentItem[] = (data || []).map(item => {
        const baseItem = {
          id: item.id,
          title: item.title,
          thumbnail: item.cover_url || `https://source.unsplash.com/random/800x600?${contentType}&sig=${item.id}`,
          views: item.view_count || 0,
          createdAt: item.created_at,
          creator: {
            id: item.author.id,
            name: item.author.name || item.author.username,
            avatar: item.author.avatar_url || `https://source.unsplash.com/random/100x100?face&sig=${item.author.id}`,
            username: item.author.username,
            followers: 0
          },
          category: item.category || contentType,
          featured: item.featured,
          rating: 4.5,
          bookmarked: false // Will be updated later if user is logged in
        };

        // Add type-specific properties
        switch (contentType) {
          case 'audiobooks':
            return {
              ...baseItem,
              type: 'audiobook' as const,
              duration: '2 hours'
            };
          case 'ebooks':
            return {
              ...baseItem,
              type: 'ebook' as const,
              duration: '4 hours'
            };
          case 'articles':
            const wordCount = (item as any).content?.trim().split(/\s+/).length || 1000;
            const readTime = Math.ceil(wordCount / 200);
            return {
              ...baseItem,
              type: 'article' as const,
              duration: `${readTime} min read`
            };
          case 'podcasts':
            return {
              ...baseItem,
              type: 'podcast' as const,
              duration: (item as any).duration || '30 min'
            };
        }
      });

      return {
        items,
        hasMore: data.length === ITEMS_PER_PAGE
      };
    } catch (error) {
      console.error(`Error loading ${contentType}:`, error);
      return { items: [], hasMore: false };
    }
  }, []);

  // Load initial content
  const loadInitialContent = useCallback(async () => {
    if (initialLoadComplete) return;

    try {
      setLoading(true);
      setError(null);

      console.log('Loading initial content...');

      // Load initial pages for all content types in parallel
      const [audiobooksResult, booksResult, articlesResult, podcastsResult] = await Promise.all([
        loadContentType('audiobooks', 0, selectedCategory === 'all' ? undefined : selectedCategory),
        loadContentType('ebooks', 0, selectedCategory === 'all' ? undefined : selectedCategory),
        loadContentType('articles', 0, selectedCategory === 'all' ? undefined : selectedCategory),
        loadContentType('podcasts', 0, selectedCategory === 'all' ? undefined : selectedCategory)
      ]);

      // Get user bookmarks if logged in
      let userBookmarks: { content_id: string; content_type: string }[] = [];
      if (user) {
        const { data: bookmarksData } = await supabase
          .from('bookmarks')
          .select('content_id, content_type')
          .eq('user_id', user.id);
        
        userBookmarks = bookmarksData || [];
      }

      const isBookmarked = (id: string, type: string) => {
        return userBookmarks.some(b => b.content_id === id && b.content_type === type);
      };

      // Update bookmarked status
      const updateBookmarkStatus = (items: ContentItem[]) => {
        return items.map(item => ({
          ...item,
          bookmarked: isBookmarked(item.id, item.type)
        }));
      };

      const contentData = {
        audiobooks: updateBookmarkStatus(audiobooksResult.items),
        ebooks: updateBookmarkStatus(booksResult.items),
        articles: updateBookmarkStatus(articlesResult.items),
        podcasts: updateBookmarkStatus(podcastsResult.items)
      };

      const hasMoreData = {
        audiobooks: audiobooksResult.hasMore,
        ebooks: booksResult.hasMore,
        articles: articlesResult.hasMore,
        podcasts: podcastsResult.hasMore
      };

      setAllContent(contentData);
      setHasMore(hasMoreData);
      setCurrentPage({
        audiobooks: 1,
        ebooks: 1,
        articles: 1,
        podcasts: 1
      });

      console.log('Initial content loaded:', {
        audiobooks: contentData.audiobooks.length,
        ebooks: contentData.ebooks.length,
        articles: contentData.articles.length,
        podcasts: contentData.podcasts.length
      });

    } catch (err) {
      console.error('Error loading initial content:', err);
      setError(err instanceof Error ? err.message : 'Failed to load content');
    } finally {
      setLoading(false);
      setInitialLoadComplete(true);
    }
  }, [loadContentType, selectedCategory, user, initialLoadComplete]);

  // Load more content for a specific type
  const loadMoreContent = useCallback(async (contentType: 'audiobooks' | 'ebooks' | 'articles' | 'podcasts') => {
    if (!hasMore[contentType] || loadingMore) return;

    try {
      setLoadingMore(true);
      
      const nextPage = currentPage[contentType];
      const result = await loadContentType(contentType, nextPage, selectedCategory === 'all' ? undefined : selectedCategory);

      if (result.items.length > 0) {
        // Get user bookmarks for new items
        let userBookmarks: { content_id: string; content_type: string }[] = [];
        if (user) {
          const { data: bookmarksData } = await supabase
            .from('bookmarks')
            .select('content_id, content_type')
            .eq('user_id', user.id);
          
          userBookmarks = bookmarksData || [];
        }

        const isBookmarked = (id: string, type: string) => {
          return userBookmarks.some(b => b.content_id === id && b.content_type === type);
        };

        const newItems = result.items.map(item => ({
          ...item,
          bookmarked: isBookmarked(item.id, item.type)
        }));

        setAllContent(prev => ({
          ...prev,
          [contentType]: [...prev[contentType], ...newItems]
        }));

        setCurrentPage(prev => ({
          ...prev,
          [contentType]: prev[contentType] + 1
        }));
      }

      setHasMore(prev => ({
        ...prev,
        [contentType]: result.hasMore
      }));

    } catch (error) {
      console.error(`Error loading more ${contentType}:`, error);
    } finally {
      setLoadingMore(false);
    }
  }, [loadContentType, selectedCategory, user, hasMore, loadingMore, currentPage]);

  // Setup intersection observer for infinite scroll
  useEffect(() => {
    if (observerRef.current) {
      observerRef.current.disconnect();
    }

    observerRef.current = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting && !loadingMore && initialLoadComplete) {
          // Load more content for types that have more available
          const typesToLoad = Object.entries(hasMore)
            .filter(([_, hasMoreItems]) => hasMoreItems)
            .map(([type]) => type as keyof typeof hasMore);

          if (typesToLoad.length > 0) {
            // Load more for the first available type
            loadMoreContent(typesToLoad[0]);
          }
        }
      },
      {
        rootMargin: '200px', // Start loading 200px before the trigger element
        threshold: 0.1
      }
    );

    if (loadMoreTriggerRef.current) {
      observerRef.current.observe(loadMoreTriggerRef.current);
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [loadMoreContent, loadingMore, initialLoadComplete, hasMore]);

  // Load initial content
  useEffect(() => {
    if (!initialLoadComplete) {
      loadInitialContent();
    }
  }, [loadInitialContent]);

  // Reset content when category changes
  useEffect(() => {
    if (initialLoadComplete) {
      setAllContent({
        audiobooks: [],
        ebooks: [],
        articles: [],
        podcasts: []
      });
      setHasMore({
        audiobooks: true,
        ebooks: true,
        articles: true,
        podcasts: true
      });
      setCurrentPage({
        audiobooks: 0,
        ebooks: 0,
        articles: 0,
        podcasts: 0
      });
      setInitialLoadComplete(false);
    }
  }, [selectedCategory]);

  // Filter content based on selected category (client-side filtering for instant response)
  const filteredContent = useMemo(() => {
    if (selectedCategory === 'all') {
      return allContent;
    }

    const filterByCategory = (items: ContentItem[]) => {
      return items.filter(item => 
        item.category && item.category.toLowerCase() === selectedCategory.toLowerCase()
      );
    };

    return {
      audiobooks: filterByCategory(allContent.audiobooks),
      ebooks: filterByCategory(allContent.ebooks),
      articles: filterByCategory(allContent.articles),
      podcasts: filterByCategory(allContent.podcasts)
    };
  }, [allContent, selectedCategory]);

  // Check if category has any content
  const hasContent = useMemo(() => {
    const { audiobooks, ebooks, articles, podcasts } = filteredContent;
    return audiobooks.length > 0 || ebooks.length > 0 || articles.length > 0 || podcasts.length > 0;
  }, [filteredContent]);

  const handleAddToShelf = async (contentId: string, contentType: string) => {
    if (!user || !activeShelf) return;

    try {
      if (activeShelf === 'savedForLater' || activeShelf === 'learningGoals') {
        const { error } = await supabase
          .from('bookmarks')
          .insert({
            user_id: user.id,
            content_id: contentId,
            content_type: contentType
          });

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('shelf_items')
          .insert({
            shelf_id: activeShelf,
            content_id: contentId,
            content_type: contentType
          });

        if (error) throw error;
      }

      // Update the UI to show the item as bookmarked
      setAllContent(prev => ({
        audiobooks: prev.audiobooks.map(item => 
          item.id === contentId && item.type === contentType 
            ? { ...item, bookmarked: true } 
            : item
        ),
        ebooks: prev.ebooks.map(item => 
          item.id === contentId && item.type === contentType 
            ? { ...item, bookmarked: true } 
            : item
        ),
        articles: prev.articles.map(item => 
          item.id === contentId && item.type === contentType 
            ? { ...item, bookmarked: true } 
            : item
        ),
        podcasts: prev.podcasts.map(item => 
          item.id === contentId && item.type === contentType 
            ? { ...item, bookmarked: true } 
            : item
        )
      }));
    } catch (error) {
      console.error('Error adding to shelf:', error);
    }
  };

  // Show loading only on initial load
  if (loading && !initialLoadComplete) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading content...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-[400px] flex items-center justify-center text-center">
        <div className="space-y-4">
          <AlertCircle className="w-12 h-12 text-destructive mx-auto" />
          <div>
            <h3 className="text-lg font-medium">Something went wrong</h3>
            <p className="text-muted-foreground">{error}</p>
          </div>
          <button
            onClick={() => {
              contentCache.clear();
              setInitialLoadComplete(false);
              setError(null);
            }}
            className="px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  // Show "no content" message if category has no content
  if (initialLoadComplete && !hasContent && selectedCategory !== 'all') {
    return (
      <div className="min-h-[400px] flex items-center justify-center text-center">
        <div className="space-y-4 max-w-md">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
            <AlertCircle className="w-8 h-8 text-primary" />
          </div>
          <div>
            <h3 className="text-xl font-semibold">No content in {selectedCategory}</h3>
            <p className="text-muted-foreground mt-2">
              We don't have any content in this category yet, but we're working on it! 
              Check back soon for new additions.
            </p>
          </div>
          <button
            onClick={() => {
              // Reset to "All" category by updating the URL
              window.history.pushState({}, '', '/');
              window.location.reload();
            }}
            className="px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            Browse All Content
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      {activeShelf && (
        <AddToShelfBanner 
          shelfName={shelfName}
          onClose={() => {
            const newSearchParams = new URLSearchParams(searchParams);
            newSearchParams.delete('shelf');
            window.history.replaceState(
              {},
              '',
              `${window.location.pathname}?${newSearchParams.toString()}`
            );
            setActiveShelf(null);
          }}
        />
      )}
      <div className="mt-2">
        <ContentLayout
          audiobooks={filteredContent.audiobooks}
          ebooks={filteredContent.ebooks}
          articles={filteredContent.articles}
          podcasts={filteredContent.podcasts}
          activeShelf={activeShelf}
          onAddToShelf={handleAddToShelf}
          onLoadMore={loadMoreContent}
          hasMore={hasMore}
          loadingMore={loadingMore}
        />
        
        {/* Infinite scroll trigger */}
        {(hasMore.audiobooks || hasMore.ebooks || hasMore.articles || hasMore.podcasts) && (
          <div 
            ref={loadMoreTriggerRef} 
            className="h-20 flex items-center justify-center mt-8"
          >
            {loadingMore ? (
              <div className="flex items-center gap-2">
                <Loader2 className="w-5 h-5 animate-spin text-primary" />
                <span className="text-sm text-muted-foreground">Loading more content...</span>
              </div>
            ) : (
              <div className="animate-pulse flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-primary/50"></div>
                <div className="w-2 h-2 rounded-full bg-primary/50"></div>
                <div className="w-2 h-2 rounded-full bg-primary/50"></div>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}