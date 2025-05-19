import React, { useRef, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Category } from '@/lib/types';

interface CategoriesScrollProps {
  categories: Category[];
  selectedCategory: string;
  onSelectCategory: (category: string) => void;
  collapsed?: boolean;
}

export function CategoriesScroll({ 
  categories, 
  selectedCategory, 
  onSelectCategory,
  collapsed
}: CategoriesScrollProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(true);

  const scroll = (direction: 'left' | 'right') => {
    if (!scrollRef.current) return;
    
    const scrollAmount = 200;
    const newScrollLeft = direction === 'left' 
      ? scrollRef.current.scrollLeft - scrollAmount
      : scrollRef.current.scrollLeft + scrollAmount;
    
    scrollRef.current.scrollTo({
      left: newScrollLeft,
      behavior: 'smooth'
    });
  };

  const handleScroll = () => {
    if (!scrollRef.current) return;
    
    setShowLeftArrow(scrollRef.current.scrollLeft > 0);
    setShowRightArrow(
      scrollRef.current.scrollLeft < 
      scrollRef.current.scrollWidth - scrollRef.current.clientWidth
    );
  };

  return (
    <div 
      className="fixed top-14 right-0 h-14 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b z-40 transition-all duration-300" 
      style={{ 
        left: collapsed ? '64px' : '256px'
      }}
    >
      <div className="relative flex items-center h-full">
        {showLeftArrow && (
          <button
            onClick={() => scroll('left')}
            className="absolute left-0 z-10 h-full px-2 flex items-center justify-center bg-gradient-to-r from-background via-background to-transparent"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
        )}
        
        <div
          ref={scrollRef}
          onScroll={handleScroll}
          className="flex gap-2 overflow-x-auto scrollbar-hide py-2 px-4 w-full"
        >
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => onSelectCategory(category.slug)}
              className={`whitespace-nowrap px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                selectedCategory === category.slug
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted hover:bg-primary/10'
              }`}
            >
              {category.name}
            </button>
          ))}
        </div>

        {showRightArrow && (
          <button
            onClick={() => scroll('right')}
            className="absolute right-0 z-10 h-full px-2 flex items-center justify-center bg-gradient-to-l from-background via-background to-transparent"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        )}
      </div>
    </div>
  );
}