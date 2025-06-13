import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import { ProfileHeader } from '@/components/profile/profile-header';
import { IntellectualIdentity } from '@/components/profile/intellectual-identity';
import { ProfileCircles } from '@/components/profile/profile-circles';
import { ProfileContributions } from '@/components/profile/profile-contributions';
import { ProfileAchievements } from '@/components/profile/profile-achievements';
import { Loader2, AlertCircle } from 'lucide-react';
import type { Profile } from '@/lib/types';

export function UserProfilePage() {
  const { username } = useParams<{ username: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [userStats, setUserStats] = useState<any>(null);
  const [readingHistory, setReadingHistory] = useState<any>(null);
  const [bookmarks, setBookmarks] = useState<any>(null);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        setLoading(true);
        setError(null);

        // Remove @ from username if present
        const cleanUsername = username?.startsWith('@') ? username.substring(1) : username;
        
        if (!cleanUsername) {
          throw new Error('Username is required');
        }

        // First check if profile exists
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('username', cleanUsername)
          .single();

        if (profileError) throw profileError;
        if (!profileData) throw new Error('Profile not found');

        // If viewing own profile, redirect to /profile
        if (user && profileData.id === user.id) {
          navigate('/profile');
          return;
        }

        setProfile(profileData);

        // Get user stats and reading history
        const { data: userProfileData, error: userProfileError } = await supabase.rpc(
          'get_user_profile',
          { username_param: cleanUsername }
        );

        if (userProfileError) {
          console.error('Error fetching user profile data:', userProfileError);
        } else if (userProfileData && userProfileData.length > 0) {
          const userData = userProfileData[0];
          setUserStats(userData.stats);
          setReadingHistory(userData.reading_history);
          setBookmarks(userData.bookmarks);
        }
      } catch (err) {
        console.error('Error loading profile:', err);
        setError(err instanceof Error ? err.message : 'Failed to load profile');
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [username, user, navigate]);

  if (loading) {
    return (
      <div className="animate-pulse space-y-8">
        <div className="h-48 bg-muted rounded-xl" />
        <div className="h-32 bg-muted rounded-lg" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <div className="h-64 bg-muted rounded-lg" />
            <div className="h-96 bg-muted rounded-lg" />
          </div>
          <div className="space-y-8">
            <div className="h-64 bg-muted rounded-lg" />
            <div className="h-64 bg-muted rounded-lg" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <AlertCircle className="w-12 h-12 text-destructive" />
        <h1 className="text-2xl font-semibold">Profile not found</h1>
        <p className="text-muted-foreground">
          The profile you're looking for doesn't exist or has been removed.
        </p>
        <button
          onClick={() => navigate(-1)}
          className="text-primary hover:underline"
        >
          Go back
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <ProfileHeader profile={profile} isOwnProfile={false} />
      
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