import React from 'react';
import { ExternalLink } from 'lucide-react';
import { SponsoredContent } from '@/lib/types';

interface SponsoredCardProps {
  item: SponsoredContent;
}

export function SponsoredCard({ item }: SponsoredCardProps) {
  return (
    <a
      href={item.url}
      target="_blank"
      rel="noopener noreferrer"
      className="group relative bg-card rounded-lg overflow-hidden border shadow-sm hover:shadow-md transition-all"
    >
      {/* Thumbnail */}
      <div className="relative aspect-video">
        <img
          src={item.thumbnail}
          alt={item.title}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors" />
      </div>

      {/* Content */}
      <div className="p-4">
        <div className="flex items-start gap-3">
          {/* Brand Logo */}
          <div className="shrink-0 w-9 h-9 rounded-lg overflow-hidden bg-primary/5">
            <img
              src={item.brand.logo}
              alt={item.brand.name}
              className="w-full h-full object-contain"
            />
          </div>

          <div className="flex-1 min-w-0">
            {/* Title */}
            <h3 className="font-medium leading-snug line-clamp-2 mb-1">
              {item.title}
            </h3>

            {/* Brand and Label */}
            <div className="flex items-center gap-2 text-xs">
              <span className="text-muted-foreground">{item.brand.name}</span>
              <span className="text-muted-foreground/50">•</span>
              <span className="text-primary font-medium">Sponsored</span>
            </div>
          </div>
        </div>
      </div>

      {/* External Link Icon */}
      <div className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-background/90 opacity-0 group-hover:opacity-100 transition-opacity">
        <ExternalLink className="w-4 h-4" />
      </div>
    </a>
  );
}