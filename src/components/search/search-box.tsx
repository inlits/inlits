import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search as SearchIcon, Loader2, History, TrendingUp, User, X } from 'lucide-react';
import { searchSuggestions, getRecentSearches, addRecentSearch, removeRecentSearch } from '@/lib/search';
import { useDebounce } from '@/lib/hooks/use-debounce';
import type { SearchSuggestion } from '@/lib/types';

export function SearchBox() {
  const [query, setQuery] = useState('');
  const [showResults, setShowResults] = useState(false);
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const searchRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const debouncedQuery = useDebounce(query, 300);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowResults(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const getSuggestions = async () => {
      if (!debouncedQuery.trim()) {
        // Get trending/recent suggestions for empty query
        try {
          const suggestions = await searchSuggestions('');
          setSuggestions(suggestions);
        } catch (error) {
          console.error('Error getting suggestions:', error);
          setSuggestions([]);
        }
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const suggestions = await searchSuggestions(debouncedQuery);
        setSuggestions(suggestions);
      } catch (error) {
        console.error('Error getting suggestions:', error);
        setSuggestions([]);
      } finally {
        setLoading(false);
      }
    };

    getSuggestions();
  }, [debouncedQuery]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    
    navigate(`/search?q=${encodeURIComponent(query)}`);
    setShowResults(false);
  };

  const handleRemoveFromHistory = async (text: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      const newRecentSearches = removeRecentSearch(text);
      // Update suggestions by filtering out the removed item
      setSuggestions(prev => prev.filter(s => s.type !== 'recent' || s.text !== text));
    } catch (error) {
      console.error('Error removing from history:', error);
    }
  };

  const getSuggestionIcon = (type: SearchSuggestion['type']) => {
    switch (type) {
      case 'recent':
        return <History className="w-4 h-4" />;
      case 'trending':
        return <TrendingUp className="w-4 h-4" />;
      case 'creator':
        return <User className="w-4 h-4" />;
      case 'suggestion':
        return <SearchIcon className="w-4 h-4" />;
      default:
        return null;
    }
  };

  return (
    <div ref={searchRef} className="relative flex-1 max-w-2xl">
      <form onSubmit={handleSearch} className="relative">
        <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setShowResults(true);
          }}
          onFocus={() => setShowResults(true)}
          placeholder="Search content..."
          className="w-full h-10 pl-9 pr-10 border rounded-full bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          // Remove type="search" to prevent browser's default clear button
        />
        {loading ? (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-muted-foreground" />
        ) : query && (
          <button
            type="button"
            onClick={() => {
              setQuery('');
              setSuggestions([]);
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-primary hover:text-primary-foreground transition-colors"
          >
            <span className="sr-only">Clear search</span>
            <X className="w-4 h-4" />
          </button>
        )}
      </form>

      {/* Search Results Dropdown */}
      {showResults && (
        <div className="absolute top-full mt-2 w-full bg-popover border rounded-lg shadow-lg overflow-hidden z-50">
          {suggestions.length > 0 ? (
            <div className="p-2">
              {suggestions.map((suggestion, i) => (
                <button
                  key={i}
                  onClick={() => {
                    if (suggestion.type === 'creator') {
                      navigate(`/creator/${suggestion.username}`);
                    } else {
                      setQuery(suggestion.text);
                      navigate(`/search?q=${encodeURIComponent(suggestion.text)}`);
                    }
                    setShowResults(false);
                  }}
                  className="w-full px-3 py-2 text-sm text-left rounded hover:bg-primary hover:text-primary-foreground transition-colors flex items-center gap-2 group"
                >
                  <span className="text-muted-foreground group-hover:text-primary-foreground transition-colors">
                    {getSuggestionIcon(suggestion.type)}
                  </span>
                  <span className="flex-1">
                    {suggestion.type === 'creator' ? (
                      <div>
                        <div className="font-medium">{suggestion.text}</div>
                        <div className="text-xs text-muted-foreground group-hover:text-primary-foreground/80">
                          @{suggestion.username}
                        </div>
                      </div>
                    ) : (
                      suggestion.text
                    )}
                  </span>
                  {suggestion.category && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-muted group-hover:bg-primary-foreground/20 group-hover:text-primary-foreground transition-colors">
                      {suggestion.category}
                    </span>
                  )}
                  {suggestion.count && (
                    <span className="text-xs text-muted-foreground group-hover:text-primary-foreground/80 transition-colors">
                      {suggestion.count.toLocaleString()} searches
                    </span>
                  )}
                  {suggestion.type === 'recent' && (
                    <button
                      onClick={(e) => handleRemoveFromHistory(suggestion.text, e)}
                      className="p-1 rounded-full opacity-0 group-hover:opacity-100 hover:bg-primary-foreground/20 transition-all"
                    >
                      <X className="w-3 h-3 text-primary-foreground" />
                    </button>
                  )}
                </button>
              ))}
            </div>
          ) : query ? (
            <div className="p-4 text-center text-muted-foreground">
              No suggestions found
            </div>
          ) : (
            <div className="p-4 text-center text-muted-foreground">
              Start typing to search
            </div>
          )}
        </div>
      )}
    </div>
  );
}