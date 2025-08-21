import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import { Users, BookOpen, Calendar, Plus, Loader2, AlertCircle } from 'lucide-react';

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

        // Since we don't have a study_groups table yet, we'll check if there are any
        // For now, we'll return empty array to show the empty state
        setGroups([]);
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

      // TODO: Implement actual join functionality when study_groups table is created
      console.log('Joining group:', groupId);
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
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="bg-card border rounded-lg p-6 animate-pulse">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-muted" />
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
        <h3 className="text-lg font-medium mb-2">Failed to load study groups</h3>
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

  if (groups.length === 0) {
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

        {/* Empty State */}
        <div className="text-center py-12">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <Users className="w-8 h-8 text-primary" />
          </div>
          <h3 className="text-lg font-medium mb-2">No study groups yet</h3>
          <p className="text-muted-foreground mb-6 max-w-md mx-auto">
            Study groups will be available soon! We're working on features to help you learn together with others and stay motivated.
          </p>
          <button
            onClick={() => {/* TODO: Implement create group modal */}}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Create First Study Group
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
                        className="w-8 h-8 rounded-full border-2 border-background object-cover"
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

              {/* Creator Info */}
              <div className="flex items-center gap-2 pt-2 border-t">
                <img
                  src={group.creator.avatar_url || `https://source.unsplash.com/random/100x100?face&sig=${group.creator.id}`}
                  alt={group.creator.name}
                  className="w-6 h-6 rounded-full object-cover"
                />
                <span className="text-sm text-muted-foreground">
                  Created by {group.creator.name || group.creator.username}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}