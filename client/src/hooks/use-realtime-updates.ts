
import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';

export const useRealtimeUpdates = () => {
  const queryClient = useQueryClient();

  useEffect(() => {
    const interval = setInterval(() => {
      // Invalidate and refetch critical data every 30 seconds
      queryClient.invalidateQueries({ queryKey: ['rooms'] });
      queryClient.invalidateQueries({ queryKey: ['maintenance'] });
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      queryClient.invalidateQueries({ queryKey: ['cleaning-tasks'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
    }, 30000);

    return () => clearInterval(interval);
  }, [queryClient]);

  const manualRefresh = () => {
    queryClient.invalidateQueries();
  };

  return { manualRefresh };
};
