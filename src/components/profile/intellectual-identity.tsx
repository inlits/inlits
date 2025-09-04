import React from 'react';
import { Book, Headphones, FileText, BookOpen, Target, TrendingUp, Clock } from 'lucide-react';
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

  const readingStats = stats || {};
  const currentRead = readingHistory?.current_reading;
  const readingPreferences = profile?.reading_preferences || [];

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg md:text-xl font-semibold">Learning Overview</h2>
        {isOwnProfile && (
          <Link 
            to="/settings/account" 
            className="text-sm text-primary hover:underline"
          >
            Update Preferences
          </Link>
        )}
      </div>

      {/* Quick Stats */}
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

      {/* Current Read */}
      {currentRead && (
        <div className="bg-card border rounded-lg p-4 md:p-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 md:gap-4 mb-4">
            <h3 className="font-medium text-center md:text-left">Currently Reading</h3>
            <span className="text-sm text-muted-foreground text-center md:text-right">
              {currentRead.progress ? `${currentRead.progress}% complete` : 'Recently started'}
            </span>
          </div>
          <div className="flex flex-col md:flex-row items-center gap-4">
            <div className="w-16 h-20 md:w-20 md:h-24 bg-muted rounded-md overflow-hidden flex-shrink-0">
              <img
                src={currentRead.thumbnail || `https://source.unsplash.com/random/200x300?book&sig=${currentRead.content_id}`}
                alt={currentRead.title}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="text-center md:text-left flex-1">
              <h4 className="font-medium text-sm md:text-base">{currentRead.title || 'Untitled'}</h4>
              <p className="text-xs md:text-sm text-muted-foreground">
                {currentRead.author || 'Unknown Author'}
              </p>
            </div>
          </div>
          {currentRead.progress && (
            <div className="mt-3 md:mt-4 h-2 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-primary transition-all"
                style={{ width: `${currentRead.progress}%` }}
              />
            </div>
          )}
        </div>
      )}

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
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Quick Actions */}
      {isOwnProfile && (
        <div className="bg-card border rounded-lg p-4 md:p-6">
          <h3 className="font-medium mb-4">Quick Actions</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <Link
              to="/library?openLearningGoals=true"
              className="flex flex-col items-center gap-2 p-3 md:p-4 rounded-lg border hover:bg-primary hover:text-primary-foreground hover:border-primary transition-colors"
            >
              <Target className="w-5 h-5 md:w-6 md:h-6" />
              <span className="text-xs md:text-sm font-medium text-center">Set Learning Goals</span>
            </Link>
            <Link
              to="/community?tab=book-clubs"
              className="flex flex-col items-center gap-2 p-3 md:p-4 rounded-lg border hover:bg-primary hover:text-primary-foreground hover:border-primary transition-colors"
            >
              <Users className="w-5 h-5 md:w-6 md:h-6" />
              <span className="text-xs md:text-sm font-medium text-center">Join Book Clubs</span>
            </Link>
            <Link
              to="/library"
              className="flex flex-col items-center gap-2 p-3 md:p-4 rounded-lg border hover:bg-primary hover:text-primary-foreground hover:border-primary transition-colors"
            >
              <BookOpen className="w-5 h-5 md:w-6 md:h-6" />
              <span className="text-xs md:text-sm font-medium text-center">My Library</span>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}