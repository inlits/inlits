import React from 'react';
import { X, Info } from 'lucide-react';

interface AddToShelfBannerProps {
  shelfName: string;
  onClose: () => void;
}

export function AddToShelfBanner({ shelfName, onClose }: AddToShelfBannerProps) {
  return (
    <div className="bg-primary/10 border-l-4 border-primary p-4 mb-6 rounded-lg">
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3">
          <Info className="w-5 h-5 text-primary mt-0.5" />
          <div>
            <p className="text-sm font-medium text-primary">
              Adding content to "{shelfName}"
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              Click the bookmark icon on any content card to add it to this shelf
            </p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-1 hover:bg-primary/10 rounded-full transition-colors"
        >
          <X className="w-4 h-4 text-primary" />
        </button>
      </div>
    </div>
  );
}