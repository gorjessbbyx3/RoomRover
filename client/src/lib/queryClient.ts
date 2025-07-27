import { QueryClient } from '@tanstack/react-query';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error: any) => {
        // Don't retry on 4xx errors except 401
        if (error?.status >= 400 && error?.status < 500 && error?.status !== 401) {
          return false;
        }
        // Retry up to 2 times for other errors
        return failureCount < 2;
      },
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
      refetchOnWindowFocus: false,
      refetchOnReconnect: 'always',
    },
    mutations: {
      retry: (failureCount, error: any) => {
        // Don't retry mutations on client errors
        if (error?.status >= 400 && error?.status < 500) {
          return false;
        }
        // Retry once for server errors
        return failureCount < 1;
      },
    },
  },
});

// Enhanced API request function with better error handling
export async function apiRequest(
  method: 'GET' | 'POST' | 'PUT' | 'DELETE', 
  url: string, 
  data?: any,
  options: {
    timeout?: number;
    retries?: number;
    signal?: AbortSignal;
  } = {}
) {
  const { timeout = 30000, retries = 0, signal } = options;
  const token = localStorage.getItem('auth-token');

  const config: RequestInit = {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    },
    signal,
  };

  if (data && method !== 'GET') {
    config.body = JSON.stringify(data);
  }

  // Add timeout support
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  if (!signal) {
    config.signal = controller.signal;
  }

  try {
    const response = await fetch(url, config);
    clearTimeout(timeoutId);

    // Handle authentication errors
    if (response.status === 401) {
      localStorage.removeItem('auth-token');
      localStorage.removeItem('user');
      window.location.href = '/login';
      throw new Error('Unauthorized - Please log in again');
    }

    // Handle other client errors
    if (response.status >= 400 && response.status < 500) {
      let errorMessage = `Client error: ${response.status}`;
      try {
        const errorData = await response.json();
        errorMessage = errorData.error || errorData.message || errorMessage;
      } catch {
        // If response is not JSON, use status text
        errorMessage = response.statusText || errorMessage;
      }
      const error = new Error(errorMessage);
      (error as any).status = response.status;
      throw error;
    }

    // Handle server errors
    if (response.status >= 500) {
      const error = new Error(`Server error: ${response.status}`);
      (error as any).status = response.status;
      throw error;
    }

    return response;

  } catch (error: any) {
    clearTimeout(timeoutId);

    // Handle network errors
    if (error.name === 'AbortError') {
      throw new Error('Request timeout - Please check your connection');
    }

    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      throw new Error('Network error - Please check your connection');
    }

    // Re-throw with enhanced error info
    if (!error.status) {
      error.status = 0; // Network error
    }

    throw error;
  }
}

// Optimized query functions
export const queryOptions = {
  // Frequently updated data
  realtime: {
    staleTime: 30 * 1000, // 30 seconds
    gcTime: 2 * 60 * 1000, // 2 minutes
    refetchInterval: 60 * 1000, // 1 minute
  },

  // Moderately updated data
  standard: {
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  },

  // Rarely updated data
  static: {
    staleTime: 30 * 60 * 1000, // 30 minutes
    gcTime: 60 * 60 * 1000, // 1 hour
  },
};

export default queryClient;