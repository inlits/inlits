import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/lib/auth';
import { ProfileHeader } from '@/components/profile/profile-header';
import { IntellectualIdentity } from '@/components/profile/intellectual-identity';
import { ProfileCircles } from '@/components/profile/profile-circles';
import { ProfileContributions } from '@/components/profile/profile-contributions';
import { ProfileAchievements } from '@/components/profile/profile-achievements';
import { supabase } from '@/lib/supabase';
import { Loader2, AlertCircle, Settings } from 'lucide-react';

export function ProfilePage() {
  const { user, profile, activeProfileType } = useAuth();
  const [userStats, setUserStats] = useState(null);
  const [readingHistory, setReadingHistory] = useState(null);
  const [bookmarks, setBookmarks] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [recentContent, setRecentContent] = useState([]);

  useEffect(() => {
    const loadUserData = async () => {
      if (!user || !profile) return;
      
      try {
        setLoading(true);
        setError(null);
        
        // Load reading status and history
        const { data: readingStatusData, error: statusError } = await supabase
          .from('reading_status')
          .select('*')
          .eq('user_id', user.id)
          .order('updated_at', { ascending: false });

        if (statusError) throw statusError;

        // Load content views for history
        const { data: viewsData, error: viewsError } = await supabase
          .from('content_views')
          .select('content_id, content_type, viewed_at')
          .eq('viewer_id', user.id)
          .order('viewed_at', { ascending: false })
          .limit(10);

        if (viewsError) throw viewsError;

        // Load bookmarks
        const { data: bookmarksData, error: bookmarksError } = await supabase
          .from('bookmarks')
          .select('content_id, content_type, created_at')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(10);

        if (bookmarksError) throw bookmarksError;

        // Calculate stats
        const stats = {
          total_content_viewed: viewsData?.length || 0,
          books_read: readingStatusData?.filter(r => r.content_type === 'book' && r.status === 'completed').length || 0,
          audiobooks_listened: readingStatusData?.filter(r => r.content_type === 'audiobook' && r.status === 'completed').length || 0,
          articles_read: readingStatusData?.filter(r => r.content_type === 'article' && r.status === 'completed').length || 0,
          bookmarks_count: bookmarksData?.length || 0
        };

        // Get recent content details
        const recentContentDetails = [];
        if (viewsData && viewsData.length > 0) {
          const recentView = viewsData[0];
          
          // Get content details based on type
          let contentData;
          if (recentView.content_type === 'article') {
            const { data } = await supabase
              .from('articles')
              .select('title, cover_url, author_id')
              .eq('id', recentView.content_id)
              .single();
            contentData = data;
          } else if (recentView.content_type === 'book') {
            const { data } = await supabase
              .from('books')
              .select('title, cover_url, author_id')
              .eq('id', recentView.content_id)
              .single();
            contentData = data;
          } else if (recentView.content_type === 'audiobook') {
            const { data } = await supabase
              .from('audiobooks')
              .select('title, cover_url, author_id')
              .eq('id', recentView.content_id)
              .single();
            contentData = data;
          }

          if (contentData) {
            // Get author name
            const { data: authorData } = await supabase
              .from('profiles')
              .select('name, username')
              .eq('id', contentData.author_id)
              .single();

            recentContentDetails.push({
              title: contentData.title,
              thumbnail: contentData.cover_url,
              author: authorData?.name || authorData?.username || 'Unknown Author',
              type: recentView.content_type,
              progress: Math.floor(Math.random() * 100) // Mock progress for now
            });
          }
        }
        
        setUserStats(stats);
        setReadingHistory({ recent_views: recentContentDetails });
        setBookmarks(bookmarksData);
      } catch (err) {
        console.error('Error loading user data:', err);
        setError(err?.message || 'Failed to load profile data');
      } finally {
        setLoading(false);
      }
    };
    
    if (user && profile) {
      loadUserData();
    } else {
      setLoading(false);
    }
  }, [user, profile]);

  if (!user || !profile) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-muted-foreground">Please sign in to view your profile</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <AlertCircle className="w-12 h-12 text-destructive" />
        <h2 className="text-xl font-semibold">Error loading profile</h2>
        <p className="text-muted-foreground">{error}</p>
        <button 
          onClick={() => window.location.reload()}
          className="px-4 py-2 rounded-lg bg-primary text-primary-foreground"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header with Edit Button */}
      <div className="relative">
        <ProfileHeader profile={profile} isOwnProfile={true} />
        <div className="absolute top-4 right-4">
          <Link
            to="/settings/account"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground transition-colors"
          >
            <Settings className="w-4 h-4" />
            <span>Edit Profile</span>
          </Link>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-8">
          <IntellectualIdentity 
            profile={profile} 
            stats={userStats}
            readingHistory={readingHistory}
          />
          <ProfileContributions profile={profile} />
        </div>

        {/* Sidebar */}
        <div className="space-y-8">
          <ProfileCircles profile={profile} />
          <ProfileAchievements profile={profile} />
        </div>
      </div>
    </div>
  );
}