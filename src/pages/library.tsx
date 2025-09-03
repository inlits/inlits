import React, { useState, useEffect } from 'react';
import { Search, Filter, BookOpen, Headphones, FileText, Mic, Plus, Eye, Clock, CheckCircle, Pause, X } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/auth';
import { ContentCard } from '../components/content/content-card';
import { CreateShelfDialog } from '../components/library/create-shelf-dialog';
import { LearningGoalsDialog } from '../components/library/learning-goals-dialog';

interface LibraryItem {
  id: string;
  title: string;
  author: string;
  cover_url?: string;
  content_type: 'book' | 'audiobook' | 'article' | 'podcast';
  status: 'want_to_experience' | 'currently_experiencing' | 'experienced' | 'paused' | 'dropped';
  progress?: number;
  started_at?: string;
  completed_at?: string;
  duration?: string;
  view_count?: number;
}

interface CustomShelf {
  id: string;
  name: string;
  description?: string;
  items: LibraryItem[];
}

const statusConfig = {
  want_to_experience: {
    label: 'Want to Experience',
    icon: Plus,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    description: 'Content you plan to consume'
  },
  currently_experiencing: {
    label: 'Currently Experiencing',
    icon: Eye,
    color: 'text-orange-600',
    bgColor: 'bg-orange-50',
    description: 'Content you are actively consuming'
  },
  experienced: {
    label: 'Experienced',
    icon: CheckCircle,
    color: 'text-green-600',
    bgColor: 'bg-green-50',
    description: 'Content you have completed'
  },
  paused: {
    label: 'Paused',
    icon: Pause,
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-50',
    description: 'Content you have temporarily stopped'
  },
  dropped: {
    label: 'Dropped',
    icon: X,
    color: 'text-red-600',
    bgColor: 'bg-red-50',
    description: 'Content you decided not to finish'
  }
};

const contentTypeIcons = {
  book: BookOpen,
  audiobook: Headphones,
  article: FileText,
  podcast: Mic
};

