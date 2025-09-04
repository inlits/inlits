import React, { useState, useEffect } from 'react';
import { 
  BookOpen, 
  Headphones, 
  Play, 
  Pause, 
  Plus,
  AlertCircle,
  Clock,
  Target,
  CheckCircle,
  Eye,
  Star,
  Filter,
  Search,
  MoreHorizontal,
} from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ReadingStatusDialog } from '@/components/library/reading-status-dialog';
import type { ContentItem } from '@/lib/types';

interface ReadingStatusItem extends ContentItem {
  status: string;
  progress: number;
  started_at?: string;
  completed_at?: string;
  reading_status_id: string;
}

export function LibraryPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('want_to_consume');
  const [searchQuery, setSearchQuery] = useState('');
  const [contentFilter, setContentFilter] = useState<'all' | 'book' | 'audiobook' | 'article' | 'podcast'>('all');
  const [showStatusDialog, setShowStatusDialog] = useState(false);
  const [statusDialogConfig, setStatusDialogConfig] = useState<{
    status: string;
    title: string;
  }>({ status: 'want_to_consume', title: 'Add to Library' });

  // Reading status data
  const [readingStatusItems, setReadingStatusItems] = useState<{
    want_to_consume: ReadingStatusItem[];
    consuming: ReadingStatusItem[];
    completed: ReadingStatusItem[];
    paused: ReadingStatusItem[];
    dropped: ReadingStatusItem[];
  }>({
    want_to_consume: [],
    consuming: [],
    completed: [],
    paused: [],
    dropped: []
  });

  // Check if we should open learning goals dialog from URL params
  useEffect(() => {
    const openLearningGoals = searchParams.get('openLearningGoals');
    if (openLearningGoals === 'true') {
      setStatusDialogConfig({
        status: 'want_to_consume',
        title: 'Add to Learning Goals'
      });
      setShowStatusDialog(true);
      
      // Clean up URL
      const newSearchParams = new URLSearchParams(searchParams);
      newSearchParams.delete('openLearningGoals');
      window.history.replaceState(
        {},
        '',
        `${window.location.pathname}?${newSearchParams.toString()}`
      );
    }
  }, [searchParams]);

  const loadLibrary = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Get all reading status items for the user
      const { data: statusData, error: statusError } = await supabase
        .from('reading_status')
        .select('*')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false });

      if (statusError) throw statusError;

      console.log(`Found ${statusData?.length || 0} reading status items`);

      // Get content details for each status item
      const statusItems: ReadingStatusItem[] = [];
      const processedItems = new Set<string>();

      // Process status items in batches
      const statusBatches = chunk(statusData || [], 10);
      
      for (const batch of statusBatches) {
        const batchPromises = batch.map(async (statusItem) => {
          try {
            const itemKey = `${statusItem.content_type}-${statusItem.content_id}`;
            
            if (processedItems.has(itemKey)) {
              return;
            }
            
            processedItems.add(itemKey);
            
            let contentData;
            let authorData;
            
            // Get content details based on type
            if (statusItem.content_type === 'book') {
              const { data: book } = await supabase
                .from('books')
                .select('title, description, cover_url, author_id, category, view_count, created_at')
                .eq('id', statusItem.content_id)
                .single();
                
              if (book) {
                contentData = book;
                
                const { data: author } = await supabase
                  .from('profiles')
                  .select('id, name, username, avatar_url')
                  .eq('id', book.author_id)
                  .single();
                  
                authorData = author;
              }
            } 
            else if (statusItem.content_type === 'audiobook') {
              const { data: audiobook } = await supabase
                .from('audiobooks')
                .select('title, description, cover_url, author_id, category, view_count, created_at')
                .eq('id', statusItem.content_id)
                .single();
                
              if (audiobook) {
                contentData = audiobook;
                
                const { data: author } = await supabase
                  .from('profiles')
                  .select('id, name, username, avatar_url')
                  .eq('id', audiobook.author_id)
                  .single();
                  
                authorData = author;
              }
            }
            else if (statusItem.content_type === 'article') {
              const { data: article } = await supabase
                .from('articles')
                .select('title, excerpt, cover_url, author_id, category, view_count, created_at')
                .eq('id', statusItem.content_id)
                .single();
                
              if (article) {
                contentData = article;
                
                const { data: author } = await supabase
                  .from('profiles')
                  .select('id, name, username, avatar_url')
                  .eq('id', article.author_id)
                  .single();
                  
                authorData = author;
              }
            }
            else if (statusItem.content_type === 'podcast') {
              const { data: podcast } = await supabase
                .from('podcast_episodes')
                .select('title, description, cover_url, author_id, category, view_count, created_at, duration')
                .eq('id', statusItem.content_id)
                .single();
                
              if (podcast) {
                contentData = podcast;
                
                const { data: author } = await supabase
                  .from('profiles')
                  .select('id, name, username, avatar_url')
                  .eq('id', podcast.author_id)
                  .single();
                  
                authorData = author;
              }
            }
            
            if (contentData && authorData) {
              statusItems.push({
                id: statusItem.content_id,
                type: statusItem.content_type as any,
                title: contentData.title,
                thumbnail: contentData.cover_url || `https://source.unsplash.com/random/800x600?${statusItem.content_type}&sig=${statusItem.content_id}`,
                duration: contentData.duration || (statusItem.content_type === 'article' ? '5 min read' : '30 min'),
                views: contentData.view_count || 0,
                createdAt: contentData.created_at,
                creator: {
                  id: authorData.id,
                  name: authorData.name || authorData.username || 'Unknown Author',
                  avatar: authorData.avatar_url || `https://source.unsplash.com/random/100x100?face&sig=${authorData.id}`,
                  followers: 0
                },
                category: contentData.category,
                status: statusItem.status,
                progress: statusItem.progress,
                started_at: statusItem.started_at,
                completed_at: statusItem.completed_at,
                reading_status_id: statusItem.id
              });
            }
          } catch (error) {
            console.error(`Error processing status item ${statusItem.content_id}:`, error);
          }
        });
        
        await Promise.all(batchPromises);
      }

      // Group items by status
      const groupedItems = {
        want_to_consume: statusItems.filter(item => item.status === 'want_to_consume'),
        consuming: statusItems.filter(item => item.status === 'consuming'),
        completed: statusItems.filter(item => item.status === 'completed'),
        paused: statusItems.filter(item => item.status === 'paused'),
        dropped: statusItems.filter(item => item.status === 'dropped')
      };

      setReadingStatusItems(groupedItems);

    } catch (err) {
      console.error('Error loading library:', err);
      setError(err instanceof Error ? err.message : 'Failed to load library');
    } finally {
      setLoading(false);
    }
  };

  // Helper function to chunk an array
  function chunk<T>(array: T[], size: number): T[][] {
    const chunked: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
      chunked.push(array.slice(i, i + size));
    }
    return chunked;
  }

  useEffect(() => {
    loadLibrary();
  }, [user]);

  const handleAddToStatus = async (item: ContentItem, status: string) => {
    if (!user) return;

    try {
      // Add or update reading status
      const { error } = await supabase
        .from('reading_status')
        .upsert({
          user_id: user.id,
          content_id: item.id,
          content_type: item.type,
          status: status,
          progress: status === 'completed' ? 100 : 0,
          started_at: status === 'consuming' ? new Date().toISOString() : null,
          completed_at: status === 'completed' ? new Date().toISOString() : null
        });

      if (error) throw error;

      // Reload library to show updated data
      loadLibrary();
    } catch (error) {
      console.error('Error adding to status:', error);
    }
  };

  const handleStatusChange = async (item: ReadingStatusItem, newStatus: string) => {
    if (!user) return;

    try {
      const updateData: any = {
        status: newStatus,
        updated_at: new Date().toISOString()
      };

      if (newStatus === 'consuming' && item.status === 'want_to_consume') {
        updateData.started_at = new Date().toISOString();
      }

      if (newStatus === 'completed') {
        updateData.completed_at = new Date().toISOString();
        updateData.progress = 100;
      }

      const { error } = await supabase
        .from('reading_status')
        .update(updateData)
        .eq('id', item.reading_status_id);

      if (error) throw error;

      // Update local state
      setReadingStatusItems(prev => {
        const newItems = { ...prev };
        
        // Remove from old status
        Object.keys(newItems).forEach(status => {
          newItems[status as keyof typeof newItems] = newItems[status as keyof typeof newItems].filter(
            i => i.reading_status_id !== item.reading_status_id
          );
        });
        
        // Add to new status
        const updatedItem = { ...item, status: newStatus, progress: newStatus === 'completed' ? 100 : item.progress };
        newItems[newStatus as keyof typeof newItems].push(updatedItem);
        
        return newItems;
      });
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  const handleRemoveFromStatus = async (item: ReadingStatusItem) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('reading_status')
        .delete()
        .eq('id', item.reading_status_id);

      if (error) throw error;

      // Remove from local state
      setReadingStatusItems(prev => ({
        ...prev,
        [item.status]: prev[item.status as keyof typeof prev].filter(
          i => i.reading_status_id !== item.reading_status_id
        )
      }));
    } catch (error) {
      console.error('Error removing from status:', error);
    }
  };

  const handleContentClick = (item: ReadingStatusItem) => {
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
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'want_to_consume':
        return 'Want to Experience';
      case 'consuming':
        return 'Currently Experiencing';
      case 'completed':
        return 'Experienced';
      case 'paused':
        return 'Paused';
      case 'dropped':
        return 'Dropped';
      default:
        return status;
    }
  };

  const getStatusDescription = (status: string) => {
    switch (status) {
      case 'want_to_consume':
        return 'Content you plan to read or listen to';
      case 'consuming':
        return 'Content you are actively reading or listening to';
      case 'completed':
        return 'Content you have finished';
      case 'paused':
        return 'Content you have temporarily stopped';
      case 'dropped':
        return 'Content you decided not to finish';
      default:
        return '';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'want_to_consume':
        return <Target className="w-6 h-6 text-primary" />;
      case 'consuming':
        return <Play className="w-6 h-6 text-primary" />;
      case 'completed':
        return <CheckCircle className="w-6 h-6 text-primary" />;
      case 'paused':
        return <Pause className="w-6 h-6 text-primary" />;
      case 'dropped':
        return <Eye className="w-6 h-6 text-primary" />;
      default:
        return <BookOpen className="w-6 h-6 text-primary" />;
    }
  };

  const getContentIcon = (type: string) => {
    switch (type) {
      case 'audiobook':
      case 'podcast':
        return <Headphones className="w-4 h-4" />;
      default:
        return <BookOpen className="w-4 h-4" />;
    }
  };

  const getActionLabel = (type: string) => {
    switch (type) {
      case 'audiobook':
      case 'podcast':
        return 'Listen';
      default:
        return 'Read';
    }
  };

  // Filter items based on search and content type
  const getFilteredItems = (items: ReadingStatusItem[]) => {
    let filtered = items;

    if (contentFilter !== 'all') {
      filtered = filtered.filter(item => item.type === contentFilter);
    }

    if (searchQuery) {
      filtered = filtered.filter(item =>
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.creator.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    return filtered;
  };

  const tabs = [
    { id: 'want_to_consume', label: 'Want to Experience', count: readingStatusItems.want_to_consume.length },
    { id: 'consuming', label: 'Currently Experiencing', count: readingStatusItems.consuming.length },
    { id: 'completed', label: 'Experienced', count: readingStatusItems.completed.length },
    { id: 'paused', label: 'Paused', count: readingStatusItems.paused.length },
    { id: 'dropped', label: 'Dropped', count: readingStatusItems.dropped.length }
  ];

  if (!user) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-medium mb-2">Sign in to access your library</h3>
        <p className="text-muted-foreground">
          Keep track of your reading progress and organize your content
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="w-12 h-12 text-destructive mx-auto" />
        <p className="text-destructive mb-4 mt-2">{error}</p>
        <button
          onClick={() => loadLibrary()}
          className="text-primary hover:underline"
        >
          Try again
        </button>
      </div>
    );
  }

  const currentItems = getFilteredItems(readingStatusItems[activeTab as keyof typeof readingStatusItems]);

  return (
    <div className="space-y-6 overflow-x-hidden">
      {/* Header */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold mb-2">My Library</h1>
          <button
            onClick={() => {
              setStatusDialogConfig({
                status: 'want_to_consume',
                title: 'Add to Library'
              });
              setShowStatusDialog(true);
            }}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Add Content</span>
          </button>
        </div>
        <p className="text-muted-foreground">
          Track your learning journey across all content types
        </p>
      </div>

      {/* Tabs */}
      <div className="border-b">
        <div className="relative">
          <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-2">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-3 py-2 text-sm font-medium border-b-2 -mb-px transition-colors whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
              >
                <span>{tab.label}</span>
                <span className="bg-muted text-muted-foreground px-2 py-0.5 rounded-full text-xs">
                  {tab.count}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="space-y-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search your library..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-10 pl-9 pr-4 border rounded-lg bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide pb-2">
          <Filter className="w-4 h-4 text-muted-foreground" />
          <div className="flex gap-2 whitespace-nowrap">
            <button
              onClick={() => setContentFilter('all')}
              className={`px-3 py-1.5 text-sm rounded-lg transition-colors whitespace-nowrap ${
                contentFilter === 'all'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted hover:bg-primary/10'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setContentFilter('book')}
              className={`px-3 py-1.5 text-sm rounded-lg transition-colors flex items-center gap-1 whitespace-nowrap ${
                contentFilter === 'book'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted hover:bg-primary/10'
              }`}
            >
              <BookOpen className="w-3 h-3" />
              Books
            </button>
            <button
              onClick={() => setContentFilter('audiobook')}
              className={`px-3 py-1.5 text-sm rounded-lg transition-colors flex items-center gap-1 whitespace-nowrap ${
                contentFilter === 'audiobook'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted hover:bg-primary/10'
              }`}
            >
              <Headphones className="w-3 h-3" />
              Audiobooks
            </button>
            <button
              onClick={() => setContentFilter('article')}
              className={`px-3 py-1.5 text-sm rounded-lg transition-colors flex items-center gap-1 whitespace-nowrap ${
                contentFilter === 'article'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted hover:bg-primary/10'
              }`}
            >
              <BookOpen className="w-3 h-3" />
              Articles
            </button>
            <button
              onClick={() => setContentFilter('podcast')}
              className={`px-3 py-1.5 text-sm rounded-lg transition-colors flex items-center gap-1 whitespace-nowrap ${
                contentFilter === 'podcast'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted hover:bg-primary/10'
              }`}
            >
              <Headphones className="w-3 h-3" />
              Podcasts
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="space-y-6">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
              {getStatusIcon(activeTab)}
            </div>
            <div>
              <h2 className="text-xl font-semibold">{getStatusLabel(activeTab)}</h2>
              <p className="text-sm text-muted-foreground">{getStatusDescription(activeTab)}</p>
            </div>
          </div>

          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="aspect-[2/3] bg-muted rounded-lg mb-2" />
                  <div className="h-4 bg-muted rounded w-3/4 mb-1" />
                  <div className="h-3 bg-muted rounded w-1/2" />
                </div>
              ))}
            </div>
          ) : currentItems.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {currentItems.map((item) => (
                <div key={`${item.type}-${item.id}`} className="group space-y-3">
                  {/* Thumbnail */}
                  <div 
                    onClick={() => handleContentClick(item)}
                    className="cursor-pointer relative aspect-[2/3] rounded-lg overflow-hidden bg-muted"
                  >
                    <img
                      src={item.thumbnail}
                      alt={item.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      onError={(e) => {
                        const img = e.target as HTMLImageElement;
                        img.src = `https://source.unsplash.com/random/400x600?${item.type}&sig=${item.id}`;
                      }}
                    />
                    
                    {/* Content type badge */}
                    <div className="absolute top-2 left-2 px-2 py-1 rounded-full bg-background/90 text-xs font-medium flex items-center gap-1 shadow-sm">
                      {getContentIcon(item.type)}
                      <span className="capitalize hidden sm:inline">{item.type}</span>
                    </div>

                    {/* Progress bar */}
                    {item.progress > 0 && (
                      <div className="absolute bottom-0 left-0 right-0 h-1 bg-background/50">
                        <div 
                          className="h-full bg-primary transition-all"
                          style={{ width: `${item.progress}%` }}
                        />
                      </div>
                    )}

                    {/* Play button for audio content */}
                    {(item.type === 'audiobook' || item.type === 'podcast') && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/40 transition-colors">
                        <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <Play className="w-6 h-6 text-primary-foreground ml-1" />
                        </div>
                      </div>
                    )}

                    {/* Status dropdown - Fixed visibility */}
                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity z-[100]">
                      <div className="relative">
                        <button 
                          onClick={(e) => e.stopPropagation()}
                          className="w-8 h-8 rounded-full bg-background/95 backdrop-blur-sm flex items-center justify-center hover:bg-primary hover:text-primary-foreground transition-colors shadow-lg border"
                        >
                          <MoreHorizontal className="w-4 h-4" />
                        </button>
                        <div className="absolute right-0 top-full mt-2 w-48 bg-background border rounded-lg shadow-xl z-[200] opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none group-hover:pointer-events-auto transform scale-95 group-hover:scale-100">
                          <div className="p-2 space-y-1">
                            {['want_to_consume', 'consuming', 'completed', 'paused', 'dropped'].map(status => (
                              <button
                                key={status}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleStatusChange(item, status);
                                }}
                                className={`w-full text-left px-3 py-2 text-sm rounded-md transition-colors ${
                                  item.status === status
                                    ? 'bg-primary text-primary-foreground'
                                    : 'hover:bg-primary hover:text-primary-foreground'
                                }`}
                              >
                                {getStatusLabel(status)}
                              </button>
                            ))}
                            <div className="border-t pt-1 mt-1">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleRemoveFromStatus(item);
                                }}
                                className="w-full text-left px-3 py-2 text-sm rounded-md text-destructive hover:bg-destructive/10 transition-colors"
                              >
                                Remove from Library
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Content info */}
                  <div className="space-y-1">
                    <h3 className="font-medium line-clamp-2 text-sm group-hover:text-primary transition-colors">
                      {item.title}
                    </h3>
                    <p className="text-xs text-muted-foreground line-clamp-1">
                      {item.creator.name}
                    </p>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Star className="w-3 h-3 fill-yellow-500 text-yellow-500" />
                        <span>4.5</span>
                      </div>
                      {item.progress > 0 && (
                        <span>{item.progress}% complete</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                {getStatusIcon(activeTab)}
              </div>
              <h3 className="text-lg font-medium mb-2">No content in {getStatusLabel(activeTab).toLowerCase()}</h3>
              <p className="text-muted-foreground mb-6">
                {getStatusDescription(activeTab)}
              </p>
              <button
                onClick={() => {
                  setStatusDialogConfig({
                    status: activeTab,
                    title: `Add to ${getStatusLabel(activeTab)}`
                  });
                  setShowStatusDialog(true);
                }}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Add Content
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Reading Status Dialog */}
      {showStatusDialog && (
        <ReadingStatusDialog
          onClose={() => setShowStatusDialog(false)}
          onAddToStatus={handleAddToStatus}
          defaultStatus={statusDialogConfig.status}
          title={statusDialogConfig.title}
        />
      )}

    </div>
  );
}