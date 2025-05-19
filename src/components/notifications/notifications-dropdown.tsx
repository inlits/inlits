import React, { useState, useEffect } from 'react';
import { Bell, X, Settings, Loader2 } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { useNotifications } from '@/lib/notifications';
import { Link } from 'react-router-dom';

export function NotificationsDropdown() {
  const [showDropdown, setShowDropdown] = useState(false);
  const { user } = useAuth();
  const {
    notifications,
    unreadCount,
    loading,
    error,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    subscribeToNotifications
  } = useNotifications();

  useEffect(() => {
    if (user) {
      fetchNotifications();
      subscribeToNotifications(user.id);
    }
  }, [user]);

  const handleNotificationClick = async (id: string, link?: string) => {
    await markAsRead(id);
    if (link) {
      window.location.href = link;
    }
    setShowDropdown(false);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className="relative p-2 transition-colors rounded-lg hover:bg-primary/5"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 w-4 h-4 text-xs font-medium text-white bg-primary rounded-full flex items-center justify-center">
            {unreadCount}
          </span>
        )}
      </button>

      {showDropdown && (
        <div className="absolute right-0 w-80 mt-2 bg-popover border rounded-lg shadow-lg z-50">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b">
            <h3 className="font-medium">Notifications</h3>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  onClick={() => markAllAsRead()}
                  className="text-xs text-primary hover:underline"
                >
                  Mark all as read
                </button>
              )}
              <button
                onClick={() => setShowDropdown(false)}
                className="p-1 hover:bg-accent rounded-lg transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Notifications List */}
          <div className="max-h-[400px] overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center p-8">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : error ? (
              <div className="p-4 text-center text-destructive">
                {error}
                <button
                  onClick={() => fetchNotifications()}
                  className="block mx-auto mt-2 text-sm text-primary hover:underline"
                >
                  Try again
                </button>
              </div>
            ) : notifications.length > 0 ? (
              notifications.map(notification => (
                <button
                  key={notification.id}
                  onClick={() => handleNotificationClick(notification.id, notification.link)}
                  className={`w-full p-4 text-left hover:bg-accent transition-colors flex items-start gap-3 ${
                    notification.read ? 'opacity-70' : ''
                  }`}
                >
                  {!notification.read && (
                    <span className="w-2 h-2 mt-2 rounded-full bg-primary shrink-0" />
                  )}
                  <div className="flex-1">
                    <p className="font-medium">{notification.title}</p>
                    <p className="text-sm text-muted-foreground">
                      {notification.message}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(notification.created_at).toLocaleDateString(undefined, {
                        hour: 'numeric',
                        minute: 'numeric'
                      })}
                    </p>
                  </div>
                </button>
              ))
            ) : (
              <div className="p-4 text-center text-muted-foreground">
                No notifications
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-4 border-t">
            <Link
              to="/settings/notifications"
              className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm rounded-lg hover:bg-accent transition-colors"
              onClick={() => setShowDropdown(false)}
            >
              <Settings className="w-4 h-4" />
              <span>Notification Settings</span>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}