import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: false,
    },
  },
});

export const apiRequest = async (url: string, options: RequestInit = {}) => {
  const token = localStorage.getItem('token');

  if (!token && url.startsWith('/api') && !url.includes('/auth/login')) {
    console.warn('No token found for API request:', url);
    throw new Error('Authentication required');
  }

  const config: RequestInit = {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
  };

  console.log('Making API request to:', url, 'with token:', token ? 'present' : 'missing');

  const response = await fetch(url, config);

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));

    if (response.status === 401) {
      console.warn('Authentication failed, clearing token');
      localStorage.removeItem('token');
      window.location.href = '/login';
    }

    throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
  }

  return response.json();
};