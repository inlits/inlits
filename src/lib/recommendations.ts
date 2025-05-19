import { supabase } from './supabase';
import type { ContentItem } from './types';

interface RecommendationOptions {
  userId?: string;
  category?: string;
  limit?: number;
  excludeIds?: string[];
}

export async function getRecommendations({
  userId,
  category,
  limit = 10,
  excludeIds = []
}: RecommendationOptions): Promise<ContentItem[]> {
  try {
    const { data, error } = await supabase.rpc(
      'get_content_recommendations',
      {
        p_user_id: userId,
        p_category: category,
        p_limit: limit,
        p_exclude_ids: excludeIds
      }
    );

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error getting recommendations:', error);
    return [];
  }
}

export async function getSimilarContent(
  contentId: string,
  contentType: string,
  limit: number = 5
): Promise<ContentItem[]> {
  try {
    const { data, error } = await supabase.rpc(
      'get_similar_content',
      {
        p_content_id: contentId,
        p_content_type: contentType,
        p_limit: limit
      }
    );

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error getting similar content:', error);
    return [];
  }
}

export async function getTrendingContent(
  category?: string,
  timeframe: 'day' | 'week' | 'month' = 'week',
  limit: number = 10
): Promise<ContentItem[]> {
  try {
    const { data, error } = await supabase.rpc(
      'get_trending_content',
      {
        p_category: category,
        p_timeframe: timeframe,
        p_limit: limit
      }
    );

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error getting trending content:', error);
    return [];
  }
}