import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import { ProfileHeader } from '@/components/profile/profile-header';
import { IntellectualIdentity } from '@/components/profile/intellectual-identity';
import { ProfileCircles } from '@/components/profile/profile-circles';
import { ProfileContributions } from '@/components/profile/profile-contributions';
import { ProfileAchievements } from '@/components/profile/profile-achievements';
import type { Profile } from '@/lib/types';

export function UserProfilePage() {
  const { username } = useParams<{ username: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('username', username)
          .single();

        if (error) throw error;
        if (!data) throw new Error('Profile not found');

        // If viewing own profile, redirect to /profile
        if (user && data.id === user.id) {
          navigate('/profile');
          return;
        }

        setProfile(data);
      } catch (err) {
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
          <IntellectualIdentity profile={profile} />
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