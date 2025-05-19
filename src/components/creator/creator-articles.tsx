import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Clock, Star, Filter, ArrowUpDown, AlertCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import type { Profile } from '@/lib/types';

interface Article {
  id: string;
  title: string;
  excerpt: string;
  content: string;
  cover_url: string;
  category: string;
  status: string;
  created_at: string;
  views: number;
  rating: number;
}

interface CreatorArticlesProps {
  profile: Profile;
}

export function CreatorArticles({ profile }: CreatorArticlesProps) {
  const { user } = useAuth();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'recent' | 'popular'>('recent');
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const isOwnProfile = user?.id === profile.id;

  useEffect(() => {
    const loadArticles = async () => {
      try {
        setLoading(true);
        setError(null);

        // First get the articles
        const { data: articlesData, error: articlesError } = await supabase
          .from('articles')
          .select('*')
          .eq('author_id', profile.id)
          .eq('status', 'published')
          .order(sortBy === 'recent' ? 'created_at' : 'views', { ascending: false });

        if (articlesError) throw articlesError;

        // Then get views and ratings for each article
        const articlesWithStats = await Promise.all(
          (articlesData || []).map(async (article) => {
            // Get views
            const { count: viewCount } = await supabase
              .from('content_views')
              .select('*', { count: 'exact', head: true })
              .eq('content_id', article.id)
              .eq('content_type', 'article');

            // Get average rating
            const { data: ratings } = await supabase
              .from('ratings')
              .select('rating')
              .eq('content_id', article.id)
              .eq('content_type', 'article');

            const avgRating = ratings?.length 
              ? ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length 
              : 0;

            // Calculate read time based on content length
            const wordCount = article.content.trim().split(/\s+/).length;
            const readTime = Math.max(1, Math.ceil(wordCount / 200)); // Assuming 200 words per minute

            return {
              ...article,
              excerpt: article.excerpt || article.content.substring(0, 150) + '...',
              views: viewCount || 0,
              rating: avgRating,
              readTime
            };
          })
        );

        setArticles(articlesWithStats);
      } catch (err) {
        console.error('Error loading articles:', err);
        setError(err instanceof Error ? err.message : 'Failed to load articles');
      } finally {
        setLoading(false);
      }
    };

    loadArticles();
  }, [profile.id, sortBy]);

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="animate-pulse">
            <div className="flex gap-4">
              <div className="w-48 h-32 bg-muted rounded-lg" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-muted rounded w-3/4" />
                <div className="h-3 bg-muted rounded w-1/2" />
                <div className="h-3 bg-muted rounded w-1/4" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="w-12 h-12 text-destructive mx-auto" />
        <h3 className="mt-4 text-lg font-medium">Failed to load articles</h3>
        <p className="text-muted-foreground">{error}</p>
      </div>
    );
  }

  if (articles.length === 0) {
    if (isOwnProfile) {
      return (
        <div className="text-center py-12">
          <h3 className="text-lg font-medium">No articles published yet</h3>
          <p className="text-muted-foreground mt-2">
            Articles you publish will appear here
          </p>
          <Link
            to={`/dashboard/${profile.username}/content/new/article`}
            className="inline-flex items-center justify-center px-4 py-2 mt-4 text-sm font-medium text-primary bg-primary/10 rounded-lg hover:bg-primary/20 transition-colors"
          >
            Create your first article
          </Link>
        </div>
      );
    }

    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-medium">No articles published yet</h3>
        <p className="text-muted-foreground mt-2">
          {profile.name || profile.username} hasn't published any articles yet
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Filters */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div>
          <h1 className="text-2xl font-semibold">Articles</h1>
          <p className="text-muted-foreground">
            Published articles by {profile.name || profile.username}
          </p>
        </div>

        <div className="flex gap-4">
          <div className="relative">
            <button className="flex items-center gap-2 px-4 py-2 rounded-lg border hover:border-primary/50 transition-colors">
              <Filter className="w-4 h-4" />
              <span className="text-sm">Filter</span>
            </button>
          </div>

          <div className="relative">
            <button 
              onClick={() => setSortBy(sortBy === 'recent' ? 'popular' : 'recent')}
              className="flex items-center gap-2 px-4 py-2 rounded-lg border hover:border-primary/50 transition-colors"
            >
              <ArrowUpDown className="w-4 h-4" />
              <span className="text-sm">{sortBy === 'recent' ? 'Most Recent' : 'Most Popular'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Articles Grid */}
      <div className="grid grid-cols-1 gap-6">
        {articles.map((article) => (
          <Link
            key={article.id}
            to={`/reader/article-${article.id}`}
            className="flex gap-6 p-4 rounded-lg border hover:border-primary/50 transition-colors"
          >
            {/* Thumbnail */}
            <div className="w-48 h-32 rounded-lg overflow-hidden bg-muted shrink-0">
              {article.cover_url ? (
                <img
                  src={article.cover_url}
                  alt={article.title}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    const img = e.target as HTMLImageElement;
                    img.src = `https://source.unsplash.com/random/400x300?writing&sig=${article.id}`;
                  }}
                />
              ) : (
                <img
                  src={`https://source.unsplash.com/random/400x300?writing&sig=${article.id}`}
                  alt={article.title}
                  className="w-full h-full object-cover"
                />
              )}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <h2 className="text-lg font-medium hover:text-primary transition-colors">
                {article.title}
              </h2>
              <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
                {article.excerpt}
              </p>
              <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Star className="w-4 h-4 fill-yellow-500 text-yellow-500" />
                  <span>{article.rating.toFixed(1)}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  <span>{article.readTime} min read</span>
                </div>
                <span>{article.views.toLocaleString()} views</span>
                <span>•</span>
                <span>{new Date(article.created_at).toLocaleDateString()}</span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}