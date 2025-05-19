import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { forceReconnect } from '@/lib/supabase';

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
  connectionFailed: boolean;
  isRetrying: boolean;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null,
      errorInfo: null,
      connectionFailed: false,
      isRetrying: false
    };
  }

  componentDidMount() {
    window.addEventListener('supabase:connection-failed', this.handleConnectionFailed);
    window.addEventListener('error', this.handleGlobalError);
    window.addEventListener('unhandledrejection', this.handlePromiseRejection);
  }

  componentWillUnmount() {
    window.removeEventListener('supabase:connection-failed', this.handleConnectionFailed);
    window.removeEventListener('error', this.handleGlobalError);
    window.removeEventListener('unhandledrejection', this.handlePromiseRejection);
  }

  handleConnectionFailed = () => {
    this.setState({ connectionFailed: true });
  };

  handleGlobalError = (event: ErrorEvent) => {
    // Only handle network-related errors
    if (event.message.includes('network') || 
        event.message.includes('connection') ||
        event.message.includes('fetch') ||
        event.message.includes('xhr')) {
      this.setState({ 
        hasError: true, 
        error: new Error(`Network error: ${event.message}`)
      });
      event.preventDefault();
    }
  };

  handlePromiseRejection = (event: PromiseRejectionEvent) => {
    // Only handle network-related promise rejections
    const message = event.reason?.message || String(event.reason);
    if (message.includes('network') || 
        message.includes('connection') ||
        message.includes('fetch') ||
        message.includes('xhr')) {
      this.setState({ 
        hasError: true, 
        error: new Error(`Network error: ${message}`)
      });
      event.preventDefault();
    }
  };

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // We don't store the full error details in state to avoid exposing sensitive information
    this.setState({ 
      errorInfo: {
        componentStack: this.sanitizeComponentStack(errorInfo.componentStack)
      } as React.ErrorInfo
    });
    
    // Log the error to the console for debugging
    console.error('Error caught by ErrorBoundary:', error);
    
    // In production, you might want to send this to a logging service
    if (process.env.NODE_ENV === 'production') {
      // Send to logging service
      // logErrorToService(error, errorInfo);
    }
  }
  
  // Sanitize component stack to remove file paths and line numbers
  sanitizeComponentStack(stack: string): string {
    return stack
      .split('\n')
      .map(line => {
        // Extract just the component name
        const match = line.match(/\s+at\s+([A-Za-z0-9_]+)/);
        return match ? `    at ${match[1]}` : line;
      })
      .join('\n');
  }

  handleRetry = async () => {
    this.setState({ isRetrying: true });
    
    try {
      if (this.state.connectionFailed) {
        console.log('Attempting to force reconnect...');
        const success = await forceReconnect();
        if (success) {
          console.log('Reconnection successful');
          this.setState({ 
            connectionFailed: false,
            hasError: false,
            error: null,
            errorInfo: null
          });
        } else {
          console.log('Reconnection failed');
          // Reload the page as a last resort
          window.location.reload();
        }
      } else {
        this.setState({ 
          hasError: false, 
          error: null,
          errorInfo: null
        });
      }
    } catch (error) {
      console.error('Error during retry:', error);
    } finally {
      this.setState({ isRetrying: false });
    }
  };

  render() {
    if (this.state.hasError || this.state.connectionFailed) {
      return (
        <div className="min-h-[400px] flex items-center justify-center p-4">
          <div className="text-center space-y-4 max-w-md">
            <AlertCircle className="w-12 h-12 text-destructive mx-auto" />
            <h3 className="text-lg font-medium">
              {this.state.connectionFailed 
                ? 'Connection lost'
                : 'Something went wrong'
              }
            </h3>
            <p className="text-sm text-muted-foreground">
              {this.state.connectionFailed
                ? 'Unable to connect to the server. Please check your internet connection and try again.'
                : 'An unexpected error occurred. Please try again.'
              }
            </p>
            <button
              onClick={this.handleRetry}
              disabled={this.state.isRetrying}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-70"
            >
              {this.state.isRetrying ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Retrying...</span>
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4" />
                  <span>Try again</span>
                </>
              )}
            </button>
            {process.env.NODE_ENV !== 'production' && this.state.errorInfo && (
              <details className="mt-4 text-left">
                <summary className="text-sm text-primary cursor-pointer">View technical details</summary>
                <pre className="mt-2 p-4 bg-muted rounded-lg text-xs overflow-auto max-h-[200px]">
                  {this.state.error?.toString()}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}