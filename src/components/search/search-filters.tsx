import React from 'react';
import { Filter, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface SearchFiltersProps {
  filters: {
    type: string[];
    category: string | null;
    dateRange: 'all' | 'today' | 'week' | 'month' | 'year';
    priceRange: 'all' | 'free' | 'paid';
    sortBy: 'relevance' | 'date' | 'views' | 'rating';
  };
  onFilterChange: (filters: SearchFiltersProps['filters']) => void;
  onClose?: () => void;
}

const contentTypes = [
  { id: 'article', label: 'Articles' },
  { id: 'book', label: 'Books' },
  { id: 'audiobook', label: 'Audiobooks' },
  { id: 'podcast', label: 'Podcasts' }
];

const categories = [
  'Business & Finance',
  'Self Development',
  'Science & Technology',
  'History & Politics',
  'Philosophy',
  'Psychology',
  'Fiction',
  'Biography',
  'Health & Wellness',
  'Arts & Culture',
  'Religion & Spirituality',
  'Education'
];

export function SearchFilters({ filters, onFilterChange, onClose }: SearchFiltersProps) {
  const handleTypeChange = (type: string) => {
    const newTypes = filters.type.includes(type)
      ? filters.type.filter(t => t !== type)
      : [...filters.type, type];
    onFilterChange({ ...filters, type: newTypes });
  };

  const handleCategoryChange = (category: string | null) => {
    onFilterChange({ ...filters, category });
  };

  const handleDateRangeChange = (range: typeof filters.dateRange) => {
    onFilterChange({ ...filters, dateRange: range });
  };

  const handlePriceRangeChange = (range: typeof filters.priceRange) => {
    onFilterChange({ ...filters, priceRange: range });
  };

  const handleSortChange = (sort: typeof filters.sortBy) => {
    onFilterChange({ ...filters, sortBy: sort });
  };

  const clearFilters = () => {
    onFilterChange({
      type: [],
      category: null,
      dateRange: 'all',
      priceRange: 'all',
      sortBy: 'relevance'
    });
  };

  return (
    <div className="bg-background border rounded-lg p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4" />
          <h3 className="font-medium">Filters</h3>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="p-2 hover:bg-accent rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Content Type */}
      <div className="space-y-2">
        <Label>Content Type</Label>
        <div className="grid grid-cols-2 gap-2">
          {contentTypes.map(type => (
            <label
              key={type.id}
              className="flex items-center gap-2 p-2 rounded-lg border hover:bg-accent/50 cursor-pointer"
            >
              <input
                type="checkbox"
                checked={filters.type.includes(type.id)}
                onChange={() => handleTypeChange(type.id)}
                className="rounded border-input"
              />
              <span className="text-sm">{type.label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Category */}
      <div className="space-y-2">
        <Label>Category</Label>
        <select
          value={filters.category || ''}
          onChange={(e) => handleCategoryChange(e.target.value || null)}
          className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
        >
          <option value="">All Categories</option>
          {categories.map(category => (
            <option key={category} value={category}>{category}</option>
          ))}
        </select>
      </div>

      {/* Date Range */}
      <div className="space-y-2">
        <Label>Date Range</Label>
        <div className="grid grid-cols-2 gap-2">
          {[
            { value: 'all', label: 'All Time' },
            { value: 'today', label: 'Today' },
            { value: 'week', label: 'This Week' },
            { value: 'month', label: 'This Month' },
            { value: 'year', label: 'This Year' }
          ].map(range => (
            <button
              key={range.value}
              onClick={() => handleDateRangeChange(range.value as any)}
              className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                filters.dateRange === range.value
                  ? 'bg-primary text-primary-foreground'
                  : 'hover:bg-accent'
              }`}
            >
              {range.label}
            </button>
          ))}
        </div>
      </div>

      {/* Price Range */}
      <div className="space-y-2">
        <Label>Price</Label>
        <div className="grid grid-cols-3 gap-2">
          {[
            { value: 'all', label: 'All' },
            { value: 'free', label: 'Free' },
            { value: 'paid', label: 'Paid' }
          ].map(range => (
            <button
              key={range.value}
              onClick={() => handlePriceRangeChange(range.value as any)}
              className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                filters.priceRange === range.value
                  ? 'bg-primary text-primary-foreground'
                  : 'hover:bg-accent'
              }`}
            >
              {range.label}
            </button>
          ))}
        </div>
      </div>

      {/* Sort By */}
      <div className="space-y-2">
        <Label>Sort By</Label>
        <div className="grid grid-cols-2 gap-2">
          {[
            { value: 'relevance', label: 'Relevance' },
            { value: 'date', label: 'Date' },
            { value: 'views', label: 'Views' },
            { value: 'rating', label: 'Rating' }
          ].map(sort => (
            <button
              key={sort.value}
              onClick={() => handleSortChange(sort.value as any)}
              className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                filters.sortBy === sort.value
                  ? 'bg-primary text-primary-foreground'
                  : 'hover:bg-accent'
              }`}
            >
              {sort.label}
            </button>
          ))}
        </div>
      </div>

      {/* Clear Filters */}
      <button
        onClick={clearFilters}
        className="w-full px-4 py-2 text-sm rounded-lg border hover:bg-accent transition-colors"
      >
        Clear All Filters
      </button>
    </div>
  );
}