import React, { useState, useEffect } from 'react';
import { Settings, Users, BookOpen, MessageSquare, Star, Calendar, TrendingUp } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import { ProfileHeader } from '@/components/profile/profile-header';
import { IntellectualIdentity } from '@/components/profile/intellectual-identity';
import { ProfileCircles } from '@/components/profile/profile-circles';
import { ProfileContributions } from '@/components/profile/profile-contributions';
import { ProfileAchievements } from '@/components/profile/profile-achievements';

interface UserStats {
  totalContentViewed: number;
  booksRead: number;
  audiobooksListened: number;
  articlesRead: number;
  podcastsListened: number;
  totalComments: number;
  totalRatings: number;
  averageRating: number;
  bookClubsJoined: number;
  favoriteCategories: string[];
}

export default function ProfilePage() {
  const { user, profile } = useAuth();
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [bookClubs, setBookClubs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchUserData();
    }
  }, [user]);

  const fetchUserData = async () => {
    if (!user) return;

    try {
      setLoading(true);

      // Fetch user statistics
      const [
        readingStatusResult,
        commentsResult,
        ratingsResult,
        bookClubsResult,
        contentViewsResult
      ] = await Promise.all([
        supabase
          .from('reading_status')
          .select('status, content_type')
          .eq('user_id', user.id),
        supabase
          .from('comments')
          .select('id, content, created_at, content_type')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(5),
        supabase
          .from('ratings')
          .select('rating, content_type')
          .eq('user_id', user.id),
        supabase
          .from('book_club_members')
          .select(`
            book_clubs (
              id,
              name,
              description,
              current_chapter,
              completion_percentage
            )
          `)
          .eq('user_id', user.id),
        supabase
          .from('content_views')
          .select('content_type')
          .eq('viewer_id', user.id)
      ]);

      // Process statistics
      const readingData = readingStatusResult.data || [];
      const commentsData = commentsResult.data || [];
      const ratingsData = ratingsResult.data || [];
      const bookClubsData = bookClubsResult.data || [];
      const viewsData = contentViewsResult.data || [];

      const stats: UserStats = {
        totalContentViewed: viewsData.length,
        booksRead: readingData.filter(r => r.content_type === 'book' && r.status === 'completed').length,
        audiobooksListened: readingData.filter(r => r.content_type === 'audiobook' && r.status === 'completed').length,
        articlesRead: readingData.filter(r => r.content_type === 'article' && r.status === 'completed').length,
        podcastsListened: readingData.filter(r => r.content_type === 'podcast' && r.status === 'completed').length,
        totalComments: commentsData.length,
        totalRatings: ratingsData.length,
        averageRating: ratingsData.length > 0 ? ratingsData.reduce((sum, r) => sum + r.rating, 0) / ratingsData.length : 0,
        bookClubsJoined: bookClubsData.length,
        favoriteCategories: []
      };

      setUserStats(stats);
      setRecentActivity(commentsData);
      setBookClubs(bookClubsData.map(item => item.book_clubs).filter(Boolean));
    } catch (error) {
      console.error('Error fetching user data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!user || !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Please sign in</h2>
          <p className="text-muted-foreground">You need to be signed in to view your profile.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen">
        <div className="animate-pulse">
          <div className="h-48 bg-muted rounded-xl mb-6"></div>
          <div className="space-y-4">
            <div className="h-8 bg-muted rounded w-1/3"></div>
            <div className="h-4 bg-muted rounded w-1/2"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-32 bg-muted rounded-lg"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8">
        {/* Profile Header */}
        <ProfileHeader profile={profile} stats={userStats} />

        {/* Quick Stats */}
        {userStats && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-card rounded-lg p-4 text-center border">
              <BookOpen className="w-6 h-6 mx-auto mb-2 text-primary" />
              <div className="text-2xl font-bold">{userStats.booksRead}</div>
              <div className="text-sm text-muted-foreground">Books Read</div>
            </div>
            <div className="bg-card rounded-lg p-4 text-center border">
              <MessageSquare className="w-6 h-6 mx-auto mb-2 text-primary" />
              <div className="text-2xl font-bold">{userStats.totalComments}</div>
              <div className="text-sm text-muted-foreground">Comments</div>
            </div>
            <div className="bg-card rounded-lg p-4 text-center border">
              <Star className="w-6 h-6 mx-auto mb-2 text-primary" />
              <div className="text-2xl font-bold">{userStats.averageRating.toFixed(1)}</div>
              <div className="text-sm text-muted-foreground">Avg Rating</div>
            </div>
            <div className="bg-card rounded-lg p-4 text-center border">
              <Users className="w-6 h-6 mx-auto mb-2 text-primary" />
              <div className="text-2xl font-bold">{userStats.bookClubsJoined}</div>
              <div className="text-sm text-muted-foreground">Book Clubs</div>
            </div>
          </div>
        )}

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-8">
            <IntellectualIdentity stats={userStats} />
            <ProfileContributions recentActivity={recentActivity} />
          </div>

          {/* Right Column */}
          <div className="space-y-8">
            <ProfileCircles bookClubs={bookClubs} />
            <ProfileAchievements stats={userStats} />
          </div>
        </div>
      </div>
    </div>
  );
}