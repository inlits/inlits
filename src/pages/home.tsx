import React, { useState, useEffect, useRef } from 'react';
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

export function Home({ selectedCategory = 'all' }: HomeProps) {
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [content, setContent] = useState<{
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
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const loadingMoreRef = useRef(false);

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

    // Set shelf name based on parameter
    if (shelfParam === 'savedForLater') {
      setShelfName('Saved for Later');
    } else if (shelfParam === 'learningGoals') {
      setShelfName('2025 Learning Goals');
    } else {
      // For custom shelves, fetch the name from the database
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

  const loadContent = async (pageNum = 1, append = false) => {
    try {
      if (loadingMoreRef.current) return;
      
      if (pageNum === 1) {
        setLoading(true);
      }
      
      loadingMoreRef.current = true;
      setError(null);

      // Load content in parallel with category filter
      const [audiobooksData, booksData, articlesData, podcastsData] = await Promise.all([
        // Load audiobooks
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
              avatar_url
            )
          `)
          .eq('status', 'published')
          .eq(selectedCategory !== 'all' ? 'category' : 'status', selectedCategory !== 'all' ? selectedCategory : 'published')
          .order('featured', { ascending: false })
          .order('created_at', { ascending: false })
          .range((pageNum - 1) * 28, pageNum * 28 - 1),

        // Load books
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
              avatar_url
            )
          `)
          .eq('status', 'published')
          .eq(selectedCategory !== 'all' ? 'category' : 'status', selectedCategory !== 'all' ? selectedCategory : 'published')
          .order('featured', { ascending: false })
          .order('created_at', { ascending: false })
          .range((pageNum - 1) * 28, pageNum * 28 - 1),

        // Load articles
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
              avatar_url
            )
          `)
          .eq('status', 'published')
          .eq(selectedCategory !== 'all' ? 'category' : 'status', selectedCategory !== 'all' ? selectedCategory : 'published')
          .order('featured', { ascending: false })
          .order('created_at', { ascending: false })
          .range((pageNum - 1) * 20, pageNum * 20 - 1),

        // Load podcasts
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
              avatar_url
            )
          `)
          .eq('status', 'published')
          .eq(selectedCategory !== 'all' ? 'category' : 'status', selectedCategory !== 'all' ? selectedCategory : 'published')
          .order('featured', { ascending: false })
          .order('created_at', { ascending: false })
          .range((pageNum - 1) * 20, pageNum * 20 - 1)
      ]);

      // Calculate read time for articles based on content length
      const calculateReadTime = (content: string): string => {
        const wordsPerMinute = 200;
        const words = content.trim().split(/\s+/).length;
        const minutes = Math.ceil(words / wordsPerMinute);
        return `${minutes} min read`;
      };

      // If user is logged in, get their bookmarks to mark items as bookmarked
      let userBookmarks: { content_id: string; content_type: string }[] = [];
      if (user) {
        const { data: bookmarksData } = await supabase
          .from('bookmarks')
          .select('content_id, content_type')
          .eq('user_id', user.id);
        
        userBookmarks = bookmarksData || [];
      }

      // Check if an item is bookmarked
      const isBookmarked = (id: string, type: string) => {
        return userBookmarks.some(b => b.content_id === id && b.content_type === type);
      };

      // Transform data to ContentItem format
      const audiobooks = (audiobooksData.data || []).map(item => ({
        id: item.id,
        type: 'audiobook' as const,
        title: item.title,
        thumbnail: item.cover_url || `https://source.unsplash.com/random/800x1200?audiobook&sig=${item.id}`,
        duration: '2 hours', // TODO: Calculate from chapters
        views: 0, // Will be implemented with content_views
        createdAt: item.created_at,
        creator: {
          id: item.author.id,
          name: item.author.name,
          avatar: item.author.avatar_url || `https://source.unsplash.com/random/100x100?face&sig=${item.author.id}`,
          followers: 0 // Will be implemented with followers
        },
        category: item.category || 'Audiobook',
        featured: item.featured,
        bookmarked: isBookmarked(item.id, 'audiobook')
      }));

      const books = (booksData.data || []).map(item => ({
        id: item.id,
        type: 'ebook' as const,
        title: item.title,
        thumbnail: item.cover_url || `https://source.unsplash.com/random/800x1200?book&sig=${item.id}`,
        duration: '4 hours', // TODO: Calculate based on content length
        views: 0,
        createdAt: item.created_at,
        creator: {
          id: item.author.id,
          name: item.author.name,
          avatar: item.author.avatar_url || `https://source.unsplash.com/random/100x100?face&sig=${item.author.id}`,
          followers: 0
        },
        category: item.category || 'Book',
        featured: item.featured,
        bookmarked: isBookmarked(item.id, 'book')
      }));

      const articles = (articlesData.data || []).map(item => ({
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
          followers: 0
        },
        category: item.category || 'Article',
        featured: item.featured,
        bookmarked: isBookmarked(item.id, 'article')
      }));

      const podcasts = (podcastsData.data || []).map(item => ({
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
          followers: 0
        },
        category: item.category || 'Podcast',
        featured: item.featured,
        bookmarked: isBookmarked(item.id, 'podcast')
      }));

      // Check if we have more content to load
      const hasMoreContent = 
        audiobooksData.data?.length === 28 || 
        booksData.data?.length === 28 || 
        articlesData.data?.length === 20 || 
        podcastsData.data?.length === 20;
      
      setHasMore(hasMoreContent);

      if (append) {
        setContent(prev => ({
          audiobooks: [...prev.audiobooks, ...audiobooks],
          ebooks: [...prev.ebooks, ...books],
          articles: [...prev.articles, ...articles],
          podcasts: [...prev.podcasts, ...podcasts]
        }));
      } else {
        setContent({
          audiobooks,
          ebooks: books,
          articles,
          podcasts
        });
      }
    } catch (err) {
      console.error('Error loading content:', err);
      setError(err instanceof Error ? err.message : 'Failed to load content');
    } finally {
      setLoading(false);
      loadingMoreRef.current = false;
    }
  };

  useEffect(() => {
    setPage(1);
    loadContent(1, false);
  }, [selectedCategory, user]); // Add user as dependency to refresh when user changes

  // Setup intersection observer for infinite scrolling
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading && !loadingMoreRef.current) {
          const nextPage = page + 1;
          setPage(nextPage);
          loadContent(nextPage, true);
        }
      },
      { threshold: 0.1 }
    );

    // Add observer to a sentinel element at the bottom of the content
    const sentinel = document.getElementById('infinite-scroll-sentinel');
    if (sentinel) {
      observer.observe(sentinel);
    }

    return () => {
      if (sentinel) {
        observer.unobserve(sentinel);
      }
    };
  }, [hasMore, loading, page]);

  const handleAddToShelf = async (contentId: string, contentType: string) => {
    if (!user || !activeShelf) return;

    try {
      // For default shelves, add to bookmarks
      if (activeShelf === 'savedForLater') {
        const { error } = await supabase
          .from('bookmarks')
          .insert({
            user_id: user.id,
            content_id: contentId,
            content_type: contentType
          });

        if (error) throw error;
      } 
      // For learning goals shelf
      else if (activeShelf === 'learningGoals') {
        // Here you would implement the logic to add to learning goals
        // For now, we'll just add it as a bookmark with a special tag
        const { error } = await supabase
          .from('bookmarks')
          .insert({
            user_id: user.id,
            content_id: contentId,
            content_type: contentType
          });

        if (error) throw error;
      }
      // For custom shelves, add to shelf_items
      else {
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
      setContent(prev => ({
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

  if (loading && page === 1) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error && page === 1) {
    return (
      <div className="min-h-[400px] flex items-center justify-center text-center">
        <div className="space-y-2">
          <p className="text-destructive">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="text-sm text-primary hover:underline"
          >
            Try again
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
            // Remove the shelf parameter from the URL
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
          audiobooks={content.audiobooks}
          ebooks={content.ebooks}
          articles={content.articles}
          podcasts={content.podcasts}
          activeShelf={activeShelf}
          onAddToShelf={handleAddToShelf}
        />
        
        {/* Infinite scroll sentinel */}
        <div 
          id="infinite-scroll-sentinel" 
          className="h-20 flex items-center justify-center"
        >
          {hasMore && page > 1 && (
            <div className="animate-pulse flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-primary/50"></div>
              <div className="w-2 h-2 rounded-full bg-primary/50"></div>
              <div className="w-2 h-2 rounded-full bg-primary/50"></div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}