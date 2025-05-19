import React, { useRef, useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Plus, AlertCircle, Trash2 } from 'lucide-react';
import { LibraryItem } from './library-item';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import type { ContentItem } from '@/lib/types';

interface LibraryShelfProps {
  title: string;
  description?: string;
  items: ContentItem[];
  icon: React.ReactNode;
  canAddItems?: boolean;
  onAddItem?: () => void;
  highlight?: string;
  loading?: boolean;
  isCustomShelf?: boolean;
  onRemoveShelf?: () => Promise<void>;
  shelfId?: string;
  onRemoveItem?: (item: ContentItem) => void;
}

export function LibraryShelf({ 
  title, 
  description, 
  items, 
  icon,
  canAddItems = true,
  onAddItem,
  highlight,
  loading = false,
  isCustomShelf = false,
  onRemoveShelf,
  shelfId,
  onRemoveItem
}: LibraryShelfProps) {
  const { user } = useAuth();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isRemovingShelf, setIsRemovingShelf] = useState(false);
  
  // Remove duplicates from items array based on id and type
  const uniqueItems = items.filter((item, index, self) => 
    index === self.findIndex(t => t.id === item.id && t.type === item.type)
  );

  const checkArrows = () => {
    if (!scrollRef.current) return;
    
    setShowLeftArrow(scrollRef.current.scrollLeft > 0);
    setShowRightArrow(
      scrollRef.current.scrollLeft < 
      scrollRef.current.scrollWidth - scrollRef.current.clientWidth
    );
  };

  useEffect(() => {
    checkArrows();
    window.addEventListener('resize', checkArrows);
    return () => window.removeEventListener('resize', checkArrows);
  }, [uniqueItems]);

  const scroll = (direction: 'left' | 'right') => {
    if (!scrollRef.current) return;
    
    const scrollAmount = 400;
    const newScrollLeft = direction === 'left' 
      ? scrollRef.current.scrollLeft - scrollAmount
      : scrollRef.current.scrollLeft + scrollAmount;
    
    scrollRef.current.scrollTo({
      left: newScrollLeft,
      behavior: 'smooth'
    });
  };

  const handleRemoveItem = async (item: ContentItem) => {
    if (!user) return;

    try {
      setError(null);
      
      // Determine which table to delete from based on the shelf title
      if (title === "Saved for Later" || title === "2025 Learning Goals") {
        // Delete from bookmarks
        const { error: deleteError } = await supabase
          .from('bookmarks')
          .delete()
          .eq('user_id', user.id)
          .eq('content_id', item.id)
          .eq('content_type', item.type);
          
        if (deleteError) throw deleteError;
      } else if (title === "Completed") {
        // For completed items, we would need to update their status
        // This is a placeholder for actual implementation
        console.log("Removing from completed shelf is not implemented yet");
      } else if (isCustomShelf && shelfId) {
        // For custom shelves, delete from shelf_items
        const { error: deleteError } = await supabase
          .from('shelf_items')
          .delete()
          .eq('content_id', item.id)
          .eq('content_type', item.type)
          .eq('shelf_id', shelfId);
            
        if (deleteError) throw deleteError;
      }

      // Call the parent's onRemoveItem function to update the UI immediately
      if (onRemoveItem) {
        onRemoveItem(item);
      }
    } catch (error) {
      console.error('Error removing item:', error);
      setError('Failed to remove item from shelf');
      throw error; // Re-throw to be handled by the component
    }
  };

  const handleRemoveShelf = async () => {
    if (!user || !isCustomShelf || !onRemoveShelf) return;

    try {
      setIsRemovingShelf(true);
      setError(null);
      await onRemoveShelf();
    } catch (error) {
      console.error('Error removing shelf:', error);
      setError('Failed to remove shelf');
    } finally {
      setIsRemovingShelf(false);
    }
  };

  return (
    <div className="relative">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div className="flex items-start gap-3">
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
            {icon}
          </div>
          <div>
            <h2 className="text-xl font-semibold">{title}</h2>
            {description && (
              <p className="text-sm text-muted-foreground">{description}</p>
            )}
            {highlight && (
              <p className="mt-1 text-sm text-primary font-medium">{highlight}</p>
            )}
            {error && (
              <p className="mt-1 text-sm text-destructive flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                {error}
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isCustomShelf && onRemoveShelf && (
            <button
              onClick={handleRemoveShelf}
              disabled={isRemovingShelf}
              className="px-3 py-1.5 rounded-lg text-destructive hover:bg-destructive/10 transition-colors flex items-center gap-1.5 text-sm font-medium"
            >
              {isRemovingShelf ? (
                <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
              ) : (
                <Trash2 className="w-4 h-4" />
              )}
              Remove Shelf
            </button>
          )}
          {canAddItems && onAddItem && (
            <button
              onClick={onAddItem}
              className="px-3 py-1.5 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors flex items-center gap-1.5 text-sm font-medium"
            >
              <Plus className="w-4 h-4" />
              Add to Shelf
            </button>
          )}
        </div>
      </div>
      
      {/* Content */}
      <div className="relative group">
        {showLeftArrow && (
          <button
            onClick={() => scroll('left')}
            className="absolute -left-4 top-1/2 -translate-y-1/2 z-10 w-8 h-8 flex items-center justify-center rounded-full bg-background shadow-lg border opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
        )}

        <div
          ref={scrollRef}
          onScroll={checkArrows}
          className="flex gap-6 overflow-x-auto pb-4 scrollbar-hide"
        >
          {loading ? (
            // Loading skeletons
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex-shrink-0 w-[200px] animate-pulse">
                <div className="aspect-[2/3] bg-muted rounded-lg mb-3" />
                <div className="space-y-2">
                  <div className="h-4 bg-muted rounded w-3/4" />
                  <div className="h-3 bg-muted rounded w-1/2" />
                </div>
              </div>
            ))
          ) : uniqueItems.length > 0 ? (
            uniqueItems.map((item) => (
              <LibraryItem 
                key={`${item.type}-${item.id}`} 
                item={item} 
                onRemove={handleRemoveItem}
                progress={
                  // Generate a deterministic progress value based on the item ID
                  // This is just for demonstration - in a real app, you'd store this in the database
                  parseInt(item.id.substring(0, 8), 16) % 101 // 0-100 range
                }
              />
            ))
          ) : (
            <div className="flex-shrink-0 w-[200px] h-[300px] rounded-lg border-2 border-dashed border-muted flex items-center justify-center">
              <p className="text-sm text-muted-foreground text-center px-4">
                No items in this shelf yet
              </p>
            </div>
          )}
        </div>

        {showRightArrow && (
          <button
            onClick={() => scroll('right')}
            className="absolute -right-4 top-1/2 -translate-y-1/2 z-10 w-8 h-8 flex items-center justify-center rounded-full bg-background shadow-lg border opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        )}
      </div>
    </div>
  );
}