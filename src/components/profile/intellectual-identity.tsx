import React from 'react';
import { BookOpen, Target, TrendingUp, Clock, Users } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/lib/auth';
import type { Profile } from '@/lib/types';

interface IntellectualIdentityProps {
  stats?: any;
}

export function IntellectualIdentity({ stats }: IntellectualIdentityProps) {
  const { profile: currentUserProfile } = useAuth();
  const isOwnProfile = true; // This is always the user's own profile

  const readingStats = stats || {};
  const readingPreferences = currentUserProfile?.reading_preferences || [];

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg md:text-xl font-semibold">Intellectual Identity</h2>
        {isOwnProfile && (
          <Link 
            to="/settings/account" 
            className="text-sm text-primary hover:underline"
          >
            Update Preferences
          </Link>
        )}
      </div>

      {/* Reading Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        <div className="bg-card border rounded-lg p-3 md:p-4 text-center">
          <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg bg-primary/10 flex items-center justify-center mx-auto mb-2">
            <Target className="w-4 h-4 md:w-5 md:h-5 text-primary" />
          </div>
          <p className="text-lg md:text-xl font-bold">{readingStats.want_to_read || 0}</p>
          <p className="text-xs md:text-sm text-muted-foreground">Want to Read</p>
        </div>
        
        <div className="bg-card border rounded-lg p-3 md:p-4 text-center">
          <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg bg-primary/10 flex items-center justify-center mx-auto mb-2">
            <Clock className="w-4 h-4 md:w-5 md:h-5 text-primary" />
          </div>
          <p className="text-lg md:text-xl font-bold">{readingStats.current_reading || 0}</p>
          <p className="text-xs md:text-sm text-muted-foreground">Currently Reading</p>
        </div>
        
        <div className="bg-card border rounded-lg p-3 md:p-4 text-center">
          <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg bg-primary/10 flex items-center justify-center mx-auto mb-2">
            <BookOpen className="w-4 h-4 md:w-5 md:h-5 text-primary" />
          </div>
          <p className="text-lg md:text-xl font-bold">{readingStats.completed_content || 0}</p>
          <p className="text-xs md:text-sm text-muted-foreground">Completed</p>
        </div>
        
        <div className="bg-card border rounded-lg p-3 md:p-4 text-center">
          <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg bg-primary/10 flex items-center justify-center mx-auto mb-2">
            <TrendingUp className="w-4 h-4 md:w-5 md:h-5 text-primary" />
          </div>
          <p className="text-lg md:text-xl font-bold">{readingStats.total_bookmarks || 0}</p>
          <p className="text-xs md:text-sm text-muted-foreground">Bookmarked</p>
        </div>
      </div>

      {/* Reading Preferences */}
      {readingPreferences.length > 0 && (
        <div className="space-y-3 md:space-y-4">
          <h3 className="font-medium">Reading Preferences</h3>
          <div className="space-y-3">
            <div>
              <p className="text-sm text-muted-foreground mb-2">Favorite Genres</p>
              <div className="flex flex-wrap gap-2">
                {readingPreferences.map((genre: string, index: number) => (
                  <span
                    key={index}
                    className="px-2 md:px-3 py-1 rounded-full bg-primary/10 text-primary text-xs md:text-sm"
                  >
                    {genre}
                  <p className="text-xs md:text-sm text-muted-foreground whitespace-nowrap">Bookmarked</p>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}