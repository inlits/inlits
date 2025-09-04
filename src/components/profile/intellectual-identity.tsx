import React from 'react';
import { Book, Headphones, FileText, BookOpen } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/lib/auth';
import type { Profile } from '@/lib/types';

interface IntellectualIdentityProps {
  profile?: Profile;
  stats?: any;
  readingHistory?: any;
}

export function IntellectualIdentity({ profile, stats, readingHistory }: IntellectualIdentityProps) {
  const { profile: currentUserProfile } = useAuth();
  const isOwnProfile = !profile || (currentUserProfile?.id === profile.id);

  // Use real data if available, otherwise use mock data
  const readingStats = stats || {
    articles_read: 42,
    books_read: 15,
    audiobooks_listened: 8,
    total_content_viewed: 128,
  };

  // Get the first item from reading history if available
  const recentViews = readingHistory?.recent_views || [];
  const currentRead = recentViews.length > 0 ? recentViews[0] : {
    title: 'Atomic Habits',
    author: 'James Clear',
    progress: 50,
    type: 'book',
  };

  const readingPreferences = profile?.reading_preferences || ['Science Fiction', 'Psychology', 'Business'];
  const favoriteCategories = stats?.favorite_categories || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Intellectual Identity</h2>
        {isOwnProfile && (
          <Link to="/settings/account" className="text-sm text-primary hover:underline">
            Edit Preferences
          </Link>
        )}
      </div>

      {/* Reading Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-card border rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Book className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{readingStats.books_read || 0}</p>
              <p className="text-sm text-muted-foreground">Books Completed</p>
            </div>
          </div>
        </div>
        <div className="bg-card border rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Headphones className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{readingStats.audiobooks_listened || 0}</p>
              <p className="text-sm text-muted-foreground">Audiobooks Listened</p>
            </div>
          </div>
        </div>
        <div className="bg-card border rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <FileText className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{readingStats.articles_read || 0}</p>
              <p className="text-sm text-muted-foreground">Articles Read</p>
            </div>
          </div>
        </div>
      </div>

      {/* Current Read */}
      {currentRead && (
        <div className="bg-card border rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-medium">Currently Reading</h3>
            <span className="text-sm text-muted-foreground">
              {currentRead.progress ? `${currentRead.progress}% complete` : 'Just started'}
            </span>
          </div>
          <div className="flex items-center gap-4">
            <div className="w-16 h-20 bg-muted rounded-md overflow-hidden">
              <img
                src={currentRead.thumbnail || `https://source.unsplash.com/random/200x300?book&sig=${Date.now()}`}
                alt={currentRead.title}
                className="w-full h-full object-cover"
              />
            </div>
            <div>
              <h4 className="font-medium">{currentRead.title}</h4>
              <p className="text-sm text-muted-foreground">
                {currentRead.creator?.name || currentRead.author || 'Unknown Author'}
              </p>
            </div>
          </div>
          {currentRead.progress && (
            <div className="mt-4 h-2 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-primary transition-all"
                style={{ width: `${currentRead.progress}%` }}
              />
            </div>
          )}
        </div>
      )}

      {/* Reading Preferences */}
      <div className="space-y-4">
        <h3 className="font-medium">Reading Preferences</h3>
        <div className="space-y-3">
          <div>
            <p className="text-sm text-muted-foreground mb-2">Favorite Genres</p>
            <div className="flex flex-wrap gap-2">
              {readingPreferences && readingPreferences.length > 0 ? (
                readingPreferences.map((genre: string, index: number) => (
                  <span
                    key={index}
                    className="px-3 py-1 rounded-full bg-primary/10 text-primary text-sm"
                  >
                    {genre}
                  </span>
                ))
              ) : (
                <span className="text-sm text-muted-foreground">No preferences set</span>
              )}
            </div>
          </div>
          
          {favoriteCategories && favoriteCategories.length > 0 && (
            <div>
              <p className="text-sm text-muted-foreground mb-2">Most Read Categories</p>
              <div className="flex flex-wrap gap-2">
                {favoriteCategories.map((category: string, index: number) => (
                  <span
                    key={index}
                    className="px-3 py-1 rounded-full bg-muted text-sm"
                  >
                    {category}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}