import React, { useState } from 'react';
import { AlertCircle, Users, MessageSquare, ArrowUp, Plus, Search, Filter, ArrowUpDown, Calendar, Star } from 'lucide-react';

export default function CommunityPage() {
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
            We're working on exciting community features to help you connect with your audience.
            Stay tuned for updates!
          </p>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-[#1a1d24] rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-gray-400">Active Discussions</h3>
              <div className="mt-2 flex items-baseline">
                <p className="text-2xl font-semibold">156</p>
                <p className="ml-2 text-sm text-blue-500">+23 this week</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-[#1a1d24] rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-gray-400">Active Members</h3>
              <div className="mt-2 flex items-baseline">
                <p className="text-2xl font-semibold">2.4K</p>
                <p className="ml-2 text-sm text-blue-500">+312 this month</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-[#1a1d24] rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-gray-400">Engagement Rate</h3>
              <div className="mt-2 flex items-baseline">
                <p className="text-2xl font-semibold">78%</p>
                <p className="ml-2 text-sm text-blue-500">+5% from last month</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-[#1a1d24] rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-gray-400">Growth Rate</h3>
              <div className="mt-2 flex items-baseline">
                <p className="text-2xl font-semibold">12%</p>
                <p className="ml-2 text-sm text-blue-500">Trending up</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Discussions */}
      <div className="bg-[#1a1d24] rounded-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold">Recent Discussions</h2>
          <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-500 text-white hover:bg-blue-600 transition-colors">
            <Plus className="w-4 h-4" />
            <span>New Discussion</span>
          </button>
        </div>

        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center justify-between p-4 rounded-lg border border-[#2a2f38] hover:border-blue-500/50 transition-colors">
              <div className="flex items-center gap-4">
                <img
                  src={`https://source.unsplash.com/random/100x100?face&sig=${i}`}
                  alt="Author"
                  className="w-12 h-12 rounded-full"
                />
                <div>
                  <h3 className="font-medium">Character Development Techniques</h3>
                  <div className="flex items-center gap-2 text-sm text-gray-400">
                    <span>Writing Tips</span>
                    <span>•</span>
                    <span>24 replies</span>
                    <span>•</span>
                    <span>156 views</span>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <p className="font-medium">45 likes</p>
                <p className="text-sm text-blue-500">2h ago</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Upcoming Events */}
      <div className="bg-[#1a1d24] rounded-lg p-6">
        <h2 className="text-lg font-semibold mb-6">Upcoming Events</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            { title: "Creative Writing Masterclass", date: "Mar 25, 2024", time: "2:00 PM", attendees: "45/50" },
            { title: "Author Q&A Session", date: "Mar 28, 2024", time: "3:30 PM", attendees: "32/100" }
          ].map((event, i) => (
            <div key={i} className="p-4 rounded-lg border border-[#2a2f38] hover:border-blue-500/50 transition-colors">
              <h3 className="font-medium">{event.title}</h3>
              <div className="flex items-center gap-4 mt-2 text-sm text-gray-400">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  <span>{event.date} at {event.time}</span>
                </div>
                <span>•</span>
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  <span>{event.attendees} attending</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}