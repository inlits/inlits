import React from 'react';
import { Book, Headphones, FileText, BookOpen } from 'lucide-react';

export function IntellectualIdentity() {
  // Mock data for demonstration
  const mockData = {
    readingPreferences: {
      genres: ['Science Fiction', 'Psychology', 'Business'],
      authors: ['James Clear', 'Malcolm Gladwell', 'Andy Weir'],
      contentTypes: ['Books', 'Audiobooks', 'Articles'],
    },
    stats: {
      booksCompleted: 42,
      audiobooksListened: 15,
      articlesRead: 128,
    },
    currentRead: {
      title: 'Atomic Habits',
      author: 'James Clear',
      progress: 50,
      type: 'book' as const,
    },
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Intellectual Identity</h2>
        <button className="text-sm text-primary hover:underline">
          Edit Preferences
        </button>
      </div>

      {/* Reading Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-card border rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Book className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{mockData.stats.booksCompleted}</p>
              <p className="text-sm text-muted-foreground">Books Completed</p>
            </div>
          </div>
        </div>
        <div className="bg-card border rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Headphones className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{mockData.stats.audiobooksListened}</p>
              <p className="text-sm text-muted-foreground">Audiobooks Listened</p>
            </div>
          </div>
        </div>
        <div className="bg-card border rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <FileText className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{mockData.stats.articlesRead}</p>
              <p className="text-sm text-muted-foreground">Articles Read</p>
            </div>
          </div>
        </div>
      </div>

      {/* Current Read */}
      <div className="bg-card border rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-medium">Currently Reading</h3>
          <span className="text-sm text-muted-foreground">
            {mockData.currentRead.progress}% complete
          </span>
        </div>
        <div className="flex items-center gap-4">
          <div className="w-16 h-20 bg-muted rounded-md overflow-hidden">
            <img
              src={`https://source.unsplash.com/random/200x300?book&sig=${Date.now()}`}
              alt={mockData.currentRead.title}
              className="w-full h-full object-cover"
            />
          </div>
          <div>
            <h4 className="font-medium">{mockData.currentRead.title}</h4>
            <p className="text-sm text-muted-foreground">by {mockData.currentRead.author}</p>
          </div>
        </div>
        <div className="mt-4 h-2 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-primary transition-all"
            style={{ width: `${mockData.currentRead.progress}%` }}
          />
        </div>
      </div>

      {/* Reading Preferences */}
      <div className="space-y-4">
        <h3 className="font-medium">Reading Preferences</h3>
        <div className="space-y-3">
          <div>
            <p className="text-sm text-muted-foreground mb-2">Favorite Genres</p>
            <div className="flex flex-wrap gap-2">
              {mockData.readingPreferences.genres.map((genre) => (
                <span
                  key={genre}
                  className="px-3 py-1 rounded-full bg-primary/10 text-primary text-sm"
                >
                  {genre}
                </span>
              ))}
            </div>
          </div>
          <div>
            <p className="text-sm text-muted-foreground mb-2">Favorite Authors</p>
            <div className="flex flex-wrap gap-2">
              {mockData.readingPreferences.authors.map((author) => (
                <span
                  key={author}
                  className="px-3 py-1 rounded-full bg-muted text-sm"
                >
                  {author}
                </span>
              ))}
            </div>
          </div>
          <div>
            <p className="text-sm text-muted-foreground mb-2">Preferred Content</p>
            <div className="flex flex-wrap gap-2">
              {mockData.readingPreferences.contentTypes.map((type) => (
                <span
                  key={type}
                  className="px-3 py-1 rounded-full bg-muted text-sm"
                >
                  {type}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}