import React from 'react';
import { AlertCircle } from 'lucide-react';
import { QuickBitesFeed } from '@/components/content/quick-bites/quick-bites-feed';

export function QuickBitesPage() {
  return (
    <div className="relative h-[calc(100vh-8rem)] overflow-hidden">
      {/* Mock content with blur effect */}
      <div className="absolute inset-0 blur-sm pointer-events-none overflow-hidden">
        <QuickBitesFeed />
      </div>

      {/* Coming Soon Overlay */}
      <div className="absolute inset-0 flex items-center justify-center bg-background/50 backdrop-blur-sm">
        <div className="max-w-md text-center space-y-4 p-6 rounded-lg">
          <AlertCircle className="w-12 h-12 text-primary mx-auto" />
          <h2 className="text-2xl font-semibold">Coming Soon!</h2>
          <p className="text-muted-foreground">
            We're working hard to bring you bite-sized learning content that you can consume on the go.
            Stay tuned for updates!
          </p>
        </div>
      </div>
    </div>
  );
}