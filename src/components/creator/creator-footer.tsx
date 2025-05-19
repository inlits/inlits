import React from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, Calendar } from 'lucide-react';
import type { Profile } from '@/lib/types';

interface CreatorFooterProps {
  profile: Profile;
}

export function CreatorFooter({ profile }: CreatorFooterProps) {
  return (
    <footer className="border-t bg-card mt-12">
      <div className="container max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Favorite Books */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Recommended Books</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {[1, 2, 3, 4, 5, 6].map((book) => (
                <div key={book} className="space-y-2">
                  <div className="aspect-[2/3] rounded-lg bg-muted overflow-hidden">
                    <img
                      src={`https://source.unsplash.com/random/400x600?book&sig=${book}`}
                      alt={`Book ${book}`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div>
                    <h4 className="text-sm font-medium line-clamp-1">Book Title {book}</h4>
                    <p className="text-xs text-muted-foreground">Author Name</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Book a Session */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Book a Session</h3>
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-lg border hover:border-primary/50 transition-colors">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <BookOpen className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h4 className="font-medium">Writing Review</h4>
                      <p className="text-sm text-muted-foreground">60 minutes</p>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground mb-4">
                    Get personalized feedback on your writing and tips for improvement.
                  </p>
                  <button className="w-full px-4 py-2 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors text-sm font-medium">
                    Book for $99
                  </button>
                </div>

                <div className="p-4 rounded-lg border hover:border-primary/50 transition-colors">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Calendar className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h4 className="font-medium">Mentoring Call</h4>
                      <p className="text-sm text-muted-foreground">30 minutes</p>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground mb-4">
                    One-on-one guidance for your writing journey and career.
                  </p>
                  <button className="w-full px-4 py-2 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors text-sm font-medium">
                    Book for $49
                  </button>
                </div>
              </div>

              <div className="text-center">
                <Link to="#" className="text-sm text-primary hover:underline">
                  View all services
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}