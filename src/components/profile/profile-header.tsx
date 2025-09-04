import React from 'react';
import { MapPin, Calendar, MessageSquare } from 'lucide-react';
import { useAuth } from '@/lib/auth';

interface ProfileHeaderProps {
  profile?: any;
  isOwnProfile?: boolean;
}

export function ProfileHeader({ profile, isOwnProfile = true }: ProfileHeaderProps) {
  const { profile: authProfile, activeProfileType } = useAuth();
  const userProfile = profile || authProfile;
  
  // Get active profile data
  const getActiveProfileData = () => {
    if (!userProfile) return {};
    
    const activeType = userProfile.active_profile_type || activeProfileType || 'consumer';
    if (activeType === 'consumer') {
      return userProfile.consumer_profile || {};
    } else {
      return userProfile.creator_profile || {};
    }
  };

  const activeProfileData = getActiveProfileData();
  
  // Use real data if available, otherwise use mock data
  const profileData = {
    avatar_url: activeProfileData.avatar_url || userProfile?.avatar_url || `https://source.unsplash.com/random/200x200?portrait&sig=${Date.now()}`,
    name: userProfile?.name || userProfile?.username || 'John Doe',
    tagline: activeProfileData.bio || userProfile?.bio || 'Exploring worlds through words',
    location: userProfile?.location || 'San Francisco, CA',
    joinedDate: userProfile?.created_at ? new Date(userProfile.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : 'March 2025',
    cover_url: activeProfileData.cover_url || userProfile?.cover_url,
    topBadges: [
      { id: '1', name: 'Bookworm', icon: '📚' },
      { id: '2', name: 'Audiophile', icon: '🎧' },
      { id: '3', name: 'Literary Critic', icon: '✍️' },
    ]
  };

  return (
    <div className="relative">
      {/* Cover Image */}
      <div className="h-48 rounded-xl overflow-hidden bg-gradient-to-r from-primary/5 to-primary/10">
        <img
          src={profileData.cover_url || "https://source.unsplash.com/random/1600x400?library"}
          alt="Cover"
          className="w-full h-full object-cover opacity-50"
        />
      </div>

      {/* Profile Content */}
      <div className="relative px-6 pb-6 -mt-24">
        <div className="relative z-10 flex flex-col md:flex-row gap-6 items-start">
          {/* Avatar */}
          <div className="shrink-0">
            <div className="w-32 h-32 rounded-full border-4 border-background overflow-hidden bg-muted">
              <img
                src={profileData.avatar_url}
                alt={profileData.name}
                className="w-full h-full object-cover"
              />
            </div>
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div>
                <h1 className="text-2xl font-bold">{profileData.name}</h1>
                <p className="text-muted-foreground">{profileData.tagline}</p>
              </div>

              <div className="flex items-center gap-3">
                <button className="inline-flex items-center justify-center rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-sm transition-colors hover:bg-primary/90">
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Message
                </button>
              </div>
            </div>

            {/* Meta Info */}
            <div className="mt-4 flex items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <MapPin className="w-4 h-4" />
                <span>{profileData.location}</span>
              </div>
              <div className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                <span>Joined {profileData.joinedDate}</span>
              </div>
            </div>

            {/* Badges */}
            <div className="mt-4 flex items-center gap-3">
              {profileData.topBadges.map(badge => (
                <div
                  key={badge.id}
                  className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm"
                >
                  <span>{badge.icon}</span>
                  <span>{badge.name}</span>
                </div>
              ))}
              <button className="text-sm text-primary hover:underline">
                View all badges
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}