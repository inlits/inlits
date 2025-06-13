import React, { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth';
import { ProfileHeader } from '@/components/profile/profile-header';
import { IntellectualIdentity } from '@/components/profile/intellectual-identity';
import { ProfileCircles } from '@/components/profile/profile-circles';
import { ProfileContributions } from '@/components/profile/profile-contributions';
import { ProfileAchievements } from '@/components/profile/profile-achievements';
import { supabase } from '@/lib/supabase';
import { Loader2 } from 'lucide-react';
import { Navigate } from 'react-router-dom';

export function ProfilePage() {
  const { user, profile } = useAuth();
  const [userStats, setUserStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadUserData = async () => {
      if (!user || !profile) return;
      
      try {
        setLoading(true);
        
        // Get user stats from database
        const { data, error } = await supabase.rpc(
          'get_user_profile',
          { username: profile.username }
        );
        
        if (error) throw error;
        if (data && data.length > 0) {
          setUserStats(data[0]);
        }
      } catch (error) {
        console.error('Error loading user data:', error);
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

  // If user is logged in, redirect to their profile page with username in URL
  if (user && profile && !loading) {
    return <Navigate to={`/@${profile.username}`} replace />;
  }

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

  return null; // This should never render as we redirect above
}