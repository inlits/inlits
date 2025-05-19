import React from 'react';
import { AlertCircle, Users } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';

export function SearchProfilesPage() {
  return (
    <div className="relative h-[calc(100vh-8rem)] overflow-hidden">
      {/* Mock content with blur effect */}
      <div className="absolute inset-0 blur-sm pointer-events-none overflow-hidden">
        <div className="max-w-3xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
              <Users className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold">Find People</h1>
              <p className="text-muted-foreground">
                Discover and connect with other learners
              </p>
            </div>
          </div>

          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search by username or name..."
              className="pl-10"
            />
          </div>

          {/* Mock Results */}
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                className="block bg-card border rounded-lg p-4 hover:border-primary/50 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-full overflow-hidden bg-muted">
                    <img
                      src={`https://source.unsplash.com/random/100x100?face&sig=${i}`}
                      alt="Profile"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div>
                    <h3 className="font-medium">User Name {i}</h3>
                    <p className="text-sm text-muted-foreground">@username{i}</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Bio description for user {i}...
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Coming Soon Overlay */}
      <div className="absolute inset-0 flex items-center justify-center bg-background/50 backdrop-blur-sm">
        <div className="max-w-md text-center space-y-4 p-6 rounded-lg">
          <AlertCircle className="w-12 h-12 text-primary mx-auto" />
          <h2 className="text-2xl font-semibold">Coming Soon!</h2>
          <p className="text-muted-foreground">
            We're working on exciting features to help you connect with fellow learners and creators.
            Stay tuned for updates!
          </p>
        </div>
      </div>
    </div>
  );
}