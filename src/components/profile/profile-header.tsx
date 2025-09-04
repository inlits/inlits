import React from 'react';
import { Link } from 'react-router-dom';
import { Settings } from 'lucide-react';
import { useAuth } from '@/lib/auth';

interface ProfileHeaderProps {
  profile?: any;
  isOwnProfile?: boolean;
}

export function ProfileHeader({ profile, isOwnProfile = true }: ProfileHeaderProps) {
  const { profile: authProfile } = useAuth();
  const userProfile = profile || authProfile;

  return (
    <div className="relative overflow-hidden">
      {/* Cover Image */}
      <div className="h-32 md:h-48 rounded-xl overflow-hidden bg-gradient-to-r from-primary/5 to-primary/10">
        <img
          src={userProfile?.cover_url || "https://images.unsplash.com/photo-1481627834876-b7833e8f5570"}
          alt="Cover"
          className="w-full h-full object-cover opacity-60"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent" />
      </div>

      {/* Profile Content */}
      <div className="relative px-4 md:px-6 pb-4 md:pb-6 -mt-16 md:-mt-24">
        <div className="relative z-10 flex flex-col items-center md:items-start md:flex-row gap-4 md:gap-6">
          {/* Avatar */}
          <div className="shrink-0 text-center md:text-left">
            <div className="w-24 h-24 md:w-32 md:h-32 rounded-full border-4 border-background overflow-hidden bg-muted mx-auto md:mx-0">
              <img
                src={userProfile?.avatar_url || `https://source.unsplash.com/random/200x200?portrait&sig=${userProfile?.id}`}
                alt={userProfile?.name || userProfile?.username}
                className="w-full h-full object-cover"
              />
            </div>
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
              <div className="text-center md:text-left">
                <h1 className="text-xl md:text-2xl font-bold">
                  {userProfile?.name || userProfile?.username}
                </h1>
                <p className="text-sm md:text-base text-muted-foreground">
                  {userProfile?.bio || 'Learning and growing every day'}
                </p>
              </div>

              {/* Action Buttons */}
              {isOwnProfile && (
                <div className="flex items-center gap-2 md:gap-3">
                  <Link
                    to="/settings/account"
                    className="inline-flex items-center justify-center rounded-lg border bg-background px-3 md:px-4 py-2 text-sm font-medium shadow-sm transition-colors hover:bg-primary hover:text-primary-foreground hover:border-primary"
                  >
                    <Settings className="w-4 h-4 mr-2" />
                    <span className="hidden md:inline">Edit Profile</span>
                    <span className="md:hidden">Edit</span>
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}