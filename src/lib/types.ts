// Update SearchSuggestion type
export type SearchSuggestion = {
  text: string;
  type: 'trending' | 'recent' | 'suggestion' | 'creator';
  category?: string;
  count?: number;
  username?: string; // For creator suggestions
};

export type ContentType = 'article' | 'ebook' | 'audiobook' | 'podcast' | 'summary';

export type UserRole = 'creator' | 'consumer';

export interface Profile {
  id: string;
  username: string;
  name?: string;
  avatar_url?: string;
  bio?: string;
  role: UserRole;
  expertise?: string[];
  reading_preferences?: string[];
  cover_url?: string;
  social_links?: Record<string, string>;
  verified?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
}

export interface ContentItem {
  id: string;
  type: ContentType;
  title: string;
  thumbnail: string;
  duration: string;
  views: number;
  createdAt: string;
  creator: {
    id: string;
    name: string;
    avatar: string;
    followers?: number;
  };
  category?: string;
  featured?: boolean;
  rating?: number;
  bookmarked?: boolean;
}

export interface SponsoredContent {
  id: string;
  title: string;
  thumbnail: string;
  url: string;
  brand: {
    name: string;
    logo: string;
  };
}