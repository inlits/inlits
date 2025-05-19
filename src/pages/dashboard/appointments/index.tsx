import React, { useState } from 'react';
import { useAuth } from '@/lib/auth';
import { AlertCircle, Clock, Users, Bell, Plus, Filter, ArrowUpDown, Check, X } from 'lucide-react';

export function AppointmentsPage() {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(false);

  return (
    <div className="space-y-6 relative">
      {/* Blur Overlay with Coming Soon Message */}
      <div className="absolute inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
        <div className="max-w-md text-center space-y-4 p-6 rounded-lg">
          <AlertCircle className="w-12 h-12 text-primary mx-auto" />
          <h2 className="text-2xl font-semibold">Coming Soon!</h2>
          <p className="text-muted-foreground">
            We're working on scheduling and appointment features to help you connect with your audience.
            Stay tuned for updates!
          </p>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-[#1a1d24] rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-gray-400">Total Sessions</h3>
              <div className="mt-2 flex items-baseline">
                <p className="text-2xl font-semibold">128</p>
                <p className="ml-2 text-sm text-blue-500">+12 this month</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-[#1a1d24] rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-gray-400">Upcoming Sessions</h3>
              <div className="mt-2 flex items-baseline">
                <p className="text-2xl font-semibold">8</p>
                <p className="ml-2 text-sm text-blue-500">Next: Today 3 PM</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-[#1a1d24] rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-gray-400">Total Hours</h3>
              <div className="mt-2 flex items-baseline">
                <p className="text-2xl font-semibold">256</p>
                <p className="ml-2 text-sm text-gray-400">hours taught</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-[#1a1d24] rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-gray-400">Earnings</h3>
              <div className="mt-2 flex items-baseline">
                <p className="text-2xl font-semibold">$2,450</p>
                <p className="ml-2 text-sm text-blue-500">this month</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Upcoming Sessions */}
      <div className="bg-[#1a1d24] rounded-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold">Upcoming Sessions</h2>
          <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-500 text-white hover:bg-blue-600 transition-colors">
            <Plus className="w-4 h-4" />
            <span>Add Session</span>
          </button>
        </div>

        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center justify-between p-4 rounded-lg border border-[#2a2f38] hover:border-blue-500/50 transition-colors">
              <div className="flex items-center gap-4">
                <img
                  src={`https://source.unsplash.com/random/100x100?face&sig=${i}`}
                  alt="Student"
                  className="w-12 h-12 rounded-full"
                />
                <div>
                  <h3 className="font-medium">Writing Workshop</h3>
                  <div className="flex items-center gap-2 text-sm text-gray-400">
                    <Clock className="w-4 h-4" />
                    <span>Today at {3 + i}:00 PM</span>
                    <span>•</span>
                    <span>60 minutes</span>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <p className="font-medium">$75</p>
                <p className="text-sm text-blue-500">Join Meeting</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Session Types */}
      <div className="bg-[#1a1d24] rounded-lg p-6">
        <h2 className="text-lg font-semibold mb-6">Session Types</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            { title: "1-on-1 Mentoring", duration: "30 min", price: "$45" },
            { title: "Writing Review", duration: "60 min", price: "$75" },
            { title: "Group Workshop", duration: "90 min", price: "$120" },
            { title: "Quick Consultation", duration: "15 min", price: "$25" }
          ].map((session, i) => (
            <div key={i} className="p-4 rounded-lg border border-[#2a2f38] hover:border-blue-500/50 transition-colors">
              <h3 className="font-medium">{session.title}</h3>
              <div className="flex items-center gap-4 mt-2 text-sm text-gray-400">
                <span>{session.duration}</span>
                <span>•</span>
                <span>{session.price}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}