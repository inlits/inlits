import React, { useState, useEffect } from 'react';
import { X, Search, BookOpen, Star, Calendar, Check, AlertCircle, Headphones, Filter, Play, Pause, Clock } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';

interface ContentItem {
  id: string;
  title: string;
  author: string;
  cover: string;
  rating: number;
  year: number;
  type: 'book' | 'audiobook' | 'article' | 'podcast';
  duration?: string;
  description?: string;
}

interface ReadingStatusDialogProps {
  onClose: () => void;
  onAddToStatus: (item: ContentItem, status: string) => void;
  defaultStatus?: string;
  title?: string;
}

export function ReadingStatusDialog({ 
  onClose, 
  onAddToStatus, 
  defaultStatus = 'want_to_consume',
  title = 'Add to Library'
}: ReadingStatusDialogProps) {
  const { user, profile } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [content, setContent] = useState<ContentItem[]>([]);
  const [selectedItems, setSelectedItems] = useState<ContentItem[]>([]);
  const [addingItems, setAddingItems] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [contentFilter, setContentFilter] = useState<'all' | 'book' | 'audiobook' | 'article' | 'podcast'>('all');
  const [selectedStatus, setSelectedStatus] = useState(defaultStatus);

  const statusOptions = [
    { value: 'want_to_consume', label: 'Want to Experience', description: 'Content you plan to read or listen to' },
    { value: 'consuming', label: 'Currently Experiencing', description: 'Content you are actively reading or listening to' },
    { value: 'completed', label: 'Experienced', description: 'Content you have finished' },
    { value: 'paused', label: 'Paused', description: 'Content you have temporarily stopped' },
    { value: 'dropped', label: 'Dropped', description: 'Content you decided not to finish' }
  ];

  // Load content from database
  useEffect(() => {
    const loadContent = async () => {
      setLoading(true);
      try {
        // Get all published content from the database
        const [booksResult, audiobooksResult, articlesResult, podcastsResult] = await Promise.all([
          supabase
            .from('books')
            .select('id, title, description, cover_url, author_id, created_at, status, category')
            .eq('status', 'published')
            .order('created_at', { ascending: false }),
          
          supabase
            .from('audiobooks')
            .select('id, title, description, cover_url, author_id, narrator, created_at, status, category')
            .eq('status', 'published')
            .order('created_at', { ascending: false }),
            
          supabase
            .from('articles')
            .select('id, title, excerpt, cover_url, author_id, created_at, status, category')
            .eq('status', 'published')
            .order('created_at', { ascending: false }),
            
          supabase
            .from('podcast_episodes')
            .select('id, title, description, cover_url, author_id, duration, created_at, status, category')
            .eq('status', 'published')
            .order('created_at', { ascending: false })
        ]);

        // Process books
        const booksWithAuthors = await Promise.all((booksResult.data || []).map(async (book) => {
          const { data: authorData } = await supabase
            .from('profiles')
            .select('name, username')
            .eq('id', book.author_id)
            .single();

          return {
            id: book.id,
            title: book.title,
            author: authorData?.name || authorData?.username || 'Unknown Author',
            cover: book.cover_url || `https://source.unsplash.com/random/400x600?book&sig=${book.id}`,
            rating: 4.5,
            year: new Date(book.created_at).getFullYear(),
            type: 'book' as const,
            description: book.description
          };
        }));

        // Process audiobooks
        const audiobooksWithAuthors = await Promise.all((audiobooksResult.data || []).map(async (audiobook) => {
          const { data: authorData } = await supabase
            .from('profiles')
            .select('name, username')
            .eq('id', audiobook.author_id)
            .single();

          return {
            id: audiobook.id,
            title: audiobook.title,
            author: authorData?.name || authorData?.username || 'Unknown Author',
            cover: audiobook.cover_url || `https://source.unsplash.com/random/400x600?audiobook&sig=${audiobook.id}`,
            rating: 4.5,
            year: new Date(audiobook.created_at).getFullYear(),
            type: 'audiobook' as const,
            description: audiobook.description,
            duration: '2-4 hours'
          };
        }));

        // Process articles
        const articlesWithAuthors = await Promise.all((articlesResult.data || []).map(async (article) => {
          const { data: authorData } = await supabase
            .from('profiles')
            .select('name, username')
            .eq('id', article.author_id)
            .single();

          return {
            id: article.id,
            title: article.title,
            author: authorData?.name || authorData?.username || 'Unknown Author',
            cover: article.cover_url || `https://source.unsplash.com/random/400x600?article&sig=${article.id}`,
            rating: 4.5,
            year: new Date(article.created_at).getFullYear(),
            type: 'article' as const,
            description: article.excerpt,
            duration: '5-10 min read'
          };
        }));

        // Process podcasts
        const podcastsWithAuthors = await Promise.all((podcastsResult.data || []).map(async (podcast) => {
          const { data: authorData } = await supabase
            .from('profiles')
            .select('name, username')
            .eq('id', podcast.author_id)
            .single();

          return {
            id: podcast.id,
            title: podcast.title,
            author: authorData?.name || authorData?.username || 'Unknown Author',
            cover: podcast.cover_url || `https://source.unsplash.com/random/400x600?podcast&sig=${podcast.id}`,
            rating: 4.5,
            year: new Date(podcast.created_at).getFullYear(),
            type: 'podcast' as const,
            description: podcast.description,
            duration: podcast.duration || '30-60 min'
          };
        }));

        // Combine all content
        let allContent = [...booksWithAuthors, ...audiobooksWithAuthors, ...articlesWithAuthors, ...podcastsWithAuthors];
        
        // Filter by content type if selected
        if (contentFilter !== 'all') {
          allContent = allContent.filter(item => item.type === contentFilter);
        }

        setContent(allContent);
      } catch (error) {
        console.error('Error loading content:', error);
        setError('Failed to load content. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    loadContent();
  }, [contentFilter]);

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      // Reload all content
      setContentFilter('all');
      return;
    }

    setLoading(true);
    try {
      // Search across all content types
      const searchResults = content.filter(item =>
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.author.toLowerCase().includes(searchQuery.toLowerCase())
      );

      setContent(searchResults);
    } catch (error) {
      console.error('Error searching content:', error);
      setError('Failed to search content. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const toggleItemSelection = (item: ContentItem) => {
    if (selectedItems.some(i => i.id === item.id && i.type === item.type)) {
      setSelectedItems(selectedItems.filter(i => !(i.id === item.id && i.type === item.type)));
    } else {
      setSelectedItems([...selectedItems, item]);
    }
  };

  const handleAddToStatus = async () => {
    if (selectedItems.length === 0 || !user) return;
    
    setAddingItems(true);
    setError(null);
    
    try {
      // Add each selected item to the reading status
      for (const item of selectedItems) {
        await onAddToStatus(item, selectedStatus);
      }
      
      // Close the dialog after adding all items
      onClose();
    } catch (error) {
      console.error('Error adding items to status:', error);
      setError('Failed to add items. Please try again.');
    } finally {
      setAddingItems(false);
    }
  };

  // Filter content based on content type
  const filteredContent = contentFilter === 'all' 
    ? content 
    : content.filter(item => item.type === contentFilter);

  const getContentIcon = (type: string) => {
    switch (type) {
      case 'audiobook':
        return <Headphones className="w-3 h-3" />;
      case 'podcast':
        return <Headphones className="w-3 h-3" />;
      case 'article':
        return <BookOpen className="w-3 h-3" />;
      default:
        return <BookOpen className="w-3 h-3" />;
    }
  };

  const getActionLabel = (type: string) => {
    switch (type) {
      case 'audiobook':
      case 'podcast':
        return 'Listen';
      case 'article':
        return 'Read';
      default:
        return 'Read';
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center"
      onClick={onClose}
    >
      <div 
        className="bg-background rounded-xl shadow-xl w-full max-w-4xl mx-4 max-h-[90vh] flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-xl font-semibold">{title}</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-accent rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Status Selection */}
        <div className="p-4 border-b">
          <div className="space-y-2">
            <label className="text-sm font-medium">Add to:</label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
            >
              {statusOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <p className="text-xs text-muted-foreground">
              {statusOptions.find(opt => opt.value === selectedStatus)?.description}
            </p>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="p-4 border-b">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Search by title or author..."
                className="pl-9 pr-4"
              />
              <button
                onClick={handleSearch}
                className="absolute right-2 top-1/2 -translate-y-1/2 px-2 py-1 text-xs bg-primary/10 text-primary rounded hover:bg-primary/20 transition-colors"
              >
                Search
              </button>
            </div>
            
            {/* Content Type Filter */}
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-muted-foreground" />
              <div className="flex gap-2">
                <button
                  onClick={() => setContentFilter('all')}
                  className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                    contentFilter === 'all'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted hover:bg-primary/10'
                  }`}
                >
                  All
                </button>
                <button
                  onClick={() => setContentFilter('book')}
                  className={`px-3 py-1.5 text-sm rounded-lg transition-colors flex items-center gap-1 ${
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
                  className={`px-3 py-1.5 text-sm rounded-lg transition-colors flex items-center gap-1 ${
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
                  className={`px-3 py-1.5 text-sm rounded-lg transition-colors flex items-center gap-1 ${
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
                  className={`px-3 py-1.5 text-sm rounded-lg transition-colors flex items-center gap-1 ${
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
        </div>

        {/* Error Message */}
        {error && (
          <div className="px-4 py-2 bg-destructive/10 text-destructive flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            <p className="text-sm">{error}</p>
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="aspect-[2/3] bg-muted rounded-lg mb-2" />
                  <div className="h-4 bg-muted rounded w-3/4 mb-1" />
                  <div className="h-3 bg-muted rounded w-1/2" />
                </div>
              ))}
            </div>
          ) : filteredContent.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {filteredContent.map((item) => {
                const isSelected = selectedItems.some(i => i.id === item.id && i.type === item.type);
                return (
                  <div 
                    key={`${item.type}-${item.id}`}
                    onClick={() => toggleItemSelection(item)}
                    className={`cursor-pointer transition-all ${
                      isSelected 
                        ? 'ring-2 ring-primary scale-105' 
                        : 'hover:scale-105'
                    }`}
                  >
                    <div className="aspect-[2/3] rounded-lg overflow-hidden bg-muted relative">
                      <img
                        src={item.cover}
                        alt={item.title}
                        className="w-full h-full object-cover"
                      />
                      {isSelected && (
                        <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                          <Check className="w-4 h-4 text-white" />
                        </div>
                      )}
                      {/* Content type badge */}
                      <div className="absolute top-2 left-2 px-2 py-1 rounded-full bg-background/80 text-xs font-medium flex items-center gap-1">
                        {getContentIcon(item.type)}
                        <span className="capitalize">{item.type}</span>
                      </div>
                      {/* Duration badge for audio content */}
                      {(item.type === 'audiobook' || item.type === 'podcast') && item.duration && (
                        <div className="absolute bottom-2 left-2 px-2 py-1 rounded-full bg-black/60 text-white text-xs flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          <span>{item.duration}</span>
                        </div>
                      )}
                    </div>
                    <h3 className="mt-2 font-medium text-sm line-clamp-2">{item.title}</h3>
                    <div className="flex items-center justify-between text-xs text-muted-foreground mt-1">
                      <span className="line-clamp-1">{item.author}</span>
                      <div className="flex items-center gap-1 shrink-0">
                        <Star className="w-3 h-3 fill-yellow-500 text-yellow-500" />
                        <span>{item.rating}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12">
              <BookOpen className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No content found</h3>
              <p className="text-muted-foreground">
                Try searching with different keywords or changing the content filter
              </p>
            </div>
          )}
        </div>

        {/* Selected Items Count */}
        {selectedItems.length > 0 && (
          <div className="px-4 py-2 bg-primary/10 border-t border-b">
            <p className="text-sm text-primary">
              {selectedItems.length} {selectedItems.length === 1 ? 'item' : 'items'} selected
            </p>
          </div>
        )}

        {/* Footer */}
        <div className="p-4 border-t flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="w-4 h-4" />
            <span>Add to your library</span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm rounded-lg border hover:bg-accent transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleAddToStatus}
              disabled={selectedItems.length === 0 || addingItems}
              className="px-4 py-2 text-sm rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {addingItems ? (
                <>
                  <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  Adding...
                </>
              ) : (
                `Add ${selectedItems.length ? selectedItems.length : ''} to ${statusOptions.find(opt => opt.value === selectedStatus)?.label}`
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}