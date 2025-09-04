import React from 'react';
import { MessageSquare, ThumbsUp, Users } from 'lucide-react';

interface Contribution {
  id: string;
  type: 'discussion' | 'review' | 'community';
  title: string;
  excerpt: string;
  likes: number;
  comments: number;
  timestamp: string;
  community?: {
    name: string;
    icon: string;
  };
}

export function ProfileContributions() {
  // Mock data for demonstration
  const mockContributions: Contribution[] = [
    {
      id: '1',
      type: 'discussion',
      title: 'The impact of AI on future of reading',
      excerpt: 'As we move towards more personalized learning experiences...',
      likes: 42,
      comments: 12,
      timestamp: '2h ago',
      community: {
        name: 'Future of Learning',
        icon: '🤖',
      },
    },
    {
      id: '2',
      type: 'review',
      title: 'Atomic Habits by James Clear',
      excerpt: 'A comprehensive guide to building better habits...',
      likes: 156,
      comments: 28,
      timestamp: '1d ago',
    },
    {
      id: '3',
      type: 'community',
      title: 'Started a new book club',
      excerpt: 'Join us for weekly discussions on science fiction novels...',
      likes: 89,
      comments: 34,
      timestamp: '3d ago',
      community: {
        name: 'Science Fiction Readers',
        icon: '🚀',
      },
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Contributions</h2>
        <div className="flex items-center gap-2">
          <button className="text-sm text-primary hover:underline">
            View all
          </button>
        </div>
      </div>

      <div className="space-y-4">
        {mockContributions.map((contribution) => (
          <div
            key={contribution.id}
            className="bg-card border rounded-lg p-6 space-y-4"
          >
            {/* Header */}
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                  <span className="capitalize">{contribution.type}</span>
                  <span>•</span>
                  <span>{contribution.timestamp}</span>
                  {contribution.community && (
                    <>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <span>{contribution.community.icon}</span>
                        {contribution.community.name}
                      </span>
                    </>
                  )}
                </div>
                <h3 className="font-medium">{contribution.title}</h3>
              </div>
            </div>

            {/* Content */}
            <p className="text-sm text-muted-foreground">
              {contribution.excerpt}
            </p>

            {/* Footer */}
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <button className="flex items-center gap-1 hover:text-primary transition-colors">
                <ThumbsUp className="w-4 h-4" />
                <span>{contribution.likes}</span>
              </button>
              <button className="flex items-center gap-1 hover:text-primary transition-colors">
                <MessageSquare className="w-4 h-4" />
                <span>{contribution.comments}</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}