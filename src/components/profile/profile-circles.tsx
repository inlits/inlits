import React from 'react';
import { Users, Lock, Plus, AlertCircle } from 'lucide-react';

export function ProfileCircles() {
  // Circles feature is not yet implemented

  return (
    <div className="bg-card border rounded-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="space-y-1">
          <h2 className="font-semibold">Circles</h2>
          <p className="text-sm text-muted-foreground">Connect with like-minded learners</p>
        </div>
      </div>

      {/* Coming Soon Message */}
      <div className="text-center py-8">
        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
          <Users className="w-8 h-8 text-primary" />
        </div>
        <h3 className="text-lg font-medium mb-2">Circles Coming Soon!</h3>
        <p className="text-sm text-muted-foreground mb-4 max-w-sm mx-auto">
          We're working on exciting features to help you connect with like-minded learners and form study circles.
        </p>
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-sm">
          <AlertCircle className="w-4 h-4" />
          <span>Feature in development</span>
        </div>
      </div>
    </div>
  );
}