export function Library() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<keyof typeof statusConfig>('want_to_experience');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [libraryItems, setLibraryItems] = useState<LibraryItem[]>([]);
  const [customShelves, setCustomShelves] = useState<CustomShelf[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateShelf, setShowCreateShelf] = useState(false);
  const [showLearningGoals, setShowLearningGoals] = useState(false);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('openLearningGoals') === 'true') {
      setShowLearningGoals(true);
      // Clean up URL
      window.history.replaceState({}, '', window.location.pathname);
    }
    
    if (user) {
      loadLibrary();
      loadCustomShelves();
    }
  }, [user]);

  const loadLibrary = async () => {
    if (!user) return;

    try {
      setLoading(true);
      
      // Load bookmarks as library items
      const { data: bookmarks, error: bookmarksError } = await supabase
        .from('bookmarks')
        .select(`
          content_id,
          content_type,
          created_at
        `)
        .eq('user_id', user.id);

      if (bookmarksError) throw bookmarksError;

      // Load content views to determine status and progress
      const { data: views, error: viewsError } = await supabase
        .from('content_views')
        .select(`
          content_id,
          content_type,
          progress,
          viewed_at,
          view_duration
        `)
        .eq('viewer_id', user.id);

      if (viewsError) throw viewsError;

      // Create a map of content views for quick lookup
      const viewsMap = new Map();
      views?.forEach(view => {
        const key = `${view.content_id}-${view.content_type}`;
        if (!viewsMap.has(key) || new Date(view.viewed_at) > new Date(viewsMap.get(key).viewed_at)) {
          viewsMap.set(key, view);
        }
      });

      // Load actual content details
      const contentPromises = bookmarks?.map(async (bookmark) => {
        let contentData = null;
        let tableName = '';
        
        switch (bookmark.content_type) {
          case 'book':
            tableName = 'books';
            break;
          case 'audiobook':
            tableName = 'audiobooks';
            break;
          case 'article':
            tableName = 'articles';
            break;
          case 'podcast':
            tableName = 'podcast_episodes';
            break;
        }

        if (tableName) {
          const { data } = await supabase
            .from(tableName)
            .select(`
              id,
              title,
              cover_url,
              view_count,
              ${bookmark.content_type === 'podcast' ? 'duration,' : ''}
              profiles!${tableName}_author_id_fkey(username)
            `)
            .eq('id', bookmark.content_id)
            .eq('status', 'published')
            .single();

          contentData = data;
        }

        if (!contentData) return null;

        const viewKey = `${bookmark.content_id}-${bookmark.content_type}`;
        const viewData = viewsMap.get(viewKey);
        
        // Determine status based on progress and views
        let status: LibraryItem['status'] = 'want_to_experience';
        let progress = 0;
        let started_at = null;
        let completed_at = null;

        if (viewData) {
          progress = viewData.progress || 0;
          started_at = viewData.viewed_at;
          
          if (progress >= 100) {
            status = 'experienced';
            completed_at = viewData.viewed_at;
          } else if (progress > 0) {
            status = 'currently_experiencing';
          }
        }

        return {
          id: contentData.id,
          title: contentData.title,
          author: contentData.profiles?.username || 'Unknown Author',
          cover_url: contentData.cover_url,
          content_type: bookmark.content_type,
          status,
          progress,
          started_at,
          completed_at,
          duration: contentData.duration,
          view_count: contentData.view_count
        };
      }) || [];

      const resolvedItems = await Promise.all(contentPromises);
      const validItems = resolvedItems.filter(item => item !== null) as LibraryItem[];
      
      setLibraryItems(validItems);
    } catch (error) {
      console.error('Error loading library:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadCustomShelves = async () => {
    if (!user) return;

    try {
      const { data: shelves, error } = await supabase
        .from('custom_shelves')
        .select(`
          id,
          name,
          description,
          shelf_items(
            content_id,
            content_type
          )
        `)
        .eq('user_id', user.id);

      if (error) throw error;

      // Load content for each shelf
      const shelvesWithContent = await Promise.all(
        shelves?.map(async (shelf) => {
          const items = await Promise.all(
            shelf.shelf_items?.map(async (item) => {
              let tableName = '';
              switch (item.content_type) {
                case 'book':
                  tableName = 'books';
                  break;
                case 'audiobook':
                  tableName = 'audiobooks';
                  break;
                case 'article':
                  tableName = 'articles';
                  break;
                case 'podcast':
                  tableName = 'podcast_episodes';
                  break;
              }

              if (tableName) {
                const { data } = await supabase
                  .from(tableName)
                  .select(`
                    id,
                    title,
                    cover_url,
                    ${item.content_type === 'podcast' ? 'duration,' : ''}
                    profiles!${tableName}_author_id_fkey(username)
                  `)
                  .eq('id', item.content_id)
                  .eq('status', 'published')
                  .single();

                if (data) {
                  return {
                    id: data.id,
                    title: data.title,
                    author: data.profiles?.username || 'Unknown Author',
                    cover_url: data.cover_url,
                    content_type: item.content_type,
                    status: 'want_to_experience' as const,
                    duration: data.duration
                  };
                }
              }
              return null;
            }) || []
          );

          return {
            id: shelf.id,
            name: shelf.name,
            description: shelf.description,
            items: items.filter(item => item !== null) as LibraryItem[]
          };
        }) || []
      );

      setCustomShelves(shelvesWithContent);
    } catch (error) {
      console.error('Error loading custom shelves:', error);
    }
  };

  const updateItemStatus = async (itemId: string, contentType: string, newStatus: LibraryItem['status']) => {
    if (!user) return;

    try {
      // For now, we'll just update the local state since we don't have the reading_status table
      setLibraryItems(prev => 
        prev.map(item => 
          item.id === itemId && item.content_type === contentType
            ? { ...item, status: newStatus }
            : item
        )
      );
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  const removeFromLibrary = async (itemId: string, contentType: string) => {
    if (!user) return;

    try {
      // Remove from bookmarks
      const { error } = await supabase
        .from('bookmarks')
        .delete()
        .eq('user_id', user.id)
        .eq('content_id', itemId)
        .eq('content_type', contentType);

      if (error) throw error;

      // Update local state
      setLibraryItems(prev => 
        prev.filter(item => !(item.id === itemId && item.content_type === contentType))
      );
    } catch (error) {
      console.error('Error removing from library:', error);
    }
  };

  const handleLearningGoalAdded = async () => {
    await loadLibrary();
    await loadCustomShelves();
  };

  const filteredItems = libraryItems.filter(item => {
    const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         item.author.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = filterType === 'all' || item.content_type === filterType;
    const matchesStatus = item.status === activeTab;
    
    return matchesSearch && matchesType && matchesStatus;
  });

  const getContentUrl = (item: LibraryItem) => {
    switch (item.content_type) {
      case 'book':
        return `/reader/${item.id}`;
      case 'audiobook':
      case 'podcast':
        return `/player/${item.id}`;
      case 'article':
        return `/reader/${item.id}`;
      default:
        return '#';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-8"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="bg-white dark:bg-gray-800 rounded-lg p-4">
                  <div className="h-48 bg-gray-200 dark:bg-gray-700 rounded mb-4"></div>
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">My Library</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Organize and track your learning journey
            </p>
          </div>
          <div className="flex gap-3 mt-4 sm:mt-0">
            <button
              onClick={() => setShowCreateShelf(true)}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
            >
              Create Shelf
            </button>
            <button
              onClick={() => setShowLearningGoals(true)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              Learning Goals
            </button>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search your library..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="pl-10 pr-8 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent appearance-none"
            >
              <option value="all">All Types</option>
              <option value="book">Books</option>
              <option value="audiobook">Audiobooks</option>
              <option value="article">Articles</option>
              <option value="podcast">Podcasts</option>
            </select>
          </div>
        </div>

        {/* Status Tabs */}
        <div className="flex flex-wrap gap-2 mb-8 border-b border-gray-200 dark:border-gray-700">
          {Object.entries(statusConfig).map(([status, config]) => {
            const Icon = config.icon;
            const count = libraryItems.filter(item => item.status === status).length;
            
            return (
              <button
                key={status}
                onClick={() => setActiveTab(status as keyof typeof statusConfig)}
                className={`flex items-center gap-2 px-4 py-3 rounded-t-lg transition-colors ${
                  activeTab === status
                    ? 'bg-white dark:bg-gray-800 border-t border-l border-r border-gray-200 dark:border-gray-700 text-primary'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-800'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span className="font-medium">{config.label}</span>
                <span className="bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 px-2 py-1 rounded-full text-xs">
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Content Grid */}
        <div className="mb-12">
          {filteredItems.length === 0 ? (
            <div className="text-center py-12">
              <div className={`w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center ${statusConfig[activeTab].bgColor}`}>
                {React.createElement(statusConfig[activeTab].icon, {
                  className: `w-8 h-8 ${statusConfig[activeTab].color}`
                })}
              </div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                No content in "{statusConfig[activeTab].label}"
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                {statusConfig[activeTab].description}
              </p>
              <button
                onClick={() => window.location.href = '/search'}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
              >
                Discover Content
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredItems.map((item) => (
                <div key={`${item.id}-${item.content_type}`} className="group relative">
                  <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm hover:shadow-md transition-shadow overflow-hidden">
                    {/* Cover Image */}
                    <div className="aspect-[3/4] relative overflow-hidden">
                      {item.cover_url ? (
                        <img
                          src={item.cover_url}
                          alt={item.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                          {React.createElement(contentTypeIcons[item.content_type], {
                            className: "w-12 h-12 text-gray-400"
                          })}
                        </div>
                      )}
                      
                      {/* Progress Bar */}
                      {item.progress && item.progress > 0 && (
                        <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 p-2">
                          <div className="w-full bg-gray-300 rounded-full h-2">
                            <div
                              className="bg-primary h-2 rounded-full transition-all duration-300"
                              style={{ width: `${item.progress}%` }}
                            ></div>
                          </div>
                          <p className="text-white text-xs mt-1">{item.progress}% complete</p>
                        </div>
                      )}

                      {/* Content Type Badge */}
                      <div className="absolute top-2 left-2">
                        <div className="bg-black bg-opacity-70 text-white px-2 py-1 rounded text-xs flex items-center gap-1">
                          {React.createElement(contentTypeIcons[item.content_type], {
                            className: "w-3 h-3"
                          })}
                          {item.content_type}
                        </div>
                      </div>

                      {/* Status Dropdown */}
                      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <select
                          value={item.status}
                          onChange={(e) => updateItemStatus(item.id, item.content_type, e.target.value as LibraryItem['status'])}
                          className="bg-black bg-opacity-70 text-white text-xs rounded px-2 py-1 border-none focus:ring-2 focus:ring-primary"
                        >
                          {Object.entries(statusConfig).map(([status, config]) => (
                            <option key={status} value={status} className="bg-gray-800">
                              {config.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Content Info */}
                    <div className="p-4">
                      <h3 className="font-semibold text-gray-900 dark:text-white mb-1 line-clamp-2">
                        {item.title}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                        by {item.author}
                      </p>
                      
                      {/* Duration for audio content */}
                      {item.duration && (
                        <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 mb-2">
                          <Clock className="w-3 h-3" />
                          {item.duration}
                        </div>
                      )}

                      {/* Action Buttons */}
                      <div className="flex gap-2">
                        <a
                          href={getContentUrl(item)}
                          className="flex-1 px-3 py-2 bg-primary text-primary-foreground text-sm rounded hover:bg-primary/90 transition-colors text-center"
                        >
                          {item.content_type === 'audiobook' || item.content_type === 'podcast' ? 'Listen' : 'Read'}
                        </a>
                        <button
                          onClick={() => removeFromLibrary(item.id, item.content_type)}
                          className="px-3 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 text-sm rounded hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Custom Shelves */}
        {customShelves.length > 0 && (
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Custom Shelves</h2>
            <div className="space-y-8">
              {customShelves.map((shelf) => (
                <div key={shelf.id} className="bg-white dark:bg-gray-800 rounded-lg p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        {shelf.name}
                      </h3>
                      {shelf.description && (
                        <p className="text-gray-600 dark:text-gray-400 text-sm">
                          {shelf.description}
                        </p>
                      )}
                    </div>
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      {shelf.items.length} items
                    </span>
                  </div>
                  
                  {shelf.items.length === 0 ? (
                    <p className="text-gray-500 dark:text-gray-400 text-center py-8">
                      This shelf is empty. Add some content to get started!
                    </p>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                      {shelf.items.map((item) => (
                        <div key={`${item.id}-${item.content_type}`} className="group">
                          <a href={getContentUrl(item)} className="block">
                            <div className="aspect-[3/4] relative overflow-hidden rounded-lg mb-2">
                              {item.cover_url ? (
                                <img
                                  src={item.cover_url}
                                  alt={item.title}
                                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                                />
                              ) : (
                                <div className="w-full h-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                                  {React.createElement(contentTypeIcons[item.content_type], {
                                    className: "w-8 h-8 text-gray-400"
                                  })}
                                </div>
                              )}
                            </div>
                            <h4 className="text-sm font-medium text-gray-900 dark:text-white line-clamp-2 mb-1">
                              {item.title}
                            </h4>
                            <p className="text-xs text-gray-600 dark:text-gray-400">
                              {item.author}
                            </p>
                          </a>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Dialogs */}
      <CreateShelfDialog
        isOpen={showCreateShelf}
        onClose={() => setShowCreateShelf(false)}
        onShelfCreated={loadCustomShelves}
      />
      
      <LearningGoalsDialog
        isOpen={showLearningGoals}
        onClose={() => setShowLearningGoals(false)}
        onAddGoal={handleLearningGoalAdded}
      />
    </div>
  );
}