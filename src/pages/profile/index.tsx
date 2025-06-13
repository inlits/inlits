import React, { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth';
import { ProfileHeader } from '@/components/profile/profile-header';
import { IntellectualIdentity } from '@/components/profile/intellectual-identity';
import { ProfileCircles } from '@/components/profile/profile-circles';
import { ProfileContributions } from '@/components/profile/profile-contributions';
import { ProfileAchievements } from '@/components/profile/profile-achievements';
import { supabase } from '@/lib/supabase';
import { Loader2 } from 'lucide-react';

export function ProfilePage() {
  const { user, profile } = useAuth();
  const [userStats, setUserStats] = useState(null);
  const [readingHistory, setReadingHistory] = useState(null);
  const [bookmarks, setBookmarks] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadUserData = async () => {
      if (!user || !profile) return;
      
      try {
        setLoading(true);
        setError(null);
        
        // Get user stats from database
        const { data, error: fetchError } = await supabase.rpc(
          'get_user_profile',
          { username: profile.username }
        );
        
        if (fetchError) throw fetchError;
        
        if (data && data.length > 0) {
          const userData = data[0];
          setUserStats(userData.stats);
          setReadingHistory(userData.reading_history);
          setBookmarks(userData.bookmarks);
        }
      } catch (err) {
        console.error('Error loading user data:', err);
        setError(err.message || 'Failed to load profile data');
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

  return (
    <div className="space-y-8">
      <ProfileHeader profile={profile} isOwnProfile={true} />
      
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