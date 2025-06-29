import React, { useState, useEffect } from 'react';
import { useParams, Navigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { EReader } from '@/components/reader/e-reader';
import { ArticleReader } from '@/components/reader/article-reader';
import { Loader2, AlertCircle } from 'lucide-react';
import { useAuth } from '@/lib/auth';

interface Article {
  id: string;
  title: string;
  content: string;
  author: {
    id: string;
    name: string;
    avatar: string;
    username?: string;
  };
  publishedAt: string;
  readTime: string;
  claps: number;
  comments: Comment[];
  category?: string;
  cover_url?: string;
}

interface Comment {
  id: string;
  author: {
    name: string;
    avatar: string;
    username?: string;
  };
  content: string;
  createdAt: string;
  likes: number;
  replies?: Comment[];
}

interface Chapter {
  id: string;
  title: string;
  content: string;
  order: number;
}

interface Book {
  id: string;
  title: string;
  content: string;
  chapters: Chapter[];
  author_id: string;
  price: number;
  status: string;
  file_url?: string;
  file_type?: string;
}

export function ReaderPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const [content, setContent] = useState<Article | Book | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Get content type and ID from the URL
  // Format: article-uuid or book-uuid
  const [contentType, contentId] = id?.includes('-') 
    ? [id.split('-')[0], id.substring(id.indexOf('-') + 1)] 
    : [null, null];

  // Record view
  const recordView = async () => {
    if (!contentType || !contentId) return;

    try {
      await supabase
        .from('content_views')
        .insert({
          content_id: contentId,
          content_type: contentType,
          viewer_id: user?.id || null,
          viewed_at: new Date().toISOString()
        });
    } catch (error) {
      console.error('Error recording view:', error);
    }
  };

  useEffect(() => {
    const loadContent = async () => {
      if (!contentType || !contentId) return;

      try {
        setLoading(true);
        setError(null);

        if (contentType === 'article') {
          // Load article with author info
          const { data: article, error: articleError } = await supabase
            .from('articles')
            .select(`
              *,
              author:profiles!articles_author_id_fkey (
                id,
                name,
                username,
                avatar_url
              )
            `)
            .eq('id', contentId)
            .eq('status', 'published')
            .single();

          if (articleError) throw articleError;
          if (!article) throw new Error('Article not found');

          // Get article stats
          const [viewsResponse, ratingsResponse, commentsResponse] = await Promise.all([
            supabase
              .from('content_views')
              .select('*', { count: 'exact', head: true })
              .eq('content_id', article.id)
              .eq('content_type', 'article'),
            supabase
              .from('ratings')
              .select('rating')
              .eq('content_id', article.id)
              .eq('content_type', 'article'),
            supabase
              .from('comments')
              .select(`
                *,
                author:profiles!comments_user_id_fkey (
                  id,
                  name,
                  username,
                  avatar_url
                )
              `)
              .eq('content_id', article.id)
              .eq('content_type', 'article')
              .order('created_at', { ascending: false })
          ]);

          // Calculate read time based on content length
          const wordCount = article.content.trim().split(/\s+/).length;
          const readTime = Math.max(1, Math.ceil(wordCount / 200)); // Assuming 200 words per minute

          setContent({
            id: article.id,
            title: article.title,
            content: article.content,
            author: {
              id: article.author.id,
              name: article.author.name || article.author.username,
              avatar: article.author.avatar_url || `https://source.unsplash.com/random/100x100?face&sig=${article.author.id}`,
              username: article.author.username
            },
            publishedAt: article.created_at,
            readTime: `${readTime} min read`,
            claps: article.view_count || 0,
            comments: (commentsResponse.data || []).map(comment => ({
              id: comment.id,
              author: {
                name: comment.author.name || comment.author.username,
                avatar: comment.author.avatar_url || `https://source.unsplash.com/random/100x100?face&sig=${comment.author.id}`,
                username: comment.author.username
              },
              content: comment.content,
              createdAt: comment.created_at,
              likes: 0 // TODO: Implement comment likes
            })),
            category: article.category,
            cover_url: article.cover_url
          });

        } else if (contentType === 'book') {
          // Load book with chapters
          const { data: book, error: bookError } = await supabase
            .from('books')
            .select(`
              *,
              book_chapters (
                id,
                title,
                content,
                "order"
              )
            `)
            .eq('id', contentId)
            .eq('status', 'published')
            .single();

          if (bookError) throw bookError;
          if (!book) throw new Error('Book not found');

          // Check if user has access to premium content
          if (book.price > 0 && !user) {
            throw new Error('Please sign in to access this book');
          }

          // Sort chapters by order
          const sortedChapters = book.book_chapters
            .sort((a: any, b: any) => a.order - b.order)
            .map((chapter: any) => ({
              id: chapter.id,
              title: chapter.title,
              content: chapter.content,
              order: chapter.order
            }));

          console.log('Book data:', {
            id: book.id,
            title: book.title,
            file_url: book.file_url,
            file_type: book.file_type,
            chapters: sortedChapters.length
          });

          setContent({
            id: book.id,
            title: book.title,
            content: '', // We'll use chapters instead
            chapters: sortedChapters,
            author_id: book.author_id,
            price: book.price,
            status: book.status,
            file_url: book.file_url,
            file_type: book.file_type
          });

          // Record view
          await recordView();
        }
      } catch (err) {
        console.error('Error loading content:', err);
        setError(err instanceof Error ? err.message : 'Failed to load content');
      } finally {
        setLoading(false);
      }
    };

    loadContent();
  }, [contentType, contentId, user?.id]);

  if (!contentType || !contentId) {
    return <Navigate to="/" replace />;
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading content...</p>
        </div>
      </div>
    );
  }

  if (error || !content) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="max-w-md text-center space-y-4">
          <AlertCircle className="w-12 h-12 text-destructive mx-auto" />
          <h1 className="text-2xl font-semibold">Content not found</h1>
          <p className="text-muted-foreground">
            {error || "The content you're looking for doesn't exist or has been removed."}
          </p>
          <button
            onClick={() => window.history.back()}
            className="text-primary hover:underline"
          >
            Go back
          </button>
        </div>
      </div>
    );
  }

  // Render appropriate component based on content type
  switch (contentType) {
    case 'book':
      return <EReader book={content as Book} />;
    case 'article':
      return <ArticleReader article={content as Article} />;
    default:
      return <Navigate to="/" replace />;
  }
}