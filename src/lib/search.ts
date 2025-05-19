import { supabase } from './supabase';
import type { ContentItem } from './types';

interface SearchOptions {
  query?: string;
  type?: string;
  category?: string;
  language?: string;
  limit?: number;
  offset?: number;
}

export interface SearchSuggestion {
  text: string;
  type: 'trending' | 'recent' | 'suggestion' | 'creator';
  category?: string;
  count?: number;
  username?: string;
}

// Store recent searches in localStorage
const RECENT_SEARCHES_KEY = 'inlits_recent_searches';
const MAX_RECENT_SEARCHES = 5;

export function getRecentSearches(): string[] {
  try {
    const saved = localStorage.getItem(RECENT_SEARCHES_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
}

export function addRecentSearch(query: string) {
  try {
    const recent = getRecentSearches();
    const newRecent = [
      query,
      ...recent.filter(q => q !== query)
    ].slice(0, MAX_RECENT_SEARCHES);
    localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(newRecent));
  } catch {
    // Ignore storage errors
  }
}

export function removeRecentSearch(query: string): string[] {
  try {
    const recent = getRecentSearches();
    const newRecent = recent.filter(q => q !== query);
    localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(newRecent));
    return newRecent;
  } catch {
    return [];
  }
}

export async function searchContent({
  query,
  type,
  category,
  language,
  limit = 10,
  offset = 0
}: SearchOptions): Promise<{
  items: ContentItem[];
  total: number;
}> {
  try {
    // If no query, return empty results
    if (!query?.trim()) {
      return { items: [], total: 0 };
    }

    // Call the search_content RPC function with consistent parameters
    const { data, error } = await supabase.rpc(
      'search_content',
      {
        search_text: query.trim(),
        content_filter: type || null,
        category_filter: category || null,
        language_filter: language || null, // Always include language_filter
        items_limit: limit,
        items_offset: offset
      }
    );

    if (error) {
      console.error('Search RPC error:', error);
      throw new Error(error.message);
    }

    // Validate response format
    if (!Array.isArray(data)) {
      console.error('Invalid response format:', data);
      throw new Error('Invalid response format from server');
    }

    // Transform the response to match ContentItem type
    const items: ContentItem[] = data.map(item => ({
      id: item.id,
      type: item.type,
      title: item.title,
      thumbnail: item.thumbnail || `https://source.unsplash.com/random/800x600?${item.type}&sig=${item.id}`,
      duration: item.duration,
      views: item.views,
      createdAt: item.created_at,
      creator: {
        id: item.creator.id,
        name: item.creator.name,
        avatar: item.creator.avatar || `https://source.unsplash.com/random/100x100?face&sig=${item.creator.id}`,
        followers: item.creator.followers || 0
      },
      category: item.category,
      featured: item.featured
    }));

    // Add to recent searches
    if (query?.trim()) {
      addRecentSearch(query.trim());
    }

    return {
      items,
      total: data.length // Use the actual length of results
    };
  } catch (error) {
    console.error('Search error:', error);
    throw error;
  }
}

export async function searchSuggestions(query: string): Promise<SearchSuggestion[]> {
  try {
    const suggestions: SearchSuggestion[] = [];

    // Get recent searches if no query
    if (!query.trim()) {
      const recent = getRecentSearches();
      suggestions.push(
        ...recent.map(text => ({
          text,
          type: 'recent' as const
        }))
      );

      // Get trending searches
      const { data: trending, error: trendingError } = await supabase.rpc(
        'get_trending_searches',
        {
          max_suggestions: 5
        }
      );

      if (trendingError) {
        console.error('Trending suggestions error:', trendingError);
        return suggestions; // Return just recent searches if trending fails
      }

      if (Array.isArray(trending)) {
        suggestions.push(
          ...trending.map(item => ({
            text: item.suggestion,
            type: 'trending' as const,
            count: item.count || Math.floor(Math.random() * 1000)
          }))
        );
      }

      // Add creator suggestions
      const { data: creators, error: creatorsError } = await supabase
        .from('profiles')
        .select('username, name')
        .eq('role', 'creator')
        .limit(3);

      if (!creatorsError && creators) {
        suggestions.push(
          ...creators.map(creator => ({
            text: creator.name || creator.username,
            type: 'creator' as const,
            username: creator.username
          }))
        );
      }
    } else {
      // Get fuzzy search suggestions
      const { data, error } = await supabase.rpc(
        'get_search_suggestions',
        {
          search_query: query,
          max_suggestions: 5
        }
      );

      if (error) {
        console.error('Search suggestions error:', error);
        return suggestions;
      }

      if (Array.isArray(data)) {
        suggestions.push(
          ...data.map(item => ({
            text: item.suggestion,
            type: 'suggestion' as const
          }))
        );
      }

      // Get creator suggestions that match query
      const { data: creators, error: creatorsError } = await supabase
        .from('profiles')
        .select('username, name')
        .eq('role', 'creator')
        .ilike('name', `%${query}%`)
        .limit(3);

      if (!creatorsError && creators) {
        suggestions.push(
          ...creators.map(creator => ({
            text: creator.name || creator.username,
            type: 'creator' as const,
            username: creator.username
          }))
        );
      }

      // Get category suggestions if query matches any category
      const matchingCategories = categories.filter(c => 
        c.toLowerCase().includes(query.toLowerCase())
      ).slice(0, 3);

      suggestions.push(
        ...matchingCategories.map(text => ({
          text,
          type: 'suggestion' as const,
          category: 'category'
        }))
      );
    }

    return suggestions;
  } catch (error) {
    console.error('Search suggestions error:', error);
    return [];
  }
}

// Categories for suggestions
const categories = [
  'Business & Finance',
  'Self Development',
  'Science & Technology',
  'History & Politics',
  'Philosophy',
  'Psychology',
  'Fiction',
  'Biography',
  'Health & Wellness',
  'Arts & Culture',
  'Religion & Spirituality',
  'Education'
];