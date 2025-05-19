import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import { Trophy, Calendar, Users, ArrowRight, Plus } from 'lucide-react';

interface Challenge {
  id: string;
  title: string;
  description: string;
  category: string;
  difficulty: string;
  start_date: string;
  end_date: string;
  max_participants: number;
  rewards: {
    points: number;
    badge: string;
  };
  creator: {
    id: string;
    username: string;
    name: string;
    avatar_url: string;
  };
  participant_count: number;
  is_joined: boolean;
}

export function LearningChallenges() {
  const { user } = useAuth();
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadChallenges = async () => {
      try {
        setLoading(true);
        setError(null);

        // Since the get_learning_challenges function doesn't exist in the database,
        // we'll use mock data instead
        const mockChallenges: Challenge[] = Array.from({ length: 6 }, (_, i) => ({
          id: `challenge-${i}`,
          title: [
            'Complete 5 Books in 30 Days',
            'Master Machine Learning Fundamentals',
            'Daily Writing Challenge',
            'Learn a New Language',
            'Philosophy Reading Group',
            'Data Science Bootcamp'
          ][i],
          description: 'Join this challenge to improve your skills and earn rewards.',
          category: ['Reading', 'Technology', 'Writing', 'Languages', 'Philosophy', 'Data Science'][i],
          difficulty: ['beginner', 'intermediate', 'advanced'][i % 3],
          start_date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
          end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          max_participants: 50 + i * 10,
          rewards: {
            points: 100 * (i + 1),
            badge: ['Bookworm', 'Tech Guru', 'Wordsmith', 'Polyglot', 'Philosopher', 'Data Wizard'][i]
          },
          creator: {
            id: `creator-${i}`,
            username: `creator${i}`,
            name: `Creator ${i}`,
            avatar_url: `https://source.unsplash.com/random/100x100?face&sig=${Date.now()}-${i}`
          },
          participant_count: Math.floor(Math.random() * 40) + 10,
          is_joined: Math.random() > 0.7
        }));

        setChallenges(mockChallenges);
      } catch (err) {
        console.error('Error loading challenges:', err);
        setError(err instanceof Error ? err.message : 'Failed to load challenges');
      } finally {
        setLoading(false);
      }
    };

    loadChallenges();
  }, []);

  const handleJoinChallenge = async (challengeId: string) => {
    if (!user) return;

    try {
      // Optimistically update UI
      setChallenges(prev =>
        prev.map(challenge =>
          challenge.id === challengeId
            ? {
                ...challenge,
                is_joined: true,
                participant_count: challenge.participant_count + 1
              }
            : challenge
        )
      );

      // In a real implementation, you would call a Supabase function here
      // For now, we'll just simulate a delay
      await new Promise(resolve => setTimeout(resolve, 500));
    } catch (error) {
      console.error('Error joining challenge:', error);
      // Revert the optimistic update on error
      setChallenges(prev =>
        prev.map(challenge =>
          challenge.id === challengeId && challenge.is_joined
            ? {
                ...challenge,
                is_joined: false,
                participant_count: challenge.participant_count - 1
              }
            : challenge
        )
      );
    }
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="bg-card border rounded-lg p-6 animate-pulse">
            <div className="space-y-4">
              <div className="h-4 bg-muted rounded w-3/4" />
              <div className="space-y-2">
                <div className="h-3 bg-muted rounded w-1/2" />
                <div className="h-3 bg-muted rounded w-1/4" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-destructive">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-4 text-primary hover:underline"
        >
          Try again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h2 className="text-xl font-semibold">Learning Challenges</h2>
          <p className="text-sm text-muted-foreground">
            Join challenges to accelerate your learning and earn rewards
          </p>
        </div>
        <button 
          onClick={() => {/* TODO: Implement create challenge modal */}}
          className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90"
        >
          <Plus className="w-4 h-4 mr-2" />
          Create Challenge
        </button>
      </div>

      {/* Challenges Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {challenges.map((challenge) => (
          <div key={challenge.id} className="group bg-card border rounded-lg overflow-hidden hover:border-primary/50 transition-colors">
            {/* Status Banner */}
            <div className="px-4 py-1.5 text-xs font-medium text-center text-white bg-blue-500">
              {new Date(challenge.end_date) > new Date() ? 'In Progress' : 'Completed'}
            </div>

            <div className="p-6 space-y-4">
              {/* Header */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-medium">{challenge.title}</h3>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    challenge.difficulty === 'beginner' ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' :
                    challenge.difficulty === 'intermediate' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300' :
                    'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300'
                  }`}>
                    {challenge.difficulty.charAt(0).toUpperCase() + challenge.difficulty.slice(1)}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">
                  {challenge.description}
                </p>
              </div>

              {/* Details */}
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  <span>
                    {new Date(challenge.end_date).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric'
                    })}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <Users className="w-4 h-4" />
                  <span>
                    {challenge.participant_count}
                    {challenge.max_participants && ` / ${challenge.max_participants}`} joined
                  </span>
                </div>
              </div>

              {/* Rewards */}
              <div className="flex items-center gap-2 text-sm">
                <Trophy className="w-4 h-4 text-yellow-500" />
                <span className="text-muted-foreground">Rewards:</span>
                <span className="font-medium">{challenge.rewards.points} points</span>
                <span className="text-muted-foreground">•</span>
                <span className="font-medium">{challenge.rewards.badge}</span>
              </div>

              {/* Join Button */}
              <button
                onClick={() => !challenge.is_joined && handleJoinChallenge(challenge.id)}
                disabled={challenge.is_joined}
                className={`w-full inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium shadow transition-colors group-hover:gap-2 ${
                  challenge.is_joined
                    ? 'bg-primary/10 text-primary cursor-not-allowed'
                    : 'bg-primary text-primary-foreground hover:bg-primary/90'
                }`}
              >
                <span>{challenge.is_joined ? 'Already Joined' : 'Join Challenge'}</span>
                {!challenge.is_joined && (
                  <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-all" />
                )}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}