import React from 'react';
import { Check } from 'lucide-react';

interface HistoryFiltersProps {
  selectedPeriod: string;
  onPeriodChange: (period: string) => void;
  selectedTypes: string[];
  onTypesChange: (types: string[]) => void;
}

export function HistoryFilters({
  selectedPeriod,
  onPeriodChange,
  selectedTypes,
  onTypesChange,
}: HistoryFiltersProps) {
  const periods = [
    { id: 'all', label: 'All Time' },
    { id: 'today', label: 'Today' },
    { id: 'week', label: 'This Week' },
    { id: 'month', label: 'This Month' },
  ];

  const types = [
    { id: 'article', label: 'Articles' },
    { id: 'book', label: 'Books' },
    { id: 'audiobook', label: 'Audiobooks' },
    { id: 'podcast', label: 'Podcasts' }
  ];

  const toggleType = (typeId: string) => {
    const newTypes = selectedTypes.includes(typeId)
      ? selectedTypes.filter(id => id !== typeId)
      : [...selectedTypes, typeId];
    onTypesChange(newTypes);
  };

  return (
    <div className="flex flex-col sm:flex-row gap-4">
      {/* Time Period Filter */}
      <div className="flex gap-2">
        {periods.map(period => (
          <button
            key={period.id}
            onClick={() => onPeriodChange(period.id)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              selectedPeriod === period.id
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted hover:bg-primary/10'
            }`}
          >
            {period.label}
          </button>
        ))}
      </div>

      {/* Content Type Filter */}
      <div className="flex gap-2 flex-wrap">
        {types.map(type => (
          <button
            key={type.id}
            onClick={() => toggleType(type.id)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
              selectedTypes.includes(type.id)
                ? 'bg-primary/10 text-primary'
                : 'bg-muted hover:bg-primary/10'
            }`}
          >
            {selectedTypes.includes(type.id) && (
              <Check className="w-4 h-4" />
            )}
            {type.label}
          </button>
        ))}
      </div>
    </div>
  );
}