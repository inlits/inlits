import React from 'react';
import { CommunityTabs } from '@/components/community/community-tabs';

export function CommunityPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Community</h1>
        <p className="text-muted-foreground">Connect, learn, and grow together</p>
      </div>
      <CommunityTabs />
    </div>
  );
}