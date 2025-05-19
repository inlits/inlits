import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  MessageSquare, 
  Bell, 
  Share2,
  AlertCircle,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { CreatorMessageDialog } from './creator-message-dialog';

interface CreatorHeaderProps {
  profile: {
    id: string;
    username: string;
    name: string;
    avatar_url: string;
    cover_url: string;
    bio: string;
    verified: boolean;
  };
  stats: {
    total_content: number;
    total_followers: number;
    avg_rating: number;
    total_views: number;
  };
}

export function CreatorHeader({ profile, stats }: CreatorHeaderProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isFollowing, setIsFollowing] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [showShareTooltip, setShowShareTooltip] = useState(false);
  const [shareTooltipText, setShareTooltipText] = useState('Copy link');
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showMessageDialog, setShowMessageDialog] = useState(false);

  // Refs for stats scrolling
  const statsRef = useRef<HTMLDivElement>(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(false);

  // Check if stats need scroll buttons
  const checkScrollButtons = () => {
    if (statsRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = statsRef.current;
      setShowLeftArrow(scrollLeft > 0);
      setShowRightArrow(scrollLeft < scrollWidth - clientWidth);
    }
  };

  // Handle stats scroll
  const handleScroll = (direction: 'left' | 'right') => {
    if (statsRef.current) {
      const scrollAmount = 200;
      statsRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  // Update scroll buttons when content changes
  useEffect(() => {
    checkScrollButtons();
    window.addEventListener('resize', checkScrollButtons);
    return () => window.removeEventListener('resize', checkScrollButtons);
  }, []);

  const handleFollow = () => {
    if (!user) {
      setShowAuthModal(true);
      return;
    }
    setIsFollowing(!isFollowing);
  };

  const handleMessage = () => {
    if (!user) {
      setShowAuthModal(true);
      return;
    }
    setShowMessageDialog(true);
  };

  const handleNotifications = () => {
    if (!user) {
      setShowAuthModal(true);
      return;
    }
    setNotificationsEnabled(!notificationsEnabled);
  };

  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: `${profile.name} on Inlits`,
          text: `Check out ${profile.name}'s profile on Inlits`,
          url: window.location.href
        });
        setShareTooltipText('Shared successfully!');
      } else {
        await navigator.clipboard.writeText(window.location.href);
        setShareTooltipText('Link copied!');
      }
      
      setShowShareTooltip(true);
      setTimeout(() => {
        setShowShareTooltip(false);
        setShareTooltipText('Copy link');
      }, 2000);
    } catch (error) {
      if (error instanceof Error && error.name !== 'AbortError') {
        console.error('Error sharing:', error);
        setShareTooltipText('Failed to share');
        setShowShareTooltip(true);
        setTimeout(() => {
          setShowShareTooltip(false);
          setShareTooltipText('Copy link');
        }, 2000);
      }
    }
  };

  return (
    <div className="relative -mt-14">
      {/* Cover Image */}
      <div className="h-48 md:h-64 bg-gradient-to-r from-primary/5 to-primary/10 relative -mx-4 md:mx-0">
        {profile.cover_url ? (
          <img
            src={profile.cover_url}
            alt="Cover"
            className="w-full h-full object-cover"
          />
        ) : (
          <img
            src="https://images.unsplash.com/photo-1519791883288-dc8bd696e667"
            alt="Cover"
            className="w-full h-full object-cover opacity-50"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-background/90" />
      </div>

      {/* Profile Info */}
      <div className="container max-w-7xl mx-auto px-4 -mt-32 relative z-10">
        <div className="flex flex-col md:flex-row gap-6 items-start">
          {/* Mobile Layout */}
          <div className="flex flex-col w-full md:hidden items-center">
            {/* Avatar */}
            <div className="w-28 h-28 rounded-full border-4 border-background overflow-hidden bg-muted shadow-lg">
              {profile.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  alt={profile.name || profile.username}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-primary/10 text-primary text-4xl font-medium">
                  {profile.username[0].toUpperCase()}
                </div>
              )}
            </div>

            {/* Info and Actions */}
            <div className="flex flex-col items-center mt-4">
              <h1 className="text-xl font-bold text-foreground">
                {profile.name || profile.username}
                {profile.verified && (
                  <span className="inline-block ml-2 text-primary">
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none">
                      <path d="M9 12L11 14L15 10M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" 
                        stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </span>
                )}
              </h1>
              <p className="text-muted-foreground">@{profile.username}</p>

              {/* Social Actions */}
              {(!user || user.id !== profile.id) && (
                <div className="flex items-center gap-2 mt-3">
                  <button
                    onClick={handleFollow}
                    className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors whitespace-nowrap ${
                      isFollowing
                        ? 'bg-primary/10 text-primary hover:bg-primary hover:text-white'
                        : 'bg-primary text-white hover:bg-primary/90'
                    }`}
                  >
                    {isFollowing ? 'Following' : 'Follow'}
                  </button>

                  <button
                    onClick={handleMessage}
                    className="p-1.5 rounded-full hover:bg-primary hover:text-white transition-colors"
                    title="Send message"
                  >
                    <MessageSquare className="w-4 h-4" />
                  </button>

                  <button
                    onClick={handleNotifications}
                    className={`p-1.5 rounded-full transition-colors hover:bg-primary hover:text-white ${
                      notificationsEnabled ? 'text-primary hover:text-white' : ''
                    }`}
                    title={notificationsEnabled ? 'Notifications on' : 'Notifications off'}
                  >
                    <Bell className="w-4 h-4" />
                  </button>

                  <button
                    onClick={handleShare}
                    className="p-1.5 rounded-full hover:bg-primary hover:text-white transition-colors relative"
                    title="Share profile"
                  >
                    <Share2 className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Desktop Layout */}
          <div className="hidden md:flex items-start gap-4 flex-1">
            <div className="shrink-0">
              <div className="w-32 h-32 rounded-full border-4 border-background overflow-hidden bg-muted shadow-lg">
                {profile.avatar_url ? (
                  <img
                    src={profile.avatar_url}
                    alt={profile.name || profile.username}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-primary/10 text-primary text-4xl font-medium">
                    {profile.username[0].toUpperCase()}
                  </div>
                )}
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between">
                <div>
                  <h1 className="text-2xl font-bold text-foreground">
                    {profile.name || profile.username}
                    {profile.verified && (
                      <span className="inline-block ml-2 text-primary">
                        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none">
                          <path d="M9 12L11 14L15 10M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" 
                            stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </span>
                    )}
                  </h1>
                  <p className="text-muted-foreground">@{profile.username}</p>
                </div>

                {/* Desktop Action Buttons */}
                {(!user || user.id !== profile.id) && (
                  <div className="flex items-center gap-2 mt-2">
                    <button
                      onClick={handleFollow}
                      className={`px-4 py-2 rounded-full text-sm font-medium transition-colors whitespace-nowrap ${
                        isFollowing
                          ? 'bg-primary/10 text-primary hover:bg-primary hover:text-white'
                          : 'bg-primary text-white hover:bg-primary/90'
                      }`}
                    >
                      {isFollowing ? 'Following' : 'Follow'}
                    </button>

                    <button
                      onClick={handleMessage}
                      className="p-2 rounded-full hover:bg-primary hover:text-white transition-colors"
                      title="Send message"
                    >
                      <MessageSquare className="w-4 h-4" />
                    </button>

                    <button
                      onClick={handleNotifications}
                      className={`p-2 rounded-full transition-colors hover:bg-primary hover:text-white ${
                        notificationsEnabled ? 'text-primary hover:text-white' : ''
                      }`}
                      title={notificationsEnabled ? 'Notifications on' : 'Notifications off'}
                    >
                      <Bell className="w-4 h-4" />
                    </button>

                    <button
                      onClick={handleShare}
                      className="p-2 rounded-full hover:bg-primary hover:text-white transition-colors relative"
                      title="Share profile"
                      onMouseEnter={() => setShowShareTooltip(true)}
                      onMouseLeave={() => setShowShareTooltip(false)}
                    >
                      <Share2 className="w-4 h-4" />
                      {showShareTooltip && (
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 text-xs font-medium text-white bg-black/90 rounded whitespace-nowrap">
                          {shareTooltipText}
                        </div>
                      )}
                    </button>
                  </div>
                )}
              </div>

              {/* Bio and Stats */}
              {profile.bio && (
                <p className="mt-2 text-muted-foreground">
                  {profile.bio}
                </p>
              )}

              {/* Desktop Stats */}
              <div className="hidden md:flex items-center gap-6 mt-4">
                <div>
                  <span className="font-semibold text-foreground">
                    {stats.total_followers.toLocaleString()}
                  </span>
                  <span className="text-muted-foreground ml-1">
                    followers
                  </span>
                </div>
                <div>
                  <span className="font-semibold text-foreground">
                    {stats.total_content.toLocaleString()}
                  </span>
                  <span className="text-muted-foreground ml-1">
                    content
                  </span>
                </div>
                <div>
                  <span className="font-semibold text-foreground">
                    {stats.avg_rating}
                  </span>
                  <span className="text-muted-foreground ml-1">
                    rating
                  </span>
                </div>
                <div>
                  <span className="font-semibold text-foreground">
                    {stats.total_views.toLocaleString()}
                  </span>
                  <span className="text-muted-foreground ml-1">
                    views
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bio (Mobile) */}
        {profile.bio && (
          <p className="mt-6 text-center md:hidden text-muted-foreground">
            {profile.bio}
          </p>
        )}

        {/* Stats with Carousel on Mobile */}
        <div className="relative mt-4 md:hidden">
          <div className="flex items-center">
            {/* Mobile scroll buttons */}
            {showLeftArrow && (
              <button
                onClick={() => handleScroll('left')}
                className="shrink-0 h-full px-2 flex items-center justify-center bg-gradient-to-r from-background via-background to-transparent"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
            )}

            <div
              ref={statsRef}
              className="flex items-center gap-4 text-sm overflow-x-auto scrollbar-hide scroll-smooth flex-1"
              onScroll={checkScrollButtons}
            >
              <div className="shrink-0">
                <span className="font-semibold text-foreground">
                  {stats.total_followers.toLocaleString()}
                </span>
                <span className="text-muted-foreground ml-1">
                  followers
                </span>
              </div>
              <div className="shrink-0">
                <span className="font-semibold text-foreground">
                  {stats.total_content.toLocaleString()}
                </span>
                <span className="text-muted-foreground ml-1">
                  content
                </span>
              </div>
              <div className="shrink-0">
                <span className="font-semibold text-foreground">
                  {stats.avg_rating}
                </span>
                <span className="text-muted-foreground ml-1">
                  rating
                </span>
              </div>
              <div className="shrink-0">
                <span className="font-semibold text-foreground">
                  {stats.total_views.toLocaleString()}
                </span>
                <span className="text-muted-foreground ml-1">
                  views
                </span>
              </div>
            </div>

            {/* Mobile right scroll button */}
            {showRightArrow && (
              <button
                onClick={() => handleScroll('right')}
                className="shrink-0 h-full px-2 flex items-center justify-center bg-gradient-to-l from-background via-background to-transparent"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Auth Modal */}
      {showAuthModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center"
             onClick={() => setShowAuthModal(false)}>
          <div className="bg-background rounded-lg p-6 max-w-md mx-4 text-center space-y-4"
               onClick={e => e.stopPropagation()}>
            <AlertCircle className="w-12 h-12 text-primary mx-auto" />
            <h2 className="text-xl font-semibold">Sign in required</h2>
            <p className="text-muted-foreground">
              Please sign in to interact with creators and their content.
            </p>
            <div className="flex justify-center gap-4">
              <button
                onClick={() => setShowAuthModal(false)}
                className="px-4 py-2 rounded-lg border hover:bg-primary hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => navigate('/signin')}
                className="px-4 py-2 rounded-lg bg-primary text-white hover:bg-primary/90 transition-colors"
              >
                Sign in
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Message Dialog */}
      {showMessageDialog && (
        <CreatorMessageDialog
          recipientId={profile.id}
          recipientName={profile.name || profile.username}
          recipientAvatar={profile.avatar_url}
          onClose={() => setShowMessageDialog(false)}
        />
      )}
    </div>
  );
}