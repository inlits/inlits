import React, { useState, useEffect, useCallback } from 'react';
import { CreatorCard, Creator } from './creator-card';

export function FollowedCreatorsGrid() {
  const [creators, setCreators] = useState<Creator[]>([]);
  const [loading, setLoading] = useState(false);

  const loadCreators = useCallback(async () => {
    setLoading(true);
    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Mock data
      const mockCreators: Creator[] = Array.from({ length: 9 }, (_, i) => ({
        id: `creator-${i}`,
        username: `creator${i}`,
        name: `Creator Name ${i}`,
        avatar: `https://source.unsplash.com/random/200x200?portrait&sig=${Date.now()}-${i}`,
        bio: "Creating educational content to help people learn and grow. Focused on technology, science, and personal development.",
        verified: Math.random() > 0.5,
        stats: {
          followers: Math.floor(Math.random() * 100000),
          content: Math.floor(Math.random() * 500),
          likes: Math.floor(Math.random() * 1000000)
        },
        recentContent: Array.from({ length: 6 }, (_, j) => ({
          id: `content-${i}-${j}`,
          title: `Content Title ${j}`,
          thumbnail: `https://source.unsplash.com/random/400x400?education&sig=${Date.now()}-${i}-${j}`,
          type: ['Article', 'Video', 'Podcast', 'E-Book'][Math.floor(Math.random() * 4)]
        })),
        isFollowing: true
      }));

      setCreators(mockCreators);
    } catch (error) {
      console.error('Error loading creators:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCreators();
  }, []);

  const handleFollow = (creatorId: string) => {
    setCreators(prev => prev.map(creator =>
      creator.id === creatorId
        ? { ...creator, isFollowing: !creator.isFollowing }
        : creator
    ));
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="bg-card border rounded-lg overflow-hidden animate-pulse">
            <div className="h-32 bg-muted" />
            <div className="p-6">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-24 h-24 rounded-full bg-muted" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-muted rounded w-2/3" />
                  <div className="h-3 bg-muted rounded w-1/2" />
                </div>
              </div>
              <div className="space-y-2">
                <div className="h-3 bg-muted rounded" />
                <div className="h-3 bg-muted rounded w-5/6" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (creators.length === 0) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-medium mb-2">No creators followed yet</h3>
        <p className="text-muted-foreground">
          Follow some creators to see their content here
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {creators.map(creator => (
        <CreatorCard
          key={creator.id}
          creator={creator}
          onFollow={handleFollow}
        />
      ))}
    </div>
  );
}