import React from 'react';
import { Users, Lock, Plus } from 'lucide-react';

interface Circle {
  id: string;
  name: string;
  members: number;
  isPrivate: boolean;
  thumbnail: string;
}

export function ProfileCircles() {
  // Mock data for demonstration
  const mockCircles: Circle[] = [
    {
      id: '1',
      name: 'Science Fiction Enthusiasts',
      members: 1234,
      isPrivate: false,
      thumbnail: `https://source.unsplash.com/random/400x400?scifi&sig=${Date.now()}-1`,
    },
    {
      id: '2',
      name: 'Psychology & Philosophy',
      members: 567,
      isPrivate: true,
      thumbnail: `https://source.unsplash.com/random/400x400?psychology&sig=${Date.now()}-2`,
    },
    {
      id: '3',
      name: 'Business Book Club',
      members: 890,
      isPrivate: false,
      thumbnail: `https://source.unsplash.com/random/400x400?business&sig=${Date.now()}-3`,
    },
  ];

  return (
    <div className="bg-card border rounded-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="space-y-1">
          <h2 className="font-semibold">Circles</h2>
          <p className="text-sm text-muted-foreground">Connect through shared interests</p>
        </div>
        <button className="inline-flex items-center justify-center rounded-lg border bg-background px-3 py-1.5 text-sm font-medium shadow-sm transition-colors hover:bg-accent">
          <Plus className="w-4 h-4 mr-2" />
          Join Circle
        </button>
      </div>

      <div className="space-y-4">
        {mockCircles.map((circle) => (
          <div
            key={circle.id}
            className="flex items-center gap-3 p-3 rounded-lg hover:bg-accent/50 transition-colors"
          >
            <div className="w-12 h-12 rounded-lg overflow-hidden">
              <img
                src={circle.thumbnail}
                alt={circle.name}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="font-medium truncate">{circle.name}</h3>
                {circle.isPrivate && (
                  <Lock className="w-3 h-3 text-muted-foreground" />
                )}
              </div>
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <Users className="w-3 h-3" />
                <span>{circle.members.toLocaleString()} members</span>
              </div>
            </div>
            <button className="shrink-0 px-3 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary hover:bg-primary/20 transition-colors">
              {circle.isPrivate ? 'Request to Join' : 'Join'}
            </button>
          </div>
        ))}
      </div>

      <button className="w-full mt-4 text-sm text-primary hover:underline">
        View all circles
      </button>
    </div>
  );
}