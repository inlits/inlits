import React, { useState, useEffect } from 'react';
import { 
  Clock, 
  Target, 
  CheckCircle, 
  Plus,
  BookOpen,
  AlertCircle
} from 'lucide-react';
import { LibraryShelf } from '@/components/library/library-shelf';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import { useNavigate } from 'react-router-dom';
import { LearningGoalsDialog } from '@/components/library/learning-goals-dialog';
import { CreateShelfDialog } from '@/components/library/create-shelf-dialog';
import type { ContentItem } from '@/lib/types';

interface CustomShelf {
  id: string;
  name: string;
  description?: string;
  items: ContentItem[];
}

export function LibraryPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [customShelves, setCustomShelves] = useState<CustomShelf[]>([]);
  const [showLearningGoalsDialog, setShowLearningGoalsDialog] = useState(false);
  const [showCreateShelfDialog, setShowCreateShelfDialog] = useState(false);
  const [library, setLibrary] = useState<{
    savedForLater: ContentItem[];
    learningGoals: ContentItem[];
    completed: ContentItem[];
  }>({
    savedForLater: [],
    learningGoals: [],
    completed: []
  });

  const loadLibrary = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Get all bookmarks
      const { data: bookmarks, error: bookmarksError } = await supabase
        .from('bookmarks')
        .select('content_id, content_type, created_at')
        .eq('user_id', user.id);

      if (bookmarksError) throw bookmarksError;

      console.log(`Found ${bookmarks?.length || 0} bookmarks`);

      // Get content details for each bookmark
      const contentItems: ContentItem[] = [];
      const processedItems = new Set<string>(); // Track processed items to avoid duplicates

      // Process bookmarks in batches to avoid too many parallel requests
      const bookmarkBatches = chunk(bookmarks || [], 10);
      
      for (const batch of bookmarkBatches) {
        const batchPromises = batch.map(async (bookmark) => {
          try {
            // Create a unique key for this item to avoid duplicates
            const itemKey = `${bookmark.content_type}-${bookmark.content_id}`;
            
            // Skip if we've already processed this item
            if (processedItems.has(itemKey)) {
              return;
            }
            
            processedItems.add(itemKey);
            
            let contentData;
            let authorData;
            
            // Get content details based on type
            if (bookmark.content_type === 'book') {
              const { data: book } = await supabase
                .from('books')
                .select('title, description, cover_url, author_id, category, view_count, created_at')
                .eq('id', bookmark.content_id)
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
            else if (bookmark.content_type === 'audiobook') {
              const { data: audiobook } = await supabase
                .from('audiobooks')
                .select('title, description, cover_url, author_id, category, view_count, created_at')
                .eq('id', bookmark.content_id)
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
            else if (bookmark.content_type === 'article') {
              const { data: article } = await supabase
                .from('articles')
                .select('title, excerpt, cover_url, author_id, category, view_count, created_at')
                .eq('id', bookmark.content_id)
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
            else if (bookmark.content_type === 'podcast') {
              const { data: podcast } = await supabase
                .from('podcast_episodes')
                .select('title, description, cover_url, author_id, category, view_count, created_at, duration')
                .eq('id', bookmark.content_id)
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
              contentItems.push({
                id: bookmark.content_id,
                type: bookmark.content_type as any,
                title: contentData.title,
                thumbnail: contentData.cover_url || `https://source.unsplash.com/random/800x600?${bookmark.content_type}&sig=${bookmark.content_id}`,
                duration: contentData.duration || '5 min read',
                views: contentData.view_count || 0,
                createdAt: contentData.created_at || bookmark.created_at,
                creator: {
                  id: authorData.id,
                  name: authorData.name || authorData.username || 'Unknown Author',
                  avatar: authorData.avatar_url || `https://source.unsplash.com/random/100x100?face&sig=${authorData.id}`,
                  followers: 0
                },
                category: contentData.category,
                bookmarked: true
              });
            }
          } catch (error) {
            console.error(`Error processing bookmark ${bookmark.content_id}:`, error);
          }
        });
        
        await Promise.all(batchPromises);
      }

      console.log(`Processed ${contentItems.length} content items`);

      // Group content into shelves
      const savedForLater = contentItems.filter(item => item.category !== 'education');
      const learningGoals = contentItems.filter(item => item.category === 'education');
      
      // For demo purposes, randomly assign some items as completed
      // In a real app, this would come from the database
      const completed = contentItems.filter(item => 
        (item.type === 'ebook' || item.type === 'audiobook') && 
        Math.random() > 0.7 // Randomly mark some as completed for demo
      );

      setLibrary({
        savedForLater,
        learningGoals,
        completed
      });

      // Load custom shelves
      const { data: shelves, error: shelvesError } = await supabase
        .from('custom_shelves')
        .select(`
          id,
          name,
          description,
          shelf_items (
            content_id,
            content_type
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: true });

      if (shelvesError) throw shelvesError;

      // Map shelf items to content
      const customShelvesWithItems = (shelves || []).map(shelf => ({
        id: shelf.id,
        name: shelf.name,
        description: shelf.description,
        items: contentItems.filter(item => 
          shelf.shelf_items?.some(si => 
            si.content_id === item.id && si.content_type === item.type
          )
        )
      }));

      setCustomShelves(customShelvesWithItems);
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

  const handleAddToSavedForLater = () => {
    // Redirect to home page to explore content
    navigate('/?shelf=savedForLater');
  };

  const handleAddToLearningGoals = () => {
    // Open learning goals dialog
    setShowLearningGoalsDialog(true);
  };

  const handleAddToShelf = async (shelfId: string) => {
    // Redirect to home page with shelf parameter
    navigate(`/?shelf=${shelfId}`);
  };

  const handleAddBookToLearningGoals = async (book: any) => {
    if (!user) return;

    try {
      // Add the book to bookmarks with category=education to mark it as a learning goal
      const { error: bookmarkError } = await supabase
        .from('bookmarks')
        .insert({
          user_id: user.id,
          content_id: book.id,
          content_type: book.type
        });
        
      if (bookmarkError) throw bookmarkError;

      // If the book is from the database, update its category to 'education'
      if (!book.id.startsWith('pop-')) {
        const table = book.type === 'audiobook' ? 'audiobooks' : 'books';
        const { error: updateError } = await supabase
          .from(table)
          .update({ category: 'education' })
          .eq('id', book.id);
          
        if (updateError) {
          console.warn(`Could not update ${table} category:`, updateError);
        }
      }

      // Create a mock content item for the book
      const newBook: ContentItem = {
        id: book.id,
        type: book.type === 'audiobook' ? 'audiobook' : 'ebook',
        title: book.title,
        thumbnail: book.cover,
        duration: 'Learning Goal',
        views: 0,
        createdAt: new Date().toISOString(),
        creator: {
          id: 'author',
          name: book.author,
          avatar: `https://source.unsplash.com/random/100x100?author&sig=${book.id}`
        },
        category: 'education',
        bookmarked: true
      };

      // Add to learning goals shelf in UI
      setLibrary(prev => ({
        ...prev,
        learningGoals: [newBook, ...prev.learningGoals]
      }));

      // Refresh the library to show the new book
      loadLibrary();
    } catch (error) {
      console.error('Error adding book to learning goals:', error);
    }
  };

  const handleCreateShelf = async (name: string, description?: string) => {
    if (!user) return;

    try {
      // Create new shelf in database
      const { data, error } = await supabase
        .from('custom_shelves')
        .insert({
          user_id: user.id,
          name,
          description
        })
        .select()
        .single();

      if (error) throw error;

      // Add new shelf to state
      setCustomShelves(prev => [
        ...prev,
        {
          id: data.id,
          name: data.name,
          description: data.description,
          items: []
        }
      ]);

      setShowCreateShelfDialog(false);
    } catch (error) {
      console.error('Error creating shelf:', error);
    }
  };

  const handleRemoveShelf = (shelfId: string) => async () => {
    if (!user) return;

    try {
      // Delete the shelf from the database
      const { error } = await supabase
        .from('custom_shelves')
        .delete()
        .eq('id', shelfId)
        .eq('user_id', user.id);

      if (error) throw error;

      // Remove the shelf from state
      setCustomShelves(prev => prev.filter(shelf => shelf.id !== shelfId));
    } catch (error) {
      console.error('Error removing shelf:', error);
      throw error;
    }
  };

  // Handle removing an item from a shelf
  const handleRemoveItem = async (shelfType: 'savedForLater' | 'learningGoals' | 'completed' | string, item: ContentItem) => {
    if (!user) return;
    
    try {
      // Update the local state immediately for better UX
      if (shelfType === 'savedForLater') {
        setLibrary(prev => ({
          ...prev,
          savedForLater: prev.savedForLater.filter(i => !(i.id === item.id && i.type === item.type))
        }));
      } else if (shelfType === 'learningGoals') {
        setLibrary(prev => ({
          ...prev,
          learningGoals: prev.learningGoals.filter(i => !(i.id === item.id && i.type === item.type))
        }));
      } else if (shelfType === 'completed') {
        setLibrary(prev => ({
          ...prev,
          completed: prev.completed.filter(i => !(i.id === item.id && i.type === item.type))
        }));
      } else {
        // For custom shelves
        setCustomShelves(prev => 
          prev.map(shelf => 
            shelf.id === shelfType
              ? { ...shelf, items: shelf.items.filter(i => !(i.id === item.id && i.type === item.type)) }
              : shelf
          )
        );
      }

      // Determine which table to delete from based on the shelf type
      if (shelfType === 'savedForLater' || shelfType === 'learningGoals') {
        // Delete from bookmarks
        const { error: deleteError } = await supabase
          .from('bookmarks')
          .delete()
          .eq('user_id', user.id)
          .eq('content_id', item.id)
          .eq('content_type', item.type);
          
        if (deleteError) throw deleteError;
      } else if (shelfType === 'completed') {
        // For completed items, we would need to update their status
        // This is a placeholder for actual implementation
        console.log("Removing from completed shelf is not implemented yet");
      } else {
        // For custom shelves, delete from shelf_items
        const { error: deleteError } = await supabase
          .from('shelf_items')
          .delete()
          .eq('content_id', item.id)
          .eq('content_type', item.type)
          .eq('shelf_id', shelfType);
            
        if (deleteError) throw deleteError;
      }
    } catch (error) {
      console.error('Error removing item:', error);
      // Revert the state change if there was an error
      loadLibrary();
    }
  };

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

  return (
    <div className="space-y-12">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">My Library</h1>
          <p className="text-muted-foreground">
            Your personal collection of learning resources
          </p>
        </div>
        <button
          onClick={() => setShowCreateShelfDialog(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Create Shelf</span>
        </button>
      </div>

      {/* Default Shelves */}
      <div className="grid grid-cols-1 gap-12">
        <LibraryShelf
          title="Saved for Later"
          description="Articles, e-books, and podcasts you've saved from our platform"
          items={library.savedForLater}
          icon={<Clock className="w-6 h-6 text-primary" />}
          loading={loading}
          onAddItem={handleAddToSavedForLater}
          onRemoveItem={(item) => handleRemoveItem('savedForLater', item)}
        />

        <LibraryShelf
          title="2025 Learning Goals"
          description="Content aligned with your learning objectives for 2025"
          items={library.learningGoals}
          icon={<Target className="w-6 h-6 text-primary" />}
          loading={loading}
          onAddItem={handleAddToLearningGoals}
          onRemoveItem={(item) => handleRemoveItem('learningGoals', item)}
        />

        <LibraryShelf
          title="Completed"
          description="Content you've finished"
          items={library.completed}
          icon={<CheckCircle className="w-6 h-6 text-primary" />}
          canAddItems={false}
          loading={loading}
          onRemoveItem={(item) => handleRemoveItem('completed', item)}
        />

        {/* Custom Shelves */}
        {customShelves.map(shelf => (
          <LibraryShelf
            key={shelf.id}
            title={shelf.name}
            description={shelf.description}
            items={shelf.items}
            icon={<BookOpen className="w-6 h-6 text-primary" />}
            onAddItem={() => handleAddToShelf(shelf.id)}
            loading={loading}
            isCustomShelf={true}
            onRemoveShelf={handleRemoveShelf(shelf.id)}
            shelfId={shelf.id}
            onRemoveItem={(item) => handleRemoveItem(shelf.id, item)}
          />
        ))}
      </div>

      {/* Learning Goals Dialog */}
      {showLearningGoalsDialog && (
        <LearningGoalsDialog 
          onClose={() => setShowLearningGoalsDialog(false)}
          onAddGoal={handleAddBookToLearningGoals}
        />
      )}

      {/* Create Shelf Dialog */}
      {showCreateShelfDialog && (
        <CreateShelfDialog
          onClose={() => setShowCreateShelfDialog(false)}
          onCreateShelf={handleCreateShelf}
        />
      )}
    </div>
  );
}