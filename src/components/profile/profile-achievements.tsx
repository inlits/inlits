import React from 'react';
import { Trophy, Star, Award } from 'lucide-react';

interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  progress: number;
  total: number;
  category: 'reading' | 'engagement' | 'contribution';
}

export function ProfileAchievements() {
  // Mock data for demonstration
  const mockAchievements: Achievement[] = [
    {
      id: '1',
      name: 'Bookworm',
      description: 'Read 10 books',
      icon: '📚',
      progress: 7,
      total: 10,
      category: 'reading',
    },
    {
      id: '2',
      name: 'Audiophile',
      description: 'Listen to 5 audiobooks',
      icon: '🎧',
      progress: 3,
      total: 5,
      category: 'reading',
    },
    {
      id: '3',
      name: 'Literary Critic',
      description: 'Write 10 well-rated reviews',
      icon: '✍️',
      progress: 8,
      total: 10,
      category: 'contribution',
    },
  ];

  return (
    <div className="bg-card border rounded-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="space-y-1">
          <h2 className="font-semibold">Achievements</h2>
          <p className="text-sm text-muted-foreground">Track your progress</p>
        </div>
        <button className="text-sm text-primary hover:underline">
          View all
        </button>
      </div>

      <div className="space-y-4">
        {mockAchievements.map((achievement) => (
          <div
            key={achievement.id}
            className="space-y-2"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-lg">
                {achievement.icon}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-medium text-sm">{achievement.name}</h3>
                <p className="text-xs text-muted-foreground">
                  {achievement.description}
                </p>
              </div>
              <div className="text-sm text-muted-foreground">
                {achievement.progress}/{achievement.total}
              </div>
            </div>
            <div className="h-1.5 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-primary transition-all"
                style={{
                  width: `${(achievement.progress / achievement.total) * 100}%`,
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}