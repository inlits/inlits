import React, { createContext, useContext, useState, useEffect } from 'react';
import { checkConnection, reconnect, startConnectionCheck } from './supabase';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { supabase } from './supabase';

interface ConnectionContextType {
  isConnected: boolean;
  retryConnection: () => Promise<void>;
  connectionError: string | null;
}

const ConnectionContext = createContext<ConnectionContextType>({
  isConnected: true,
  retryConnection: async () => {},
  connectionError: null
});

export function ConnectionProvider({ children }: { children: React.ReactNode }) {
  const [isConnected, setIsConnected] = useState(true);
  const [showBanner, setShowBanner] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [isRetrying, setIsRetrying] = useState(false);

  // Function to retry connection
  const retryConnection = async () => {
    if (isRetrying) return;
    
    try {
      setIsRetrying(true);
      setConnectionError(null);
      
      console.log('Manually retrying connection...');
      const success = await reconnect();
      
      if (success) {
        console.log('Manual reconnection successful');
        setIsConnected(true);
        setShowBanner(false);
        setRetryCount(0);
      } else {
        console.log('Manual reconnection failed');
        setRetryCount(prev => prev + 1);
        setConnectionError('Could not connect to the server. Please try again later.');
      }
    } catch (error) {
      console.error('Error during manual reconnection:', error);
      setConnectionError('An error occurred while trying to reconnect.');
    } finally {
      setIsRetrying(false);
    }
  };

  // Initialize connection check on mount
  useEffect(() => {
    const cleanup = startConnectionCheck(5000); // Check every 5 seconds
    
    // Initial connection check
    const initialCheck = async () => {
      try {
        await supabase.auth.getSession();
        console.log('Initial connection check successful');
        setIsConnected(true);
        setShowBanner(false);
      } catch (error) {
        console.warn('Initial connection check failed');
        setIsConnected(false);
        setShowBanner(true);
      }
    };
    
    initialCheck();
    
    return () => {
      cleanup();
    };
  }, []);

  // Check connection status periodically
  useEffect(() => {
    const checkInterval = setInterval(() => {
      const connected = checkConnection();
      
      if (connected !== isConnected) {
        console.log(`Connection status changed: ${connected ? 'connected' : 'disconnected'}`);
        setIsConnected(connected);
      }
      
      // Only show banner if we're disconnected
      if (!connected) {
        setShowBanner(true);
      }
    }, 2000); // Check every 2 seconds

    return () => clearInterval(checkInterval);
  }, [isConnected]);

  // Auto retry with exponential backoff
  useEffect(() => {
    if (!isConnected && !isRetrying) {
      const backoffTime = Math.min(1000 * Math.pow(2, retryCount), 30000); // Max 30 seconds
      console.log(`Scheduling auto-retry in ${backoffTime}ms (attempt ${retryCount + 1})`);
      
      const retryTimer = setTimeout(() => {
        reconnect().then(success => {
          if (success) {
            console.log('Auto-reconnection successful');
            setIsConnected(true);
            setShowBanner(false);
            setRetryCount(0);
          } else {
            console.log('Auto-reconnection failed');
            setRetryCount(prev => prev + 1);
          }
        });
      }, backoffTime);
      
      return () => clearTimeout(retryTimer);
    }
  }, [isConnected, retryCount, isRetrying]);

  // Listen for online/offline events
  useEffect(() => {
    const handleOnline = () => {
      console.log('Network online event detected');
      retryConnection();
    };
    
    const handleOffline = () => {
      console.log('Network offline event detected');
      setIsConnected(false);
      setShowBanner(true);
      setConnectionError('Your device appears to be offline. Please check your internet connection.');
    };
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    // Listen for connection failed event
    const handleConnectionFailed = () => {
      console.log('Connection failed event received');
      setIsConnected(false);
      setShowBanner(true);
      setConnectionError('Connection to the server failed after multiple attempts.');
    };
    
    window.addEventListener('supabase:connection-failed', handleConnectionFailed);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('supabase:connection-failed', handleConnectionFailed);
    };
  }, []);

  // Hide banner when connected
  useEffect(() => {
    if (isConnected && showBanner) {
      const timer = setTimeout(() => {
        setShowBanner(false);
        setConnectionError(null);
      }, 2000);
      
      return () => clearTimeout(timer);
    }
  }, [isConnected, showBanner]);

  return (
    <ConnectionContext.Provider value={{ isConnected, retryConnection, connectionError }}>
      {showBanner && (
        <div className="fixed top-0 left-0 right-0 z-50 bg-destructive/10 text-destructive px-4 py-3 flex items-center justify-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span className="text-sm">
            {connectionError || (isConnected 
              ? 'Connection restored!' 
              : 'Connection lost. Attempting to reconnect...')}
          </span>
          {!isConnected && (
            <button
              onClick={retryConnection}
              disabled={isRetrying}
              className="text-sm underline hover:no-underline ml-2 flex items-center gap-1"
            >
              {isRetrying ? (
                <>
                  <RefreshCw className="w-3 h-3 animate-spin" />
                  Retrying...
                </>
              ) : (
                <>Retry now</>
              )}
            </button>
          )}
        </div>
      )}
      {children}
    </ConnectionContext.Provider>
  );
}

export const useConnection = () => useContext(ConnectionContext);