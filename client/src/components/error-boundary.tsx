import React from 'react';
import { AlertTriangle, RefreshCw, Home, Bug } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  errorInfo?: React.ErrorInfo;
  retryCount: number;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<{ error: Error; retry: () => void }>;
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  private retryTimeoutId: NodeJS.Timeout | null = null;

  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { 
      hasError: false, 
      retryCount: 0 
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.group('🔥 Error Boundary Caught Error');
    console.error('Error:', error);
    console.error('Error Info:', errorInfo);
    console.error('Component Stack:', errorInfo.componentStack);
    console.groupEnd();

    this.setState({ errorInfo });

    // Report error to monitoring service in production
    if (process.env.NODE_ENV === 'production') {
      this.reportError(error, errorInfo);
    }
  }

  componentWillUnmount() {
    if (this.retryTimeoutId) {
      clearTimeout(this.retryTimeoutId);
    }
  }

  reportError = (error: Error, errorInfo: React.ErrorInfo) => {
    // In a real app, send to error reporting service
    const errorReport = {
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
    };

    console.log('Error report:', errorReport);
    // TODO: Send to monitoring service like Sentry, LogRocket, etc.
  };

  handleRetry = () => {
    if (this.state.retryCount >= 3) {
      // Too many retries, suggest page refresh
      window.location.reload();
      return;
    }

    this.setState(prevState => ({
      hasError: false,
      error: undefined,
      errorInfo: undefined,
      retryCount: prevState.retryCount + 1
    }));
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback && this.state.error) {
        const FallbackComponent = this.props.fallback;
        return <FallbackComponent error={this.state.error} retry={this.handleRetry} />;
      }

      return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
          <Card className="w-full max-w-lg">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 h-16 w-16 text-red-500">
                <AlertTriangle className="h-16 w-16" />
              </div>
              <CardTitle className="text-2xl">Oops! Something went wrong</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="text-center">
                <p className="text-gray-600 mb-2">
                  We encountered an unexpected error. This has been logged and we'll look into it.
                </p>
                {this.state.retryCount > 0 && (
                  <p className="text-sm text-amber-600">
                    Retry attempts: {this.state.retryCount}/3
                  </p>
                )}
              </div>

              {process.env.NODE_ENV === 'development' && this.state.error && (
                <details className="bg-gray-100 rounded-lg p-4">
                  <summary className="cursor-pointer text-sm font-medium text-gray-700 flex items-center">
                    <Bug className="h-4 w-4 mr-2" />
                    Developer Error Details
                  </summary>
                  <div className="mt-3 space-y-2">
                    <div>
                      <strong className="text-xs text-gray-600">Error Message:</strong>
                      <pre className="text-xs bg-red-50 p-2 rounded mt-1 overflow-auto text-red-800">
                        {this.state.error.message}
                      </pre>
                    </div>
                    <div>
                      <strong className="text-xs text-gray-600">Stack Trace:</strong>
                      <pre className="text-xs bg-gray-50 p-2 rounded mt-1 overflow-auto max-h-40">
                        {this.state.error.stack}
                      </pre>
                    </div>
                    {this.state.errorInfo?.componentStack && (
                      <div>
                        <strong className="text-xs text-gray-600">Component Stack:</strong>
                        <pre className="text-xs bg-blue-50 p-2 rounded mt-1 overflow-auto max-h-40">
                          {this.state.errorInfo.componentStack}
                        </pre>
                      </div>
                    )}
                  </div>
                </details>
              )}

              <div className="flex flex-col sm:flex-row gap-3">
                <Button 
                  onClick={this.handleRetry}
                  className="flex-1"
                  disabled={this.state.retryCount >= 3}
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  {this.state.retryCount >= 3 ? 'Max Retries Reached' : 'Try Again'}
                </Button>

                <Button 
                  variant="outline"
                  onClick={this.handleGoHome}
                  className="flex-1"
                >
                  <Home className="h-4 w-4 mr-2" />
                  Go Home
                </Button>
              </div>

              {this.state.retryCount >= 3 && (
                <div className="text-center">
                  <Button 
                    variant="ghost"
                    onClick={() => window.location.reload()}
                    className="text-sm"
                  >
                    Force Refresh Page
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;