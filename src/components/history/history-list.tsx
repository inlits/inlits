import React from 'react';
import { HistoryItem } from './history-item';
import type { ContentItem } from '@/lib/types';

interface HistoryListProps {
  items: {
    [date: string]: ContentItem[];
  };
  loading: boolean;
}

export function HistoryList({ items, loading }: HistoryListProps) {
  if (loading) {
    return (
      <div className="space-y-8">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="space-y-4">
            <div className="h-6 bg-muted rounded w-32 animate-pulse" />
            <div className="space-y-4">
              {Array.from({ length: 2 }).map((_, j) => (
                <div key={j} className="bg-card border rounded-lg p-4 animate-pulse">
                  <div className="flex gap-4">
                    <div className="w-40 h-24 bg-muted rounded" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-muted rounded w-3/4" />
                      <div className="h-3 bg-muted rounded w-1/2" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (Object.keys(items).length === 0) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-medium mb-2">No history found</h3>
        <p className="text-muted-foreground">
          Start exploring content to build your history
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {Object.entries(items).map(([date, dateItems]) => (
        <div key={date} className="space-y-4">
          <h2 className="text-lg font-semibold">{date}</h2>
          <div className="space-y-4">
            {dateItems.map((item) => (
              <HistoryItem key={`${item.type}-${item.id}`} item={item} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}