import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import { Trophy, Calendar, Users, ArrowRight, Plus, Loader2, AlertCircle, Target } from 'lucide-react';

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

        // Since we don't have a learning_challenges table yet, we'll return empty array
        // to show the empty state
        setChallenges([]);
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

      // TODO: Implement actual join functionality when learning_challenges table is created
      console.log('Joining challenge:', challengeId);
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
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="bg-card border rounded-lg p-6 animate-pulse">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-lg bg-muted" />
              <div className="space-y-2 flex-1">
                <div className="h-4 bg-muted rounded w-1/3" />
                <div className="h-3 bg-muted rounded w-1/4" />
              </div>
            </div>
            <div className="space-y-2">
              <div className="h-4 bg-muted rounded w-3/4" />
              <div className="h-3 bg-muted rounded w-1/2" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
        <h3 className="text-lg font-medium mb-2">Failed to load learning challenges</h3>
        <p className="text-muted-foreground mb-4">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="text-primary hover:underline"
        >
          Try again
        </button>
      </div>
    );
  }

  if (challenges.length === 0) {
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

        {/* Empty State */}
        <div className="text-center py-12">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <Target className="w-8 h-8 text-primary" />
          </div>
          <h3 className="text-lg font-medium mb-2">No learning challenges yet</h3>
          <p className="text-muted-foreground mb-6 max-w-md mx-auto">
            Learning challenges will be available soon! We're working on gamified learning experiences to help you achieve your goals and earn rewards.
          </p>
          <button
            onClick={() => {/* TODO: Implement create challenge modal */}}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Create First Challenge
          </button>
        </div>
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
            <div className="px-4 py-1.5 text-xs font-medium text-center text-white bg-primary">
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