import React from 'react';
import { useAuth } from '@/lib/auth';
import { Trophy, Star, Award } from 'lucide-react';

interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  progress: number;
  total: number;
  unlocked: boolean;
}

export function ProfileAchievements({ profile }: { profile?: any }) {
  const { user } = useAuth();
  const [achievements, setAchievements] = React.useState<Achievement[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const loadAchievements = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        // Get user stats to calculate achievements
        const [readingStatusData, commentsData, ratingsData] = await Promise.all([
          supabase
            .from('reading_status')
            .select('*')
            .eq('user_id', user.id),
          supabase
            .from('comments')
            .select('*')
            .eq('user_id', user.id),
          supabase
            .from('ratings')
            .select('*')
            .eq('user_id', user.id)
        ]);

        const booksCompleted = readingStatusData.data?.filter(r => 
          r.content_type === 'book' && r.status === 'completed'
        ).length || 0;

        const audiobooksCompleted = readingStatusData.data?.filter(r => 
          r.content_type === 'audiobook' && r.status === 'completed'
        ).length || 0;

        const commentsCount = commentsData.data?.length || 0;
        const ratingsCount = ratingsData.data?.length || 0;

        // Calculate achievements based on actual data
        const calculatedAchievements: Achievement[] = [
          {
            id: '1',
            name: 'Bookworm',
            description: 'Complete 10 books',
            icon: '📚',
            progress: booksCompleted,
            total: 10,
            unlocked: booksCompleted >= 10
          },
          {
            id: '2',
            name: 'Audiophile',
            description: 'Complete 5 audiobooks',
            icon: '🎧',
            progress: audiobooksCompleted,
            total: 5,
            unlocked: audiobooksCompleted >= 5
          },
          {
            id: '3',
            name: 'Engaged Reader',
            description: 'Write 10 comments',
            icon: '💬',
            progress: commentsCount,
            total: 10,
            unlocked: commentsCount >= 10
          },
          {
            id: '4',
            name: 'Critic',
            description: 'Rate 20 pieces of content',
            icon: '⭐',
            progress: ratingsCount,
            total: 20,
            unlocked: ratingsCount >= 20
          }
        ];

        setAchievements(calculatedAchievements);
      } catch (error) {
        console.error('Error loading achievements:', error);
      } finally {
        setLoading(false);
      }
    };

    loadAchievements();
  }, [user]);

  if (loading) {
    return (
      <div className="bg-card border rounded-lg p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-muted rounded w-1/3" />
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="space-y-2">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-muted rounded-lg" />
                  <div className="flex-1 space-y-1">
                    <div className="h-3 bg-muted rounded w-2/3" />
                    <div className="h-2 bg-muted rounded w-1/2" />
                  </div>
                </div>
                <div className="h-1.5 bg-muted rounded" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

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
        {achievements.map((achievement) => (
          <div
            key={achievement.id}
            className={`space-y-2 ${achievement.unlocked ? 'opacity-100' : 'opacity-60'}`}
          >
            <div className="flex items-center gap-3">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-lg ${
                achievement.unlocked ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground'
              }`}>
                {achievement.icon}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="font-medium text-sm">{achievement.name}</h3>
                  {achievement.unlocked && (
                    <Trophy className="w-4 h-4 text-yellow-500" />
                  )}
                </div>
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
                className={`h-full transition-all ${
                  achievement.unlocked ? 'bg-primary' : 'bg-primary/50'
                }`}
                style={{
                  width: `${(achievement.progress / achievement.total) * 100}%`,
                }}
              />
            </div>
          </div>
        ))}
      </div>
      
      {achievements.length === 0 && (
        <div className="text-center py-4">
          <p className="text-sm text-muted-foreground">
            Start reading and engaging to unlock achievements!
          </p>
        </div>
      )}
    </div>
  );
}