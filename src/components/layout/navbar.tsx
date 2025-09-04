import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Sun,
  Moon,
  ChevronDown,
  X,
  BookOpen,
  User
} from "lucide-react";
import { useTheme } from "@/components/theme-provider";
import { useAuth } from "@/lib/auth";
import { SearchBox } from "@/components/search/search-box";
import { NotificationsDropdown } from '@/components/notifications/notifications-dropdown';

export function Navbar() {
  const { theme, setTheme } = useTheme();
  const { user, profile, signOut } = useAuth();
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const navigate = useNavigate();
  const isMobile = window.innerWidth < 768;

  const handleSignOut = async () => {
    try {
      await signOut();
      setShowUserDropdown(false);
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const handleProfileClick = () => {
    setShowUserDropdown(false);
    if (profile?.role === 'creator') {
      navigate(`/creator/${profile.username}`);
    } else {
      navigate(`/@${profile?.username}`);
    }
  };

  const handleSettingsClick = () => {
    setShowUserDropdown(false);
    if (profile?.role === 'creator') {
      navigate(`/dashboard/${profile.username}/settings`);
    } else {
      navigate('/settings');
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center justify-between px-4">
        {/* Left Section */}
        <div className="flex items-center gap-4">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <BookOpen className="h-6 w-6 text-primary" />
            <span className="hidden text-xl font-bold md:inline">Inlits</span>
          </Link>
        
        </div>

        {/* Center Section - Search */}
        <div className="flex-1 max-w-xl mx-4">
          <SearchBox />
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-2">


          {/* Theme Toggle */}
          <button
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="p-2 transition-colors rounded-lg hover:bg-primary/5"
          >
            {theme === "dark" ? (
              <Sun className="w-5 h-5" />
            ) : (
              <Moon className="w-5 h-5" />
            )}
          </button>

          {/* Notifications - Only show on desktop */}
          {user && !isMobile && <NotificationsDropdown />}

          {/* User Menu */}
          {user ? (
            <div className="relative">
              <button
                onClick={() => setShowUserDropdown(!showUserDropdown)}
                className="flex items-center gap-2 p-1 transition-colors rounded-lg hover:bg-primary/5"
              >
                {profile?.avatar_url ? (
                  <img
                    src={profile.avatar_url}
                    alt={profile.username}
                    className="w-8 h-8 rounded-full"
                  />
                ) : (
                  <div className="flex items-center justify-center w-8 h-8 font-medium rounded-full bg-primary/10 text-primary">
                    {profile?.username[0].toUpperCase()}
                  </div>
                )}
                {!isMobile && <ChevronDown className="w-4 h-4" />}
              </button>

              {/* Dropdown Menu */}
              {showUserDropdown && (
                <div className="absolute right-0 w-56 p-2 mt-2 bg-popover border rounded-lg shadow-lg">
                  <div className="pb-2 mb-2 border-b">
                    <p className="px-2 text-sm font-medium">
                      {profile?.username}
                    </p>
                    <p className="px-2 text-xs capitalize text-muted-foreground">
                      {profile?.role}
                    </p>
                  </div>
                  <button
                    onClick={handleProfileClick}
                    className="w-full px-2 py-1.5 text-left text-sm rounded-md hover:bg-primary/5"
                  >
                    Your Profile
                  </button>
                  {profile?.role === "creator" ? (
                    <Link
                      to={`/dashboard/${profile.username}`}
                      onClick={() => setShowUserDropdown(false)}
                      className="block px-2 py-1.5 text-sm rounded-md hover:bg-primary/5"
                    >
                      Creator Dashboard
                    </Link>
                  ) : (
                    <Link
                      to="/become-creator"
                      onClick={() => setShowUserDropdown(false)}
                      className="block px-2 py-1.5 text-sm rounded-md hover:bg-primary/5 text-primary"
                    >
                      Become a Creator
                    </Link>
                  )}
                  <button
                    onClick={handleSettingsClick}
                    className="w-full px-2 py-1.5 text-left text-sm rounded-md hover:bg-primary/5"
                  >
                    Settings
                  </button>
                  <button
                    onClick={handleSignOut}
                    className="w-full text-left px-2 py-1.5 text-sm rounded-md hover:bg-primary/5 text-destructive"
                  >
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2">
              {/* Show both buttons on desktop, only icon on mobile */}
              {isMobile ? (
                <Link
                  to="/signin"
                  className="p-2"
                >
                  <User className="w-5 h-5" />
                </Link>
              ) : (
                <>
                  <Link
                    to="/signin"
                    className="px-4 py-2 text-sm font-medium transition-colors rounded-md hover:bg-primary/5"
                  >
                    Sign In
                  </Link>
                  <Link
                    to="/signup"
                    className="px-4 py-2 text-sm font-medium transition-colors rounded-md shadow h-9 bg-primary text-primary-foreground hover:bg-primary/90"
                  >
                    Join Now
                  </Link>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}