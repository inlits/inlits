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

// Cache for content data
const contentCache = new Map<string, {
  data: {
    audiobooks: ContentItem[];
    ebooks: ContentItem[];
    articles: ContentItem[];
    podcasts: ContentItem[];
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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);

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

  // Load all content once and cache it
  useEffect(() => {
    const loadAllContent = async () => {
      // Check cache first
      const cacheKey = 'all-content';
      const cached = contentCache.get(cacheKey);
      
      if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
        console.log('Using cached content');
        setAllContent(cached.data);
        setLoading(false);
        setInitialLoadComplete(true);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        console.log('Loading fresh content from database...');

        // Load all content types in parallel
        const [audiobooksResult, booksResult, articlesResult, podcastsResult] = await Promise.all([
          supabase
            .from('audiobooks')
            .select(`
              id,
              title,
              description,
              cover_url,
              created_at,
              featured,
              category,
              author:profiles!audiobooks_author_id_fkey (
                id,
                name,
                avatar_url,
                username
              )
            `)
            .eq('status', 'published')
            .order('featured', { ascending: false })
            .order('created_at', { ascending: false }),

          supabase
            .from('books')
            .select(`
              id,
              title,
              description,
              cover_url,
              created_at,
              featured,
              category,
              author:profiles!books_author_id_fkey (
                id,
                name,
                avatar_url,
                username
              )
            `)
            .eq('status', 'published')
            .order('featured', { ascending: false })
            .order('created_at', { ascending: false }),

          supabase
            .from('articles')
            .select(`
              id,
              title,
              excerpt,
              content,
              cover_url,
              created_at,
              featured,
              category,
              author:profiles!articles_author_id_fkey (
                id,
                name,
                avatar_url,
                username
              )
            `)
            .eq('status', 'published')
            .order('featured', { ascending: false })
            .order('created_at', { ascending: false }),

          supabase
            .from('podcast_episodes')
            .select(`
              id,
              title,
              description,
              cover_url,
              duration,
              created_at,
              featured,
              category,
              author:profiles!podcast_episodes_author_id_fkey (
                id,
                name,
                avatar_url,
                username
              )
            `)
            .eq('status', 'published')
            .order('featured', { ascending: false })
            .order('created_at', { ascending: false })
        ]);

        // Check for errors
        if (audiobooksResult.error) {
          console.error('Audiobooks error:', audiobooksResult.error);
          throw new Error(`Failed to load audiobooks: ${audiobooksResult.error.message}`);
        }
        if (booksResult.error) {
          console.error('Books error:', booksResult.error);
          throw new Error(`Failed to load books: ${booksResult.error.message}`);
        }
        if (articlesResult.error) {
          console.error('Articles error:', articlesResult.error);
          throw new Error(`Failed to load articles: ${articlesResult.error.message}`);
        }
        if (podcastsResult.error) {
          console.error('Podcasts error:', podcastsResult.error);
          throw new Error(`Failed to load podcasts: ${podcastsResult.error.message}`);
        }

        console.log('Raw data loaded:', {
          audiobooks: audiobooksResult.data?.length || 0,
          books: booksResult.data?.length || 0,
          articles: articlesResult.data?.length || 0,
          podcasts: podcastsResult.data?.length || 0
        });

        // Calculate read time for articles
        const calculateReadTime = (content: string): string => {
          const wordsPerMinute = 200;
          const words = content.trim().split(/\s+/).length;
          const minutes = Math.ceil(words / wordsPerMinute);
          return `${minutes} min read`;
        };

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

        // Transform data to ContentItem format
        const audiobooks = (audiobooksResult.data || []).map(item => ({
          id: item.id,
          type: 'audiobook' as const,
          title: item.title,
          thumbnail: item.cover_url || `https://source.unsplash.com/random/800x1200?audiobook&sig=${item.id}`,
          duration: '2 hours',
          views: 0,
          createdAt: item.created_at,
          creator: {
            id: item.author.id,
            name: item.author.name,
            avatar: item.author.avatar_url || `https://source.unsplash.com/random/100x100?face&sig=${item.author.id}`,
            username: item.author.username,
            followers: 0
          },
          category: item.category || 'Audiobook',
          featured: item.featured,
          rating: 4.5,
          bookmarked: isBookmarked(item.id, 'audiobook')
        }));

        const books = (booksResult.data || []).map(item => ({
          id: item.id,
          type: 'ebook' as const,
          title: item.title,
          thumbnail: item.cover_url || `https://source.unsplash.com/random/800x1200?book&sig=${item.id}`,
          duration: '4 hours',
          views: 0,
          createdAt: item.created_at,
          creator: {
            id: item.author.id,
            name: item.author.name,
            avatar: item.author.avatar_url || `https://source.unsplash.com/random/100x100?face&sig=${item.author.id}`,
            username: item.author.username,
            followers: 0
          },
          category: item.category || 'Book',
          featured: item.featured,
          rating: 4.5,
          bookmarked: isBookmarked(item.id, 'book')
        }));

        const articles = (articlesResult.data || []).map(item => ({
          id: item.id,
          type: 'article' as const,
          title: item.title,
          thumbnail: item.cover_url || `https://source.unsplash.com/random/800x600?article&sig=${item.id}`,
          duration: calculateReadTime(item.content),
          views: 0,
          createdAt: item.created_at,
          creator: {
            id: item.author.id,
            name: item.author.name,
            avatar: item.author.avatar_url || `https://source.unsplash.com/random/100x100?face&sig=${item.author.id}`,
            username: item.author.username,
            followers: 0
          },
          category: item.category || 'Article',
          featured: item.featured,
          rating: 4.5,
          bookmarked: isBookmarked(item.id, 'article')
        }));

        const podcasts = (podcastsResult.data || []).map(item => ({
          id: item.id,
          type: 'podcast' as const,
          title: item.title,
          thumbnail: item.cover_url || `https://source.unsplash.com/random/800x600?podcast&sig=${item.id}`,
          duration: item.duration,
          views: 0,
          createdAt: item.created_at,
          creator: {
            id: item.author.id,
            name: item.author.name,
            avatar: item.author.avatar_url || `https://source.unsplash.com/random/100x100?face&sig=${item.author.id}`,
            username: item.author.username,
            followers: 0
          },
          category: item.category || 'Podcast',
          featured: item.featured,
          rating: 4.5,
          bookmarked: isBookmarked(item.id, 'podcast')
        }));

        const contentData = {
          audiobooks,
          ebooks: books,
          articles,
          podcasts
        };

        // Cache the data
        contentCache.set(cacheKey, {
          data: contentData,
          timestamp: Date.now()
        });

        setAllContent(contentData);
        console.log('Content loaded and cached:', {
          audiobooks: audiobooks.length,
          books: books.length,
          articles: articles.length,
          podcasts: podcasts.length
        });

      } catch (err) {
        console.error('Error loading content:', err);
        setError(err instanceof Error ? err.message : 'Failed to load content');
      } finally {
        setLoading(false);
        setInitialLoadComplete(true);
      }
    };

    // Only load if we haven't loaded before or cache is expired
    if (!initialLoadComplete) {
      loadAllContent();
    }
  }, [user, initialLoadComplete]);

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
        />
      </div>
    </>
  );
}