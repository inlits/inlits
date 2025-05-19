import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth';
import { Users, BookOpen, Calendar, Plus } from 'lucide-react';

interface StudyGroup {
  id: string;
  name: string;
  description: string;
  category: string;
  max_members: number;
  is_private: boolean;
  created_at: string;
  creator: {
    id: string;
    username: string;
    name: string;
    avatar_url: string;
  };
  member_count: number;
  topics: Array<{
    id: string;
    title: string;
  }>;
}

export function StudyGroups() {
  const { user } = useAuth();
  const [groups, setGroups] = useState<StudyGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadGroups = async () => {
      try {
        setLoading(true);
        setError(null);

        // Since the get_study_groups function doesn't exist in the database,
        // we'll use mock data instead
        const mockGroups: StudyGroup[] = Array.from({ length: 6 }, (_, i) => ({
          id: `group-${i}`,
          name: [
            'Machine Learning Study Group',
            'Classic Literature Club',
            'Web Development Mastermind',
            'Psychology Research Group',
            'Data Science Enthusiasts',
            'Philosophy Discussion Circle'
          ][i],
          description: 'A group of learners studying together and sharing knowledge.',
          category: ['Technology', 'Literature', 'Programming', 'Psychology', 'Data Science', 'Philosophy'][i],
          max_members: 20 + i * 5,
          is_private: i % 3 === 0,
          created_at: new Date(Date.now() - i * 7 * 24 * 60 * 60 * 1000).toISOString(),
          creator: {
            id: `creator-${i}`,
            username: `creator${i}`,
            name: `Creator ${i}`,
            avatar_url: `https://source.unsplash.com/random/100x100?face&sig=${Date.now()}-${i}`
          },
          member_count: Math.floor(Math.random() * 15) + 5,
          topics: Array.from({ length: 3 }, (_, j) => ({
            id: `topic-${i}-${j}`,
            title: `Discussion Topic ${j + 1}`
          }))
        }));

        setGroups(mockGroups);
      } catch (err) {
        console.error('Error loading study groups:', err);
        setError(err instanceof Error ? err.message : 'Failed to load study groups');
      } finally {
        setLoading(false);
      }
    };

    loadGroups();
  }, []);

  const handleJoinGroup = async (groupId: string) => {
    if (!user) return;

    try {
      // Optimistically update UI
      setGroups(prev =>
        prev.map(group =>
          group.id === groupId
            ? { ...group, member_count: group.member_count + 1 }
            : group
        )
      );

      // In a real implementation, you would call a Supabase function here
      // For now, we'll just simulate a delay
      await new Promise(resolve => setTimeout(resolve, 500));
    } catch (error) {
      console.error('Error joining group:', error);
      // Revert the optimistic update on error
      setGroups(prev =>
        prev.map(group =>
          group.id === groupId
            ? { ...group, member_count: group.member_count - 1 }
            : group
        )
      );
    }
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {Array.from({ length: 4 }).map((_, i) => (
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
          <h2 className="text-xl font-semibold">Study Groups</h2>
          <p className="text-sm text-muted-foreground">
            Join a group to learn together and stay accountable
          </p>
        </div>
        <button 
          onClick={() => {/* TODO: Implement create group modal */}}
          className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90"
        >
          <Plus className="w-4 h-4 mr-2" />
          Create Group
        </button>
      </div>

      {/* Groups Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {groups.map((group) => (
          <div key={group.id} className="bg-card border rounded-lg p-6 hover:border-primary/50 transition-colors">
            <div className="space-y-4">
              {/* Header */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-medium">{group.name}</h3>
                  {group.is_private && (
                    <span className="px-2 py-1 text-xs rounded-full bg-primary/10 text-primary">
                      Private
                    </span>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">{group.description}</p>
              </div>

              {/* Members */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex -space-x-2">
                    {Array.from({ length: Math.min(3, group.member_count) }).map((_, i) => (
                      <img
                        key={i}
                        src={`https://source.unsplash.com/random/100x100?face&sig=${group.id}-${i}`}
                        alt="Member"
                        className="w-8 h-8 rounded-full border-2 border-background"
                      />
                    ))}
                    {group.member_count > 3 && (
                      <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs border-2 border-background">
                        +{group.member_count - 3}
                      </div>
                    )}
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {group.member_count}/{group.max_members} members
                  </span>
                </div>
                <button
                  onClick={() => handleJoinGroup(group.id)}
                  className="px-3 py-1.5 text-sm rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                >
                  Join
                </button>
              </div>

              {/* Topics */}
              {group.topics.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-medium">Recent Topics</h4>
                  <div className="space-y-1">
                    {group.topics.slice(0, 3).map((topic) => (
                      <p key={topic.id} className="text-sm text-muted-foreground truncate">
                        • {topic.title}
                      </p>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}