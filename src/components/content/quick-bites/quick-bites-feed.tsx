import React, { useState, useEffect, useCallback } from 'react';
import { QuickBiteCard, QuickBite } from './quick-bite-card';

export function QuickBitesFeed() {
  const [bites, setBites] = useState<QuickBite[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);

  const loadMoreBites = useCallback(async () => {
    if (loading) return;
    setLoading(true);

    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Mock data generation
      const newBites: QuickBite[] = Array.from({ length: 5 }, (_, i) => ({
        id: `${Date.now()}-${page}-${i}`,
        content: [
          "The only way to do great work is to love what you do.",
          "In the midst of chaos, there is also opportunity.",
          "Life is what happens while you're busy making other plans.",
          "Two roads diverged in a wood, and I—\nI took the one less traveled by,\nAnd that has made all the difference.",
          "Success is not final, failure is not fatal:\nit is the courage to continue that counts."
        ][Math.floor(Math.random() * 5)],
        type: ['quote', 'poetry', 'thought'][Math.floor(Math.random() * 3)] as QuickBite['type'],
        creator: {
          id: `creator-${i}`,
          name: `Creator Name ${i}`,
          username: `creator${i}`,
          avatar: `https://source.unsplash.com/random/100x100?face&sig=${Date.now()}-${i}`,
          verified: Math.random() > 0.5
        },
        likes: Math.floor(Math.random() * 1000),
        comments: Math.floor(Math.random() * 100),
        createdAt: new Date(Date.now() - Math.random() * 10000000000).toISOString(),
        liked: Math.random() > 0.7,
        saved: Math.random() > 0.8
      }));

      setBites(prev => [...prev, ...newBites]);
      setPage(prev => prev + 1);
      setHasMore(page < 5); // Limit to 5 pages for demo
    } catch (error) {
      console.error('Error loading quick bites:', error);
    } finally {
      setLoading(false);
    }
  }, [page, loading]);

  useEffect(() => {
    loadMoreBites();
  }, []);

  const handleLike = (id: string) => {
    setBites(prev => prev.map(bite => 
      bite.id === id 
        ? { 
            ...bite, 
            liked: !bite.liked,
            likes: bite.liked ? bite.likes - 1 : bite.likes + 1
          }
        : bite
    ));
  };

  const handleSave = (id: string) => {
    setBites(prev => prev.map(bite => 
      bite.id === id 
        ? { ...bite, saved: !bite.saved }
        : bite
    ));
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
      {bites.map(bite => (
        <QuickBiteCard
          key={bite.id}
          bite={bite}
          onLike={handleLike}
          onSave={handleSave}
        />
      ))}
      {loading && (
        <div className="flex justify-center py-4">
          <div className="animate-pulse flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-primary/50"></div>
            <div className="w-2 h-2 rounded-full bg-primary/50"></div>
            <div className="w-2 h-2 rounded-full bg-primary/50"></div>
          </div>
        </div>
      )}
    </div>
  );
}