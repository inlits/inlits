import React from 'react';
import { Trophy, Star, Award, BookOpen, Headphones, MessageSquare } from 'lucide-react';

interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  progress: number;
  total: number;
  unlocked: boolean;
}

interface ProfileAchievementsProps {
  stats?: any;
}

export function ProfileAchievements({ stats }: ProfileAchievementsProps) {
  // Calculate real achievements based on user stats
  const achievements: Achievement[] = [
    {
      id: '1',
      name: 'First Steps',
      description: 'Complete your first content',
      icon: '🎯',
      progress: Math.min(stats?.completed_content || 0, 1),
      total: 1,
      unlocked: (stats?.completed_content || 0) >= 1,
    },
    {
      id: '2',
      name: 'Bookworm',
      description: 'Experience 10 pieces of content',
      icon: '📚',
      progress: Math.min(stats?.completed_content || 0, 10),
      total: 10,
      unlocked: (stats?.completed_content || 0) >= 10,
    },
    {
      id: '3',
      name: 'Engaged Learner',
      description: 'Write 5 comments or reviews',
      icon: '💬',
      progress: Math.min(stats?.totalComments || 0, 5),
      total: 5,
      unlocked: (stats?.totalComments || 0) >= 5,
    },
    {
      id: '4',
      name: 'Community Member',
      description: 'Join your first book club',
      icon: '👥',
      progress: Math.min(stats?.bookClubsJoined || 0, 1),
      total: 1,
      unlocked: (stats?.bookClubsJoined || 0) >= 1,
    },
  ];

  return (
    <div className="bg-card border rounded-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="space-y-1">
          <h2 className="font-semibold">Achievements</h2>
          <p className="text-sm text-muted-foreground">Track your progress</p>
        </div>
        <button className="text-sm text-primary hover:underline" disabled>
          View all
        </button>
      </div>

      <div className="space-y-4">
        {achievements.map((achievement) => (
          <div
            key={achievement.id}
            className="space-y-2"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-lg">
                <span className={achievement.unlocked ? '' : 'grayscale opacity-50'}>
                  {achievement.icon}
                </span>
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
                className={`h-full transition-all ${achievement.unlocked ? 'bg-primary' : 'bg-muted-foreground'}`}
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