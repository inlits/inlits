import React, { useState, useEffect } from 'react';
import { HistoryFilters } from '@/components/history/history-filters';
import { Clock, Trash2, AlertCircle, Loader2, Play } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import { ContentTypeIcon } from '@/components/content/content-type-icon';
import { useNavigate } from 'react-router-dom';
import type { ContentItem } from '@/lib/types';

export function HistoryPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [selectedPeriod, setSelectedPeriod] = useState<string>('all');
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [historyItems, setHistoryItems] = useState<{
    [key: string]: ContentItem[]
  }>({});

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const loadHistory = async () => {
      try {
        setLoading(true);
        setError(null);

        // Get date range based on selected period
        let startDate: Date | null = null;
        if (selectedPeriod === 'today') {
          startDate = new Date();
          startDate.setHours(0, 0, 0, 0);
        } else if (selectedPeriod === 'week') {
          startDate = new Date();
          startDate.setDate(startDate.getDate() - 7);
        } else if (selectedPeriod === 'month') {
          startDate = new Date();
          startDate.setMonth(startDate.getMonth() - 1);
        }

        // Query content views from database
        let query = supabase
          .from('content_views')
          .select('content_id, content_type, viewed_at')
          .eq('viewer_id', user.id)
          .order('viewed_at', { ascending: false });

        // Apply date filter if selected
        if (startDate) {
          query = query.gte('viewed_at', startDate.toISOString());
        }

        // Apply content type filter if selected
        if (selectedTypes.length > 0) {
          query = query.in('content_type', selectedTypes);
        }

        const { data: viewsData, error: viewsError } = await query;

        if (viewsError) throw viewsError;

        // Group views by date and deduplicate content
        const groupedViews: { [key: string]: Map<string, { id: string, type: string }> } = {};
        
        // Process each view and group by date
        viewsData?.forEach(view => {
          const date = new Date(view.viewed_at);
          let groupKey: string;

          // Determine the group key based on date
          const today = new Date();
          const yesterday = new Date();
          yesterday.setDate(yesterday.getDate() - 1);

          if (date.toDateString() === today.toDateString()) {
            groupKey = 'Today';
          } else if (date.toDateString() === yesterday.toDateString()) {
            groupKey = 'Yesterday';
          } else if (date > new Date(today.getFullYear(), today.getMonth(), today.getDate() - 7)) {
            groupKey = 'Last Week';
          } else if (date > new Date(today.getFullYear(), today.getMonth() - 1, today.getDate())) {
            groupKey = 'Last Month';
          } else {
            groupKey = 'Older';
          }

          // Create group if it doesn't exist
          if (!groupedViews[groupKey]) {
            groupedViews[groupKey] = new Map();
          }

          // Use a Map to ensure each content item appears only once per group
          // The key is content_type-content_id, and the value is the content details
          const contentKey = `${view.content_type}-${view.content_id}`;
          if (!groupedViews[groupKey].has(contentKey)) {
            groupedViews[groupKey].set(contentKey, {
              id: view.content_id,
              type: view.content_type
            });
          }
        });

        // Fetch content details for all unique content IDs
        const contentDetails: { [key: string]: ContentItem } = {};
        const contentPromises: Promise<void>[] = [];

        // Process each unique content ID
        for (const [groupKey, contentMap] of Object.entries(groupedViews)) {
          for (const [contentKey, content] of contentMap.entries()) {
            const { id, type } = content;
            
            // Skip if we've already processed this content item
            if (contentDetails[contentKey]) continue;
            
            // Create a promise for each content item
            const contentPromise = (async () => {
              try {
                let contentData, authorData;
                
                // Get content details based on type
                if (type === 'article') {
                  const { data: article } = await supabase
                    .from('articles')
                    .select('title, excerpt, cover_url, author_id, category, view_count, created_at')
                    .eq('id', id)
                    .single();
                    
                  if (article) {
                    contentData = article;
                    
                    // Get author details
                    const { data: author } = await supabase
                      .from('profiles')
                      .select('id, name, username, avatar_url')
                      .eq('id', article.author_id)
                      .single();
                      
                    authorData = author;
                  }
                } 
                else if (type === 'book') {
                  const { data: book } = await supabase
                    .from('books')
                    .select('title, description, cover_url, author_id, category, view_count, created_at')
                    .eq('id', id)
                    .single();
                    
                  if (book) {
                    contentData = book;
                    
                    // Get author details
                    const { data: author } = await supabase
                      .from('profiles')
                      .select('id, name, username, avatar_url')
                      .eq('id', book.author_id)
                      .single();
                      
                    authorData = author;
                  }
                }
                else if (type === 'audiobook') {
                  const { data: audiobook } = await supabase
                    .from('audiobooks')
                    .select('title, description, cover_url, author_id, category, view_count, created_at')
                    .eq('id', id)
                    .single();
                    
                  if (audiobook) {
                    contentData = audiobook;
                    
                    // Get author details
                    const { data: author } = await supabase
                      .from('profiles')
                      .select('id, name, username, avatar_url')
                      .eq('id', audiobook.author_id)
                      .single();
                      
                    authorData = author;
                  }
                }
                else if (type === 'podcast') {
                  const { data: podcast } = await supabase
                    .from('podcast_episodes')
                    .select('title, description, cover_url, author_id, category, view_count, created_at, duration')
                    .eq('id', id)
                    .single();
                    
                  if (podcast) {
                    contentData = podcast;
                    
                    // Get author details
                    const { data: author } = await supabase
                      .from('profiles')
                      .select('id, name, username, avatar_url')
                      .eq('id', podcast.author_id)
                      .single();
                      
                    authorData = author;
                  }
                }
                
                // If we have content data, create a ContentItem
                if (contentData && authorData) {
                  contentDetails[contentKey] = {
                    id,
                    type: type as any,
                    title: contentData.title,
                    thumbnail: contentData.cover_url || `https://source.unsplash.com/random/800x600?${type}&sig=${id}`,
                    duration: contentData.duration || (type === 'article' ? '5 min read' : '30 min'),
                    views: contentData.view_count || 0,
                    createdAt: contentData.created_at,
                    creator: {
                      id: authorData.id,
                      name: authorData.name || authorData.username || 'Unknown Author',
                      avatar: authorData.avatar_url || `https://source.unsplash.com/random/100x100?face&sig=${authorData.id}`,
                      followers: 0
                    },
                    category: contentData.category,
                    // Calculate a deterministic progress value based on the content ID
                    progress: parseInt(id.substring(0, 8), 16) % 101 // 0-100 range
                  };
                }
              } catch (error) {
                console.error(`Error fetching content details for ${type}-${id}:`, error);
              }
            })();
            
            contentPromises.push(contentPromise);
          }
        }

        // Wait for all content details to be fetched
        await Promise.all(contentPromises);

        // Convert grouped views to ContentItem arrays
        const historyGroups: { [key: string]: ContentItem[] } = {};
        
        for (const [groupKey, contentMap] of Object.entries(groupedViews)) {
          historyGroups[groupKey] = Array.from(contentMap.values())
            .map(content => {
              const contentKey = `${content.type}-${content.id}`;
              return contentDetails[contentKey];
            })
            .filter(Boolean); // Remove any undefined items
        }

        setHistoryItems(historyGroups);
      } catch (error) {
        console.error('Error loading history:', error);
        setError('Failed to load history. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    loadHistory();
  }, [user, selectedPeriod, selectedTypes]);

  const handleClearHistory = async () => {
    if (!user) return;

    try {
      setLoading(true);
      
      // Delete all content views for this user
      const { error } = await supabase
        .from('content_views')
        .delete()
        .eq('viewer_id', user.id);
        
      if (error) throw error;
      
      // Clear the history state
      setHistoryItems({});
      setShowClearConfirm(false);
    } catch (error) {
      console.error('Error clearing history:', error);
      setError('Failed to clear history. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-medium mb-2">Sign in to view your history</h3>
        <p className="text-muted-foreground">
          Track your learning journey and revisit content
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
            <Clock className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold">History</h1>
            <p className="text-muted-foreground">
              Track your learning journey and revisit content
            </p>
          </div>
        </div>
        <button
          onClick={() => setShowClearConfirm(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-destructive hover:bg-destructive/10 transition-colors"
        >
          <Trash2 className="w-4 h-4" />
          <span>Clear History</span>
        </button>
      </div>

      {/* Filters */}
      <HistoryFilters
        selectedPeriod={selectedPeriod}
        onPeriodChange={setSelectedPeriod}
        selectedTypes={selectedTypes}
        onTypesChange={setSelectedTypes}
      />

      {/* Error Message */}
      {error && (
        <div className="p-4 bg-destructive/10 text-destructive rounded-lg flex items-center gap-2">
          <AlertCircle className="w-4 h-4" />
          <p>{error}</p>
        </div>
      )}

      {/* History Content */}
      {loading ? (
        <div className="space-y-8">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="space-y-4">
              <div className="h-6 bg-muted rounded w-32 animate-pulse" />
              <div className="space-y-4">
                {Array.from({ length: 2 }).map((_, j) => (
                  <div key={j} className="bg-card border rounded-lg p-4 animate-pulse">
                    <div className="flex gap-4">
                      <div className="w-40 h-24 bg-muted rounded" />
                      <div className="flex-1 space-y-2">
                        <div className="h-4 bg-muted rounded w-3/4" />
                        <div className="h-3 bg-muted rounded w-1/2" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : Object.keys(historyItems).length > 0 ? (
        <div className="space-y-8">
          {Object.entries(historyItems).map(([date, items]) => (
            <div key={date} className="space-y-4">
              <h2 className="text-lg font-semibold">{date}</h2>
              <div className="space-y-4">
                {items.map((item) => (
                  <div 
                    key={`${item.type}-${item.id}`} 
                    className="bg-card border rounded-lg p-4 hover:border-primary/50 transition-colors cursor-pointer"
                    onClick={() => {
                      // Navigate based on content type
                      switch (item.type) {
                        case 'article':
                          navigate(`/reader/article-${item.id}`);
                          break;
                        case 'book':
                          navigate(`/reader/book-${item.id}`);
                          break;
                        case 'audiobook':
                        case 'podcast':
                          navigate(`/player/${item.type}-${item.id}`);
                          break;
                      }
                    }}
                  >
                    <div className="flex gap-4">
                      {/* Thumbnail */}
                      <div className="relative flex-shrink-0">
                        <div className="w-40 h-24 rounded-md overflow-hidden">
                          <img
                            src={item.thumbnail}
                            alt={item.title}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              const img = e.target as HTMLImageElement;
                              img.src = `https://source.unsplash.com/random/400x240?${item.type}&sig=${item.id}`;
                            }}
                          />
                        </div>

                        {/* Progress bar */}
                        {item.progress !== undefined && item.progress > 0 && (
                          <div className="absolute bottom-0 left-0 right-0 h-1 bg-background/50">
                            <div 
                              className="h-full bg-primary transition-all"
                              style={{ width: `${item.progress}%` }}
                            />
                          </div>
                        )}

                        {/* Play button for audio/video content */}
                        {(item.type === 'audiobook' || item.type === 'podcast') && (
                          <div className="absolute inset-0 flex items-center justify-center bg-black/0 hover:bg-black/40 transition-colors">
                            <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                              <Play className="w-5 h-5 text-primary-foreground ml-1" />
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <h3 className="font-medium line-clamp-1 hover:text-primary transition-colors">
                              {item.title}
                            </h3>
                            <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                              <div className="flex items-center gap-1">
                                <ContentTypeIcon type={item.type} className="w-4 h-4" />
                                <span className="capitalize">{item.type}</span>
                              </div>
                              <span>•</span>
                              <span>{item.creator.name}</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <Clock className="w-4 h-4" />
                            <span>{item.duration}</span>
                          </div>
                        </div>

                        {item.progress !== undefined && (
                          <div className="mt-2 text-sm text-muted-foreground">
                            {item.progress === 100 ? (
                              <span className="text-primary">Completed</span>
                            ) : (
                              <span>{Math.round(item.progress)}% complete</span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <h3 className="text-lg font-medium mb-2">No history found</h3>
          <p className="text-muted-foreground">
            {selectedTypes.length > 0 || selectedPeriod !== 'all'
              ? 'Try selecting different content types or time period'
              : 'Start exploring content to build your history'}
          </p>
        </div>
      )}

      {/* Clear History Confirmation Dialog */}
      {showClearConfirm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center"
             onClick={() => setShowClearConfirm(false)}>
          <div className="bg-background rounded-lg p-6 max-w-md mx-4 text-center space-y-4"
               onClick={e => e.stopPropagation()}>
            <AlertCircle className="w-12 h-12 text-destructive mx-auto" />
            <h2 className="text-xl font-semibold">Clear History</h2>
            <p className="text-muted-foreground">
              Are you sure you want to clear your entire history? This action cannot be undone.
            </p>
            <div className="flex justify-center gap-4 pt-2">
              <button
                onClick={() => setShowClearConfirm(false)}
                className="px-4 py-2 rounded-lg border hover:bg-accent transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleClearHistory}
                className="px-4 py-2 rounded-lg bg-destructive text-destructive-foreground hover:bg-destructive/90 transition-colors"
              >
                Clear History
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}