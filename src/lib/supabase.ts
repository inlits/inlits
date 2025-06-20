import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

// Create Supabase client with enhanced configuration
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    flowType: 'pkce'
  },
  realtime: {
    params: {
      eventsPerSecond: 2
    }
  },
  global: {
    headers: { 'x-client-info': 'inlits' }
  },
  // Add security-related options
  db: {
    schema: 'public'
  }
});

// Connection state management
let isConnected = true;
let connectionAttempts = 0;
let lastReconnectAttempt = 0;
let connectionCheckInterval: number | null = null;

// Retry configuration
const MAX_RETRIES = 10;
const INITIAL_RETRY_DELAY = 1000;
const MAX_RETRY_DELAY = 30000;
const RECONNECT_BACKOFF_FACTOR = 1.5;

// Retry helper functions
export const isRetryableError = (error: any) => {
  return error.code === 'PGRST116' || // Timeout
         error.code === '503' ||      // Service unavailable
         error.code === '504' ||      // Gateway timeout
         error.code === '429' ||      // Too many requests
         error.code === 'ECONNRESET' || // Connection reset
         error.message?.includes('network') || // Network errors
         error.message?.includes('timeout') || // Timeout errors
         error.message?.includes('connection'); // Connection errors
};

// Improved retry helper with exponential backoff
export const withRetry = async <T,>(
  operation: () => Promise<T>,
  maxRetries = MAX_RETRIES,
  initialDelay = INITIAL_RETRY_DELAY,
  timeout = 10000
): Promise<T> => {
  let lastError;
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Operation timed out')), timeout);
      });

      const result = await Promise.race([operation(), timeoutPromise]);
      isConnected = true;
      connectionAttempts = 0;
      return result as T;
    } catch (error) {
      lastError = error;
      if (!isRetryableError(error)) {
        throw error;
      }
      if (i < maxRetries - 1) {
        // Calculate backoff with jitter
        const backoffDelay = Math.min(
          initialDelay * Math.pow(RECONNECT_BACKOFF_FACTOR, i),
          MAX_RETRY_DELAY
        );
        const jitter = Math.random() * 1000; // Add up to 1s of random jitter
        await new Promise(resolve => setTimeout(resolve, backoffDelay + jitter));
      }
    }
  }
  
  throw lastError;
};

// Improved reconnection helper
export const reconnect = async () => {
  const now = Date.now();
  
  // Prevent reconnection attempts too close together
  if (now - lastReconnectAttempt < INITIAL_RETRY_DELAY) {
    return false;
  }
  
  if (connectionAttempts >= MAX_RETRIES) {
    console.error('Max reconnection attempts reached, waiting for manual refresh');
    // Emit an event that UI can listen to for showing a refresh button
    window.dispatchEvent(new CustomEvent('supabase:connection-failed'));
    return false;
  }

  try {
    lastReconnectAttempt = now;
    connectionAttempts++;
    
    // Calculate backoff delay
    const backoffDelay = Math.min(
      INITIAL_RETRY_DELAY * Math.pow(RECONNECT_BACKOFF_FACTOR, connectionAttempts - 1),
      MAX_RETRY_DELAY
    );
    
    // Add jitter to prevent thundering herd
    const jitter = Math.random() * 1000;
    await new Promise(resolve => setTimeout(resolve, backoffDelay + jitter));
    
    // Test connection with a simple query
    const { error } = await supabase.from('profiles').select('id').limit(1);
    
    if (error) {
      console.error('Connection test failed:', error);
      return false;
    }
    
    // Reset connection state on successful reconnect
    isConnected = true;
    connectionAttempts = 0;
    return true;
  } catch (error) {
    console.error('Reconnection failed:', error);
    return false;
  }
};

// Add manual refresh helper
export const forceReconnect = async () => {
  connectionAttempts = 0;
  lastReconnectAttempt = 0;
  return reconnect();
};

// Export connection status checker
export const checkConnection = () => isConnected;

// Export connection attempts checker
export const getConnectionAttempts = () => connectionAttempts;

// Start periodic connection check
export const startConnectionCheck = (interval = 10000) => {
  if (connectionCheckInterval) {
    clearInterval(connectionCheckInterval);
  }
  
  connectionCheckInterval = window.setInterval(() => {
    if (!isConnected) {
      reconnect();
    } else {
      // Periodically test connection even if we think we're connected
      supabase.from('profiles').select('id').limit(1).then(({ error }) => {
        if (error) {
          console.warn('Connection check failed:', error);
          isConnected = false;
          reconnect();
        }
      });
    }
  }, interval);
  
  return () => {
    if (connectionCheckInterval) {
      clearInterval(connectionCheckInterval);
      connectionCheckInterval = null;
    }
  };
};

// Add online/offline handlers
window.addEventListener('online', () => {
  console.log('Network online, attempting reconnect');
  if (!isConnected) {
    connectionAttempts = 0;
    reconnect();
  }
});

window.addEventListener('offline', () => {
  console.log('Network offline, marking as disconnected');
  isConnected = false;
});

// Add visibility change handler
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible') {
    console.log('Document visible, checking connection');
    // Test connection when tab becomes visible
    supabase.from('profiles').select('id').limit(1).then(({ error }) => {
      if (error) {
        console.warn('Connection test on visibility change failed:', error);
        isConnected = false;
        reconnect();
      }
    });
  }
});

// Initialize connection check
startConnectionCheck();