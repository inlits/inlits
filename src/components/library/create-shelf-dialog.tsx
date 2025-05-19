import React, { useState } from 'react';
import { X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface CreateShelfDialogProps {
  onClose: () => void;
  onCreateShelf: (name: string, description?: string) => void;
}

export function CreateShelfDialog({ onClose, onCreateShelf }: CreateShelfDialogProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      setError('Shelf name is required');
      return;
    }

    setLoading(true);
    try {
      await onCreateShelf(name, description);
    } catch (error) {
      setError('Failed to create shelf. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center"
      onClick={onClose}
    >
      <div 
        className="bg-background rounded-xl shadow-xl w-full max-w-md mx-4"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-xl font-semibold">Create New Shelf</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-accent rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="shelf-name">Shelf Name</Label>
            <Input
              id="shelf-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Science Fiction, Professional Development"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="shelf-description">Description (Optional)</Label>
            <textarea
              id="shelf-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What kind of content will you save here?"
              className="w-full px-3 py-2 rounded-md border bg-background min-h-[100px] text-sm"
            />
          </div>

          {error && (
            <div className="text-sm text-destructive">
              {error}
            </div>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm rounded-lg border hover:bg-accent transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !name.trim()}
              className="px-4 py-2 text-sm rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {loading ? (
                <>
                  <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  Creating...
                </>
              ) : (
                'Create Shelf'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}