import React, { useState, useEffect } from 'react';
import { X, Search, BookOpen, Star, Calendar, Check, AlertCircle, Headphones, Filter } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';

interface Book {
  id: string;
  title: string;
  author: string;
  cover: string;
  rating: number;
  year: number;
  type: 'book' | 'audiobook';
}

interface LearningGoalsDialogProps {
  onClose: () => void;
  onAddGoal: (book: Book) => void;
}

export function LearningGoalsDialog({ onClose, onAddGoal }: LearningGoalsDialogProps) {
  const { user, profile } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [books, setBooks] = useState<Book[]>([]);
  const [selectedBooks, setSelectedBooks] = useState<Book[]>([]);
  const [addingBook, setAddingBook] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [contentFilter, setContentFilter] = useState<'all' | 'book' | 'audiobook'>('all');

  // Load books from database and popular books
  useEffect(() => {
    const loadBooks = async () => {
      setLoading(true);
      try {
        // First, try to get all published books from the database
        const { data: dbBooks, error: booksError } = await supabase
          .from('books')
          .select('id, title, description, cover_url, author_id, created_at, status, category')
          .eq('status', 'published')
          .order('created_at', { ascending: false });

        if (booksError) throw booksError;

        // Get all published audiobooks from the database
        const { data: dbAudiobooks, error: audiobooksError } = await supabase
          .from('audiobooks')
          .select('id, title, description, cover_url, author_id, narrator, created_at, status, category')
          .eq('status', 'published')
          .order('created_at', { ascending: false });

        if (audiobooksError) throw audiobooksError;

        console.log(`Found ${dbBooks?.length || 0} books and ${dbAudiobooks?.length || 0} audiobooks in database`);

        // Get author information for each book
        const booksWithAuthors = await Promise.all((dbBooks || []).map(async (book) => {
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
            rating: 4.5, // Default rating
            year: new Date(book.created_at).getFullYear(),
            type: 'book' as const
          };
        }));

        // Get author information for each audiobook
        const audiobooksWithAuthors = await Promise.all((dbAudiobooks || []).map(async (audiobook) => {
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
            rating: 4.5, // Default rating
            year: new Date(audiobook.created_at).getFullYear(),
            type: 'audiobook' as const
          };
        }));

        // Combine books and audiobooks
        const allContent = [...booksWithAuthors, ...audiobooksWithAuthors];

        // If we have content from the database, use it
        if (allContent.length > 0) {
          setBooks(allContent);
          console.log(`Displaying ${allContent.length} items from database`);
        } else {
          // Otherwise, use popular books
          const popularBooks: Book[] = [
            {
              id: 'pop-1',
              title: 'Atomic Habits',
              author: 'James Clear',
              cover: 'https://source.unsplash.com/random/400x600?book&sig=1',
              rating: 4.8,
              year: 2018,
              type: 'book'
            },
            {
              id: 'pop-2',
              title: 'Deep Work',
              author: 'Cal Newport',
              cover: 'https://source.unsplash.com/random/400x600?book&sig=2',
              rating: 4.6,
              year: 2016,
              type: 'book'
            },
            {
              id: 'pop-3',
              title: 'Thinking, Fast and Slow',
              author: 'Daniel Kahneman',
              cover: 'https://source.unsplash.com/random/400x600?book&sig=3',
              rating: 4.5,
              year: 2011,
              type: 'book'
            },
            {
              id: 'pop-4',
              title: 'Sapiens: A Brief History of Humankind',
              author: 'Yuval Noah Harari',
              cover: 'https://source.unsplash.com/random/400x600?book&sig=4',
              rating: 4.7,
              year: 2014,
              type: 'book'
            },
            {
              id: 'pop-5',
              title: 'The Psychology of Money',
              author: 'Morgan Housel',
              cover: 'https://source.unsplash.com/random/400x600?book&sig=5',
              rating: 4.6,
              year: 2020,
              type: 'book'
            },
            {
              id: 'pop-6',
              title: 'Educated',
              author: 'Tara Westover',
              cover: 'https://source.unsplash.com/random/400x600?book&sig=6',
              rating: 4.7,
              year: 2018,
              type: 'book'
            },
            {
              id: 'pop-7',
              title: 'The Power of Habit',
              author: 'Charles Duhigg',
              cover: 'https://source.unsplash.com/random/400x600?book&sig=7',
              rating: 4.5,
              year: 2012,
              type: 'book'
            },
            {
              id: 'pop-8',
              title: 'Mindset: The New Psychology of Success',
              author: 'Carol S. Dweck',
              cover: 'https://source.unsplash.com/random/400x600?book&sig=8',
              rating: 4.6,
              year: 2006,
              type: 'book'
            },
            {
              id: 'pop-9',
              title: 'Outliers',
              author: 'Malcolm Gladwell',
              cover: 'https://source.unsplash.com/random/400x600?book&sig=9',
              rating: 4.7,
              year: 2008,
              type: 'book'
            },
            {
              id: 'pop-10',
              title: 'The Lean Startup',
              author: 'Eric Ries',
              cover: 'https://source.unsplash.com/random/400x600?book&sig=10',
              rating: 4.5,
              year: 2011,
              type: 'book'
            },
            // Add some audiobooks too
            {
              id: 'pop-a1',
              title: 'Atomic Habits (Audiobook)',
              author: 'James Clear',
              cover: 'https://source.unsplash.com/random/400x600?audiobook&sig=11',
              rating: 4.8,
              year: 2018,
              type: 'audiobook'
            },
            {
              id: 'pop-a2',
              title: 'Deep Work (Audiobook)',
              author: 'Cal Newport',
              cover: 'https://source.unsplash.com/random/400x600?audiobook&sig=12',
              rating: 4.6,
              year: 2016,
              type: 'audiobook'
            }
          ];

          setBooks(popularBooks);
          console.log(`Using ${popularBooks.length} popular books as fallback`);
        }
      } catch (error) {
        console.error('Error loading books:', error);
        // Fallback to popular books if database query fails
        const popularBooks = [
          {
            id: 'pop-1',
            title: 'Atomic Habits',
            author: 'James Clear',
            cover: 'https://source.unsplash.com/random/400x600?book&sig=1',
            rating: 4.8,
            year: 2018,
            type: 'book' as const
          },
          {
            id: 'pop-2',
            title: 'Deep Work',
            author: 'Cal Newport',
            cover: 'https://source.unsplash.com/random/400x600?book&sig=2',
            rating: 4.6,
            year: 2016,
            type: 'book' as const
          },
          {
            id: 'pop-3',
            title: 'Thinking, Fast and Slow',
            author: 'Daniel Kahneman',
            cover: 'https://source.unsplash.com/random/400x600?book&sig=3',
            rating: 4.5,
            year: 2011,
            type: 'book' as const
          },
          {
            id: 'pop-4',
            title: 'Sapiens: A Brief History of Humankind',
            author: 'Yuval Noah Harari',
            cover: 'https://source.unsplash.com/random/400x600?book&sig=4',
            rating: 4.7,
            year: 2014,
            type: 'book' as const
          },
          {
            id: 'pop-5',
            title: 'The Psychology of Money',
            author: 'Morgan Housel',
            cover: 'https://source.unsplash.com/random/400x600?book&sig=5',
            rating: 4.6,
            year: 2020,
            type: 'book' as const
          },
          {
            id: 'pop-6',
            title: 'Educated',
            author: 'Tara Westover',
            cover: 'https://source.unsplash.com/random/400x600?book&sig=6',
            rating: 4.7,
            year: 2018,
            type: 'book' as const
          },
          // Add some audiobooks too
          {
            id: 'pop-a1',
            title: 'Atomic Habits (Audiobook)',
            author: 'James Clear',
            cover: 'https://source.unsplash.com/random/400x600?audiobook&sig=11',
            rating: 4.8,
            year: 2018,
            type: 'audiobook' as const
          },
          {
            id: 'pop-a2',
            title: 'Deep Work (Audiobook)',
            author: 'Cal Newport',
            cover: 'https://source.unsplash.com/random/400x600?audiobook&sig=12',
            rating: 4.6,
            year: 2016,
            type: 'audiobook' as const
          }
        ];
        setBooks(popularBooks);
        console.log(`Using ${popularBooks.length} popular books due to error`);
      } finally {
        setLoading(false);
      }
    };

    loadBooks();
  }, []);

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      // Reload initial books
      const loadBooks = async () => {
        setLoading(true);
        try {
          // Get books
          const { data: dbBooks, error: booksError } = await supabase
            .from('books')
            .select('id, title, description, cover_url, author_id, created_at, status, category')
            .eq('status', 'published')
            .order('created_at', { ascending: false });
  
          if (booksError) throw booksError;
  
          // Get audiobooks
          const { data: dbAudiobooks, error: audiobooksError } = await supabase
            .from('audiobooks')
            .select('id, title, description, cover_url, author_id, narrator, created_at, status, category')
            .eq('status', 'published')
            .order('created_at', { ascending: false });
  
          if (audiobooksError) throw audiobooksError;
  
          // Process books
          const booksWithAuthors = await Promise.all((dbBooks || []).map(async (book) => {
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
              type: 'book' as const
            };
          }));
  
          // Process audiobooks
          const audiobooksWithAuthors = await Promise.all((dbAudiobooks || []).map(async (audiobook) => {
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
              type: 'audiobook' as const
            };
          }));
  
          // Combine and filter by content type
          let allContent = [...booksWithAuthors, ...audiobooksWithAuthors];
          if (contentFilter !== 'all') {
            allContent = allContent.filter(item => item.type === contentFilter);
          }
  
          setBooks(allContent);
        } catch (error) {
          console.error('Error loading books:', error);
        } finally {
          setLoading(false);
        }
      };
  
      loadBooks();
      return;
    }

    setLoading(true);
    try {
      // Search for books in the database
      const { data: bookSearchResults, error: bookSearchError } = await supabase
        .from('books')
        .select('id, title, description, cover_url, author_id, created_at, status, category')
        .eq('status', 'published')
        .or(`title.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%`)
        .order('created_at', { ascending: false });

      if (bookSearchError) throw bookSearchError;

      // Search for audiobooks in the database
      const { data: audiobookSearchResults, error: audiobookSearchError } = await supabase
        .from('audiobooks')
        .select('id, title, description, cover_url, author_id, narrator, created_at, status, category')
        .eq('status', 'published')
        .or(`title.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%`)
        .order('created_at', { ascending: false });

      if (audiobookSearchError) throw audiobookSearchError;

      // Get author information for each book
      const booksWithAuthors = await Promise.all((bookSearchResults || []).map(async (book) => {
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
          rating: 4.5, // Default rating
          year: new Date(book.created_at).getFullYear(),
          type: 'book' as const
        };
      }));

      // Get author information for each audiobook
      const audiobooksWithAuthors = await Promise.all((audiobookSearchResults || []).map(async (audiobook) => {
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
          rating: 4.5, // Default rating
          year: new Date(audiobook.created_at).getFullYear(),
          type: 'audiobook' as const
        };
      }));

      // Combine and filter by content type
      let searchResults = [...booksWithAuthors, ...audiobooksWithAuthors];
      if (contentFilter !== 'all') {
        searchResults = searchResults.filter(item => item.type === contentFilter);
      }

      setBooks(searchResults);
    } catch (error) {
      console.error('Error searching books:', error);
      setError('Failed to search books. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const toggleBookSelection = (book: Book) => {
    if (selectedBooks.some(b => b.id === book.id)) {
      setSelectedBooks(selectedBooks.filter(b => b.id !== book.id));
    } else {
      setSelectedBooks([...selectedBooks, book]);
    }
  };

  const handleAddGoals = async () => {
    if (selectedBooks.length === 0 || !user) return;
    
    setAddingBook(true);
    setError(null);
    
    try {
      // Process each selected book
      for (const selectedBook of selectedBooks) {
        // Check if the book ID starts with 'pop-' (popular book that's not in the database yet)
        if (selectedBook.id.startsWith('pop-')) {
          if (selectedBook.type === 'book') {
            // Create a new book entry in the database
            const { data: newBook, error: createError } = await supabase
              .from('books')
              .insert({
                title: selectedBook.title,
                description: `Book by ${selectedBook.author}, published in ${selectedBook.year}`,
                cover_url: selectedBook.cover,
                author_id: profile?.id || user.id,
                status: 'published',
                category: 'education',
                is_full_book: true
              })
              .select('id')
              .single();
              
            if (createError) throw createError;
            
            // Add to bookmarks with category=education to mark it as a learning goal
            const { error: bookmarkError } = await supabase
              .from('bookmarks')
              .insert({
                user_id: user.id,
                content_id: newBook.id,
                content_type: 'book'
              });
              
            if (bookmarkError) throw bookmarkError;
            
            // Call the onAddGoal callback with the book and its new ID
            onAddGoal({
              ...selectedBook,
              id: newBook.id
            });
          } else if (selectedBook.type === 'audiobook') {
            // Create a new audiobook entry in the database
            const { data: newAudiobook, error: createError } = await supabase
              .from('audiobooks')
              .insert({
                title: selectedBook.title,
                description: `Audiobook by ${selectedBook.author}, published in ${selectedBook.year}`,
                cover_url: selectedBook.cover,
                author_id: profile?.id || user.id,
                narrator: 'Unknown Narrator', // Default narrator
                status: 'published',
                category: 'education',
                is_full_book: true
              })
              .select('id')
              .single();
              
            if (createError) throw createError;
            
            // Add to bookmarks with category=education to mark it as a learning goal
            const { error: bookmarkError } = await supabase
              .from('bookmarks')
              .insert({
                user_id: user.id,
                content_id: newAudiobook.id,
                content_type: 'audiobook'
              });
              
            if (bookmarkError) throw bookmarkError;
            
            // Call the onAddGoal callback with the book and its new ID
            onAddGoal({
              ...selectedBook,
              id: newAudiobook.id
            });
          }
        } else {
          // Book already exists in database
          
          // Update the book/audiobook to have category=education
          if (selectedBook.type === 'book') {
            const { error: updateError } = await supabase
              .from('books')
              .update({ category: 'education' })
              .eq('id', selectedBook.id);
              
            if (updateError) {
              console.warn('Could not update book category:', updateError);
            }
          } else if (selectedBook.type === 'audiobook') {
            const { error: updateError } = await supabase
              .from('audiobooks')
              .update({ category: 'education' })
              .eq('id', selectedBook.id);
              
            if (updateError) {
              console.warn('Could not update audiobook category:', updateError);
            }
          }
          
          // Add to bookmarks
          const { error: bookmarkError } = await supabase
            .from('bookmarks')
            .insert({
              user_id: user.id,
              content_id: selectedBook.id,
              content_type: selectedBook.type
            });
            
          if (bookmarkError) throw bookmarkError;
          
          // Call the onAddGoal callback with the selected book
          onAddGoal(selectedBook);
        }
      }
      
      // Close the dialog after adding all books
      onClose();
    } catch (error) {
      console.error('Error adding books to learning goals:', error);
      setError('Failed to add books to learning goals. Please try again.');
    } finally {
      setAddingBook(false);
    }
  };

  // Filter books based on content type
  const filteredBooks = contentFilter === 'all' 
    ? books 
    : books.filter(book => book.type === contentFilter);

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
          <h2 className="text-xl font-semibold">Add to Learning Goals</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-accent rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
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
                placeholder="Search for books by title or author..."
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
          ) : filteredBooks.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {filteredBooks.map((book) => {
                const isSelected = selectedBooks.some(b => b.id === book.id);
                return (
                  <div 
                    key={book.id}
                    onClick={() => toggleBookSelection(book)}
                    className={`cursor-pointer transition-all ${
                      isSelected 
                        ? 'ring-2 ring-primary scale-105' 
                        : 'hover:scale-105'
                    }`}
                  >
                    <div className="aspect-[2/3] rounded-lg overflow-hidden bg-muted relative">
                      <img
                        src={book.cover}
                        alt={book.title}
                        className="w-full h-full object-cover"
                      />
                      {isSelected && (
                        <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                          <Check className="w-4 h-4 text-white" />
                        </div>
                      )}
                      {/* Content type badge */}
                      <div className="absolute top-2 left-2 px-2 py-1 rounded-full bg-background/80 text-xs font-medium flex items-center gap-1">
                        {book.type === 'audiobook' ? (
                          <>
                            <Headphones className="w-3 h-3" />
                            <span>Audiobook</span>
                          </>
                        ) : (
                          <>
                            <BookOpen className="w-3 h-3" />
                            <span>Book</span>
                          </>
                        )}
                      </div>
                    </div>
                    <h3 className="mt-2 font-medium text-sm line-clamp-1">{book.title}</h3>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span className="line-clamp-1">{book.author}</span>
                      <div className="flex items-center gap-1 shrink-0">
                        <Star className="w-3 h-3 fill-yellow-500 text-yellow-500" />
                        <span>{book.rating}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12">
              <BookOpen className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No books found</h3>
              <p className="text-muted-foreground">
                Try searching with different keywords or changing the content filter
              </p>
            </div>
          )}
        </div>

        {/* Selected Books Count */}
        {selectedBooks.length > 0 && (
          <div className="px-4 py-2 bg-primary/10 border-t border-b">
            <p className="text-sm text-primary">
              {selectedBooks.length} {selectedBooks.length === 1 ? 'item' : 'items'} selected
            </p>
          </div>
        )}

        {/* Footer */}
        <div className="p-4 border-t flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="w-4 h-4" />
            <span>Set as 2025 learning goals</span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm rounded-lg border hover:bg-accent transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleAddGoals}
              disabled={selectedBooks.length === 0 || addingBook}
              className="px-4 py-2 text-sm rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {addingBook ? (
                <>
                  <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  Adding...
                </>
              ) : (
                `Add ${selectedBooks.length ? selectedBooks.length : ''} to Learning Goals`
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}