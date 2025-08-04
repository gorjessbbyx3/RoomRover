import { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';

// Example: Fetch dashboard stats from Supabase
export function useDashboardStats(userId) {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!userId) return;
    setLoading(true);
    supabase
      .from('dashboard_stats')
      .select('*')
      .eq('user_id', userId)
      .single()
      .then(({ data, error }) => {
        if (error) setError(error);
        setStats(data || null);
        setLoading(false);
      });
  }, [userId]);

  return { stats, loading, error };
}

// Usage: const { stats, loading, error } = useDashboardStats(user.id);
