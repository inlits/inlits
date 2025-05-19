import React from 'react';
import { Link } from 'react-router-dom';
import { Users, BookOpen, Heart } from 'lucide-react';

export interface Creator {
  id: string;
  username: string;
  name: string;
  avatar: string;
  bio: string;
  verified: boolean;
  stats: {
    followers: number;
    content: number;
    likes: number;
  };
  recentContent: {
    id: string;
    title: string;
    thumbnail: string;
    type: string;
  }[];
  isFollowing: boolean;
}

interface CreatorCardProps {
  creator: Creator;
  onFollow: (id: string) => void;
}

export function CreatorCard({ creator, onFollow }: CreatorCardProps) {
  return (
    <div className="bg-card border rounded-lg overflow-hidden">
      {/* Header with cover image */}
      <div className="h-32 bg-gradient-to-r from-primary/10 to-primary/5" />

      {/* Profile section */}
      <div className="px-6 -mt-12">
        <div className="flex items-end gap-4 mb-4">
          <img
            src={creator.avatar}
            alt={creator.name}
            className="w-24 h-24 rounded-full border-4 border-background object-cover"
          />
          <div className="flex-1 pb-2">
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-semibold">{creator.name}</h3>
              {creator.verified && (
                <span className="text-primary">
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none">
                    <path d="M9 12L11 14L15 10M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" 
                      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </span>
              )}
            </div>
            <p className="text-sm text-muted-foreground">@{creator.username}</p>
          </div>
          <button
            onClick={() => onFollow(creator.id)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              creator.isFollowing
                ? 'bg-primary/10 text-primary hover:bg-primary/20'
                : 'bg-primary text-primary-foreground hover:bg-primary/90'
            }`}
          >
            {creator.isFollowing ? 'Following' : 'Follow'}
          </button>
        </div>

        {/* Bio */}
        <p className="text-sm text-muted-foreground mb-4">{creator.bio}</p>

        {/* Stats */}
        <div className="flex items-center gap-6 mb-6">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm">
              <strong>{creator.stats.followers.toLocaleString()}</strong>
              <span className="text-muted-foreground"> followers</span>
            </span>
          </div>
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm">
              <strong>{creator.stats.content.toLocaleString()}</strong>
              <span className="text-muted-foreground"> content</span>
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Heart className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm">
              <strong>{creator.stats.likes.toLocaleString()}</strong>
              <span className="text-muted-foreground"> likes</span>
            </span>
          </div>
        </div>

        {/* Recent content */}
        <div className="mb-6">
          <h4 className="text-sm font-medium mb-3">Recent Content</h4>
          <div className="grid grid-cols-3 gap-2">
            {creator.recentContent.map(content => (
              <Link
                key={content.id}
                to={`/content/${content.id}`}
                className="relative aspect-square rounded-md overflow-hidden group"
              >
                <img
                  src={content.thumbnail}
                  alt={content.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center">
                  <span className="text-white text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                    {content.type}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}