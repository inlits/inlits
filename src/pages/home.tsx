import React, { useState, useEffect, useMemo } from 'react';
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

// Immediate skeleton data for instant display
const createSkeletonContent = (count: number, type: string): ContentItem[] => {
  return Array.from({ length: count }, (_, i) => ({
    id: `skeleton-${type}-${i}`,
    type: type as any,
    title: 'Loading...',
    thumbnail: `https://source.unsplash.com/random/800x600?${type}&sig=skeleton-${i}`,
    duration: type === 'article' ? '5 min read' : '30 min',
    views: 0,
    createdAt: new Date().toISOString(),
    creator: {
      id: `skeleton-creator-${i}`,
      name: 'Loading...',
      avatar: `https://source.unsplash.com/random/100x100?face&sig=skeleton-${i}`,
      followers: 0
    },
    category: 'Loading',
    featured: false,
    rating: 4.5,
    bookmarked: false
  }));
};

// Cache for content data with timestamps
const contentCache = new Map<string, {
  data: {
    audiobooks: ContentItem[];
    ebooks: ContentItem[];
    articles: ContentItem[];
    podcasts: ContentItem[];
  };
  timestamp: number;
}>();

const CACHE_DURATION = 2 * 60 * 1000; // 2 minutes for faster updates

export function Home({ selectedCategory = 'all' }: HomeProps) {
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const [allContent, setAllContent] = useState<{
    audiobooks: ContentItem[];
    ebooks: ContentItem[];
    articles: ContentItem[];
    podcasts: ContentItem[];
  }>({
    // Start with skeleton content for instant display
    audiobooks: createSkeletonContent(8, 'audiobook'),
    ebooks: createSkeletonContent(8, 'ebook'),
    articles: createSkeletonContent(6, 'article'),
    podcasts: createSkeletonContent(6, 'podcast')
  });
  const [loading, setLoading] = useState(false); // Don't start with loading true
  const [error, setError] = useState<string | null>(null);
  const [isSkeletonData, setIsSkeletonData] = useState(true);

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

  // Load content progressively
  useEffect(() => {
    const loadContent = async () => {
      // Check cache first
      const cacheKey = 'all-content';
      const cached = contentCache.get(cacheKey);
      
      if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
        console.log('Using cached content');
        setAllContent(cached.data);
        setIsSkeletonData(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        console.log('Loading fresh content from database...');

        // Load content types in sequence for faster perceived loading
        // Start with featured content first
        const loadContentType = async (table: string, type: string) => {
          try {
            const { data, error } = await supabase
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
                ${table === 'articles' ? 'content, excerpt,' : ''}
                ${table === 'podcast_episodes' ? 'duration,' : ''}
                ${table === 'audiobooks' ? 'narrator,' : ''}
                author:profiles!${table}_author_id_fkey (
                  id,
                  name,
                  avatar_url,
                  username
                )
              `)
              .eq('status', 'published')
              .order('featured', { ascending: false })
              .order('created_at', { ascending: false })
              .limit(20); // Limit initial load

            if (error) throw error;

            return (data || []).map(item => {
              // Calculate read time for articles
              const calculateReadTime = (content: string): string => {
                const wordsPerMinute = 200;
                const words = content.trim().split(/\s+/).length;
                const minutes = Math.ceil(words / wordsPerMinute);
                return `${minutes} min read`;
              };

              return {
                id: item.id,
                type: type as any,
                title: item.title,
                thumbnail: item.cover_url || `https://source.unsplash.com/random/800x600?${type}&sig=${item.id}`,
                duration: item.duration || (type === 'article' && item.content ? calculateReadTime(item.content) : '30 min'),
                views: item.view_count || 0,
                createdAt: item.created_at,
                creator: {
                  id: item.author.id,
                  name: item.author.name || item.author.username,
                  avatar: item.author.avatar_url || `https://source.unsplash.com/random/100x100?face&sig=${item.author.id}`,
                  username: item.author.username,
                  followers: 0
                },
                category: item.category || type,
                featured: item.featured,
                rating: 4.5,
                bookmarked: false
              };
            });
          } catch (error) {
            console.error(`Error loading ${table}:`, error);
            return [];
          }
        };

        // Load featured content first for immediate display
        const [featuredAudiobooks, featuredBooks] = await Promise.all([
          supabase
            .from('audiobooks')
            .select(`
              id, title, description, cover_url, created_at, featured, category, view_count,
              author:profiles!audiobooks_author_id_fkey (id, name, avatar_url, username)
            `)
            .eq('status', 'published')
            .eq('featured', true)
            .order('created_at', { ascending: false })
            .limit(8),
          supabase
            .from('books')
            .select(`
              id, title, description, cover_url, created_at, featured, category, view_count,
              author:profiles!books_author_id_fkey (id, name, avatar_url, username)
            `)
            .eq('status', 'published')
            .eq('featured', true)
            .order('created_at', { ascending: false })
            .limit(8)
        ]);

        // Process featured content immediately
        const processContent = (data: any[], type: string) => {
          return (data || []).map(item => ({
            id: item.id,
            type: type as any,
            title: item.title,
            thumbnail: item.cover_url || `https://source.unsplash.com/random/800x600?${type}&sig=${item.id}`,
            duration: type === 'article' ? '5 min read' : '30 min',
            views: item.view_count || 0,
            createdAt: item.created_at,
            creator: {
              id: item.author.id,
              name: item.author.name || item.author.username,
              avatar: item.author.avatar_url || `https://source.unsplash.com/random/100x100?face&sig=${item.author.id}`,
              username: item.author.username,
              followers: 0
            },
            category: item.category || type,
            featured: item.featured,
            rating: 4.5,
            bookmarked: false
          }));
        };

        // Update with featured content first
        const featuredContent = {
          audiobooks: processContent(featuredAudiobooks.data, 'audiobook'),
          ebooks: processContent(featuredBooks.data, 'ebook'),
          articles: [],
          podcasts: []
        };

        setAllContent(featuredContent);
        setIsSkeletonData(false);

        // Load remaining content in background
        const [allAudiobooks, allBooks, allArticles, allPodcasts] = await Promise.all([
          loadContentType('audiobooks', 'audiobook'),
          loadContentType('books', 'ebook'),
          loadContentType('articles', 'article'),
          loadContentType('podcast_episodes', 'podcast')
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

        const finalContent = {
          audiobooks: updateBookmarkStatus(allAudiobooks),
          ebooks: updateBookmarkStatus(allBooks),
          articles: updateBookmarkStatus(allArticles),
          podcasts: updateBookmarkStatus(allPodcasts)
        };

        // Cache the data
        contentCache.set(cacheKey, {
          data: finalContent,
          timestamp: Date.now()
        });

        setAllContent(finalContent);
        console.log('All content loaded:', {
          audiobooks: allAudiobooks.length,
          books: allBooks.length,
          articles: allArticles.length,
          podcasts: allPodcasts.length
        });

      } catch (err) {
        console.error('Error loading content:', err);
        setError(err instanceof Error ? err.message : 'Failed to load content');
        // Keep skeleton data on error
      } finally {
        setLoading(false);
      }
    };

    loadContent();
  }, [user]);

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

  if (error && isSkeletonData) {
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
              setError(null);
              window.location.reload();
            }}
            className="px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  // Show "no content" message only if we have real data and no content
  if (!isSkeletonData && !hasContent && selectedCategory !== 'all') {
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
          isSkeletonData={isSkeletonData}
        />
        
        {/* Loading indicator for background loading */}
        {loading && !isSkeletonData && (
          <div className="fixed bottom-4 right-4 bg-background/90 backdrop-blur-sm border rounded-lg p-3 shadow-lg">
            <div className="flex items-center gap-2 text-sm">
              <Loader2 className="w-4 h-4 animate-spin text-primary" />
              <span className="text-muted-foreground">Loading more content...</span>
            </div>
          </div>
        )}
      </div>
    </>
  );
}