import React from 'react';
import { FollowedCreatorsGrid } from '@/components/creators/followed-creators-grid';

export function FollowedPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Followed Creators</h1>
        <p className="text-muted-foreground">Stay updated with your favorite creators</p>
      </div>
      <FollowedCreatorsGrid />
    </div>
  );
}