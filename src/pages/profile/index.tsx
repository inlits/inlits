import React from 'react';
import { useAuth } from '@/lib/auth';
import { ProfileHeader } from '@/components/profile/profile-header';
import { IntellectualIdentity } from '@/components/profile/intellectual-identity';
import { ProfileCircles } from '@/components/profile/profile-circles';
import { ProfileContributions } from '@/components/profile/profile-contributions';
import { ProfileAchievements } from '@/components/profile/profile-achievements';

export function ProfilePage() {
  const { user, profile } = useAuth();

  if (!user || !profile) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-muted-foreground">Please sign in to view your profile</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <ProfileHeader />
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-8">
          <IntellectualIdentity />
          <ProfileContributions />
        </div>

        {/* Sidebar */}
        <div className="space-y-8">
          <ProfileCircles />
          <ProfileAchievements />
        </div>
      </div>
    </div>
  );
}