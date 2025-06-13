import React, { useEffect, useState } from 'react';
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
  const [profileData, setProfileData] = useState<any | null>(null);
  const [isOwnProfile, setIsOwnProfile] = useState(false);

  // Remove @ from username if present
  const cleanUsername = username?.startsWith('@') ? username.substring(1) : username;

  useEffect(() => {
    const loadProfile = async () => {
      try {
        setLoading(true);
        setError(null);

        // First get the profile to check if it exists
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('username', cleanUsername)
          .single();

        if (profileError) throw profileError;
        if (!profileData) throw new Error('Profile not found');

        // Check if this is the user's own profile
        if (user && profileData.id === user.id) {
          setIsOwnProfile(true);
        }

        // Get user stats
        const { data: userStats, error: statsError } = await supabase.rpc(
          'get_user_profile',
          { username: cleanUsername }
        );

        if (statsError) throw statsError;
        if (!userStats || userStats.length === 0) throw new Error('Failed to load user data');

        setProfileData(userStats[0]);
      } catch (err) {
        console.error('Error loading profile:', err);
        setError(err instanceof Error ? err.message : 'Failed to load profile');
      } finally {
        setLoading(false);
      }
    };

    if (cleanUsername) {
      loadProfile();
    }
  }, [cleanUsername, user]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !profileData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <AlertCircle className="w-12 h-12 text-destructive" />
        <h1 className="text-2xl font-semibold">Profile not found</h1>
        <p className="text-muted-foreground">
          {error || "The profile you're looking for doesn't exist or has been removed."}
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
      <ProfileHeader profile={profileData.profile} isOwnProfile={isOwnProfile} />
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-8">
          <IntellectualIdentity profile={profileData.profile} stats={profileData.stats} readingHistory={profileData.reading_history} />
          <ProfileContributions profile={profileData.profile} />
        </div>

        {/* Sidebar */}
        <div className="space-y-8">
          <ProfileCircles profile={profileData.profile} />
          <ProfileAchievements profile={profileData.profile} />
        </div>
      </div>
    </div>
  );
}