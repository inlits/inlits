import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Clock, Star, Filter, ArrowUpDown, BookOpen, Download, Lock, AlertCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import type { Profile } from '@/lib/types';

interface Book {
  id: string;
  title: string;
  description: string;
  cover_url: string;
  price: number;
  status: string;
  created_at: string;
  views: number;
  rating: number;
  isPremium: boolean;
  file_url?: string;
  category?: string;
  isFullBook?: boolean;
}

interface CreatorEbooksProps {
  profile: Profile;
}

export function CreatorEbooks({ profile }: CreatorEbooksProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'recent' | 'popular'>('recent');
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const isOwnProfile = user?.id === profile.id;

  useEffect(() => {
    const loadBooks = async () => {
      try {
        setLoading(true);
        setError(null);

        const { data: booksData, error: booksError } = await supabase
          .from('books')
          .select('*')
          .eq('author_id', profile.id)
          .eq('status', 'published')
          .order(sortBy === 'recent' ? 'created_at' : 'views', { ascending: false });

        if (booksError) throw booksError;

        const booksWithStats = await Promise.all(
          (booksData || []).map(async (book) => {
            const { count: viewCount } = await supabase
              .from('content_views')
              .select('*', { count: 'exact', head: true })
              .eq('content_id', book.id)
              .eq('content_type', 'book');

            const { data: ratings } = await supabase
              .from('ratings')
              .select('rating')
              .eq('content_id', book.id)
              .eq('content_type', 'book');

            const avgRating = ratings?.length 
              ? ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length 
              : 0;

            return {
              ...book,
              views: viewCount || 0,
              rating: avgRating,
              isPremium: book.price > 0
            };
          })
        );

        setBooks(booksWithStats);
      } catch (err) {
        console.error('Error loading books:', err);
        setError(err instanceof Error ? err.message : 'Failed to load books');
      } finally {
        setLoading(false);
      }
    };

    loadBooks();
  }, [profile.id, sortBy]);

  const handleReadNow = async (book: Book) => {
    if (!user && book.isPremium) {
      navigate('/signin');
      return;
    }

    try {
      // Record view
      if (user) {
        await supabase
          .from('content_views')
          .insert({
            content_id: book.id,
            content_type: 'book',
            viewer_id: user.id,
            viewed_at: new Date().toISOString()
          });
      }

      // Navigate to reader
      navigate(`/reader/book-${book.id}`);
    } catch (error) {
      console.error('Error recording view:', error);
    }
  };

  const handleDownload = async (book: Book) => {
    if (!user) return;

    try {
      // Record the download
      await supabase
        .from('content_views')
        .insert({
          content_id: book.id,
          content_type: 'book',
          viewer_id: user.id,
          viewed_at: new Date().toISOString()
        });

      // Redirect to file URL
      if (book.file_url) {
        window.open(book.file_url, '_blank');
      }
    } catch (error) {
      console.error('Error downloading book:', error);
    }
  };

  if (loading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="animate-pulse">
            <div className="aspect-[2/3] bg-muted rounded-lg mb-4" />
            <div className="space-y-2">
              <div className="h-4 bg-muted rounded w-3/4" />
              <div className="h-3 bg-muted rounded w-1/2" />
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
        <h3 className="mt-4 text-lg font-medium">Failed to load books</h3>
        <p className="text-muted-foreground">{error}</p>
      </div>
    );
  }

  if (books.length === 0) {
    if (isOwnProfile) {
      return (
        <div className="text-center py-12">
          <h3 className="text-lg font-medium">No books published yet</h3>
          <p className="text-muted-foreground mt-2">
            Books you publish will appear here
          </p>
          <Link
            to={`/dashboard/${profile.username}/content/new/book`}
            className="inline-flex items-center justify-center px-4 py-2 mt-4 text-sm font-medium text-primary bg-primary/10 rounded-lg hover:bg-primary/20 transition-colors"
          >
            Create your first book
          </Link>
        </div>
      );
    }

    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-medium">No books published yet</h3>
        <p className="text-muted-foreground mt-2">
          {profile.name || profile.username} hasn't published any books yet
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Filters */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div>
          <h1 className="text-2xl font-semibold">E-Books</h1>
          <p className="text-muted-foreground">
            Published books by {profile.name || profile.username}
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

      {/* Books Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-6">
        {books.map((book) => (
          <div
            key={book.id}
            className="flex flex-col bg-card border rounded-lg overflow-hidden hover:border-primary/50 transition-colors"
          >
            {/* Cover */}
            <div className="aspect-[2/3] relative">
              <img
                src={book.cover_url || `https://source.unsplash.com/random/400x600?book&sig=${book.id}`}
                alt={book.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              
              {/* Premium Badge */}
              {book.isPremium && (
                <div className="absolute top-2 right-2 px-2 py-1 rounded-full bg-primary text-primary-foreground text-xs font-medium">
                  Premium
                </div>
              )}
            </div>

            {/* Content */}
            <div className="flex-1 p-4">
              <div className="mb-2">
                <h3 className="font-medium line-clamp-2 hover:text-primary transition-colors">
                  {book.title}
                </h3>
                <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                  {book.description}
                </p>
              </div>

              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
                <div className="flex items-center gap-1">
                  <Star className="w-4 h-4 fill-yellow-500 text-yellow-500" />
                  <span>{book.rating.toFixed(1)}</span>
                </div>
                <span>•</span>
                <span>{book.views.toLocaleString()} readers</span>
              </div>

              <div className="flex gap-2 mt-auto">
                <button
                  onClick={() => handleReadNow(book)}
                  className="flex-1 px-3 py-1.5 text-sm text-center rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
                >
                  Read Now
                </button>
                {user ? (
                  <button
                    onClick={() => handleDownload(book)}
                    className="px-3 py-1.5 text-sm rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                    title="Download"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                ) : (
                  <Link
                    to="/signin"
                    className="px-3 py-1.5 text-sm rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                    title="Sign in to download"
                  >
                    <Lock className="w-4 h-4" />
                  </Link>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}