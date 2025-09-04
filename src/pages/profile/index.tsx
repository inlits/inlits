import React, { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth';
import { Link } from 'react-router-dom';
import { ProfileHeader } from '@/components/profile/profile-header';
import { IntellectualIdentity } from '@/components/profile/intellectual-identity';
import { supabase } from '@/lib/supabase';
import { Loader2, AlertCircle, Settings, BookOpen, Users, MessageSquare, Trophy, Target, Plus } from 'lucide-react';

export function ProfilePage() {
  const { user, profile } = useAuth();
  const [userStats, setUserStats] = useState<any>(null);
  const [readingHistory, setReadingHistory] = useState<any>(null);
  const [bookClubs, setBookClubs] = useState<any[]>([]);
  const [recentComments, setRecentComments] = useState<any[]>([]);
  const [achievements, setAchievements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadUserData = async () => {
      if (!user || !profile) return;
      
      try {
        setLoading(true);
        setError(null);
        
        // Load reading statistics
        const [
          { data: readingStatusData },
          { data: bookmarksData },
          { data: bookClubsData },
          { data: commentsData },
          { count: articlesRead },
          { count: booksRead },
          { count: audiobooksListened }
        ] = await Promise.all([
          supabase
            .from('reading_status')
            .select('status, progress, content_type')
            .eq('user_id', user.id),
          
          supabase
            .from('bookmarks')
            .select('content_type, created_at')
            .eq('user_id', user.id),
            
          supabase
            .from('book_club_members')
            .select(`
              club:book_clubs (
                id,
                name,
                description,
                book:books (
                  title,
                  cover_url
                )
              )
            `)
            .eq('user_id', user.id),
            
          supabase
            .from('comments')
            .select(`
              id,
              content,
              created_at,
              content_type,
              content_id
            `)
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .limit(5),
            
          supabase
            .from('content_views')
            .select('*', { count: 'exact', head: true })
            .eq('viewer_id', user.id)
            .eq('content_type', 'article'),
            
          supabase
            .from('content_views')
            .select('*', { count: 'exact', head: true })
            .eq('viewer_id', user.id)
            .eq('content_type', 'book'),
            
          supabase
            .from('content_views')
            .select('*', { count: 'exact', head: true })
            .eq('viewer_id', user.id)
            .eq('content_type', 'audiobook')
        ]);
        
        // Calculate user statistics
        const stats = {
          articles_read: articlesRead || 0,
          books_read: booksRead || 0,
          audiobooks_listened: audiobooksListened || 0,
          total_bookmarks: bookmarksData?.length || 0,
          completed_content: readingStatusData?.filter(item => item.status === 'completed').length || 0,
          current_reading: readingStatusData?.filter(item => item.status === 'consuming').length || 0,
          want_to_read: readingStatusData?.filter(item => item.status === 'want_to_consume').length || 0
        };
        
        // Get current reading item
        const currentReading = readingStatusData?.find(item => item.status === 'consuming');
        
        // Calculate achievements based on real data
        const calculatedAchievements = [];
        
        if (stats.books_read >= 5) {
          calculatedAchievements.push({
            id: 'bookworm',
            name: 'Bookworm',
            description: 'Read 5 books',
            icon: '📚',
            progress: Math.min(stats.books_read, 10),
            total: 10,
            category: 'reading'
          });
        }
        
        if (stats.audiobooks_listened >= 3) {
          calculatedAchievements.push({
            id: 'audiophile',
            name: 'Audiophile',
            description: 'Listen to 3 audiobooks',
            icon: '🎧',
            progress: Math.min(stats.audiobooks_listened, 5),
            total: 5,
            category: 'reading'
          });
        }
        
        if (commentsData && commentsData.length >= 5) {
          calculatedAchievements.push({
            id: 'contributor',
            name: 'Active Contributor',
            description: 'Write 5 comments',
            icon: '💬',
            progress: Math.min(commentsData.length, 10),
            total: 10,
            category: 'engagement'
          });
        }
        
        setUserStats(stats);
        setReadingHistory({ current_reading: currentReading });
        setBookClubs(bookClubsData?.map(item => item.club).filter(Boolean) || []);
        setRecentComments(commentsData || []);
        setAchievements(calculatedAchievements);
        
      } catch (err) {
        console.error('Error loading user data:', err);
        setError(err instanceof Error ? err.message : 'Failed to load profile data');
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
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
          <Settings className="w-8 h-8 text-primary" />
        </div>
        <div className="text-center">
          <h3 className="text-lg font-medium mb-2">Sign in to view your profile</h3>
          <p className="text-muted-foreground">Track your learning journey and manage your preferences</p>
        </div>
        <Link 
          to="/signin"
          className="px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          Sign In
        </Link>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-48 bg-muted rounded-xl mb-6" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <div className="h-64 bg-muted rounded-lg" />
              <div className="h-48 bg-muted rounded-lg" />
            </div>
            <div className="space-y-6">
              <div className="h-48 bg-muted rounded-lg" />
              <div className="h-48 bg-muted rounded-lg" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <AlertCircle className="w-12 h-12 text-destructive" />
        <div className="text-center">
          <h3 className="text-lg font-medium mb-2">Error loading profile</h3>
          <p className="text-muted-foreground">{error}</p>
        </div>
        <button 
          onClick={() => window.location.reload()}
          className="px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 md:space-y-8">
      <ProfileHeader 
        profile={profile} 
        isOwnProfile={true} 
        stats={userStats}
      />
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6 lg:space-y-8">
          <IntellectualIdentity 
            profile={profile} 
            stats={userStats}
            readingHistory={readingHistory}
          />
          
          {/* Recent Activity */}
          <div className="bg-card border rounded-lg p-4 md:p-6">
            <div className="flex items-center justify-between mb-4 md:mb-6">
              <div>
                <h2 className="text-lg md:text-xl font-semibold">Recent Activity</h2>
                <p className="text-sm text-muted-foreground">Your latest interactions and contributions</p>
              </div>
            </div>
            
            {recentComments.length > 0 ? (
              <div className="space-y-4">
                {recentComments.map((comment) => (
                  <div key={comment.id} className="p-3 md:p-4 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <MessageSquare className="w-4 h-4 md:w-5 md:h-5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 text-xs md:text-sm text-muted-foreground mb-1">
                          <span className="capitalize">{comment.content_type}</span>
                          <span>•</span>
                          <span>{new Date(comment.created_at).toLocaleDateString()}</span>
                        </div>
                        <p className="text-sm md:text-base line-clamp-2">{comment.content}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 md:py-12">
                <div className="w-12 h-12 md:w-16 md:h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <MessageSquare className="w-6 h-6 md:w-8 md:h-8 text-primary" />
                </div>
                <h3 className="text-base md:text-lg font-medium mb-2">No recent activity</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Start engaging with content to see your activity here
                </p>
                <Link
                  to="/"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors text-sm"
                >
                  <BookOpen className="w-4 h-4" />
                  Explore Content
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6 lg:space-y-8">
          {/* Book Clubs */}
          <div className="bg-card border rounded-lg p-4 md:p-6">
            <div className="flex items-center justify-between mb-4 md:mb-6">
              <div>
                <h2 className="text-lg font-semibold">Book Clubs</h2>
                <p className="text-sm text-muted-foreground">Your reading communities</p>
              </div>
              {bookClubs.length > 0 && (
                <Link 
                  to="/community?tab=book-clubs"
                  className="text-sm text-primary hover:underline"
                >
                  View all
                </Link>
            {bookClubs.length > 0 ? (
              <div className="space-y-3">
                {bookClubs.slice(0, 3).map((club) => (
                  <div key={club.id} className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors">
                    <div className="w-10 h-10 md:w-12 md:h-12 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                      <img
                        src={club.book?.cover_url || `https://source.unsplash.com/random/400x400?book&sig=${club.id}`}
                        alt={club.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-sm md:text-base line-clamp-1">{club.name}</h3>
                      <p className="text-xs md:text-sm text-muted-foreground line-clamp-1">
                        {club.book?.title || 'Reading together'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 md:py-8">
                <div className="w-12 h-12 md:w-16 md:h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <Users className="w-6 h-6 md:w-8 md:h-8 text-primary" />
                </div>
                <h3 className="text-base md:text-lg font-medium mb-2">No book clubs yet</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Join book clubs to read and discuss with others
                </p>
                <Link
                  to="/community?tab=book-clubs"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors text-sm"
                >
                  <Plus className="w-4 h-4" />
                  Find Book Clubs
                </Link>
              </div>
            )}
          </div>
              )}
          {/* Achievements */}
          <div className="bg-card border rounded-lg p-4 md:p-6">
            <div className="flex items-center justify-between mb-4 md:mb-6">
              <div>
                <h2 className="text-lg font-semibold">Achievements</h2>
                <p className="text-sm text-muted-foreground">Your learning milestones</p>
              </div>
            </div>
            </div>
            {achievements.length > 0 ? (
              <div className="space-y-4">
                {achievements.map((achievement) => (
                  <div key={achievement.id} className="space-y-2">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg bg-primary/10 flex items-center justify-center text-lg md:text-xl">
                        {achievement.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-sm md:text-base">{achievement.name}</h3>
                        <p className="text-xs md:text-sm text-muted-foreground">
                          {achievement.description}
                        </p>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {achievement.progress}/{achievement.total}
                      </div>
                    </div>
                    <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary transition-all"
                        style={{
                          width: `${(achievement.progress / achievement.total) * 100}%`,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 md:py-8">
                <div className="w-12 h-12 md:w-16 md:h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <Trophy className="w-6 h-6 md:w-8 md:h-8 text-primary" />
                </div>
                <h3 className="text-base md:text-lg font-medium mb-2">No achievements yet</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Start reading and engaging to earn achievements
                </p>
                <Link
                  to="/library"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors text-sm"
                >
                  <Target className="w-4 h-4" />
                  Set Learning Goals
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}