import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useSubscription } from './useSubscription';
import { useUserRole } from './useUserRole';

interface MatchStats {
  total_matches_today: number;
  total_matches_this_week: number;
  total_matches_this_month: number;
  total_matches_all_time: number;
  average_matches_per_week: number;
  last_match_date: string | null;
}

interface MatchUsage {
  usedToday: number;
  usedThisWeek: number;
  usedThisMonth: number;
  totalUsed: number;
  averagePerWeek: number;
  lastMatchDate: string | null;
  loading: boolean;
}

export const useMatchTracking = () => {
  const { user } = useAuth();
  const { isPremium } = useSubscription();
  const { hasUnlimitedAccess } = useUserRole();
  const [matchUsage, setMatchUsage] = useState<MatchUsage>({
    usedToday: 0,
    usedThisWeek: 0,
    usedThisMonth: 0,
    totalUsed: 0,
    averagePerWeek: 0,
    lastMatchDate: null,
    loading: true
  });

  const fetchMatchStats = async () => {
    if (!user?.id) return;

    try {
      const { data, error } = await supabase.rpc('get_user_match_stats', {
        user_uuid: user.id
      });

      if (error) throw error;

      const stats = data as unknown as MatchStats;
      setMatchUsage({
        usedToday: stats.total_matches_today,
        usedThisWeek: stats.total_matches_this_week,
        usedThisMonth: stats.total_matches_this_month,
        totalUsed: stats.total_matches_all_time,
        averagePerWeek: stats.average_matches_per_week,
        lastMatchDate: stats.last_match_date,
        loading: false
      });
    } catch (error) {
      console.error('Error fetching match stats:', error);
      setMatchUsage(prev => ({ ...prev, loading: false }));
    }
  };

  const canPerformMatch = (): boolean => {
    if (!user) return false;
    if (hasUnlimitedAccess) return true; // SuperAdmin bypass
    if (isPremium) return true; // Premium users have unlimited matches
    return matchUsage.usedToday < 3; // Free users get 3 matches per day
  };

  const recordMatch = async (matchType: 'virtual_try_on' | 'shade_match' | 'skin_analysis', metadata?: any) => {
    if (!user?.id) return;

    try {
      const { error } = await supabase
        .from('user_match_usage')
        .insert({
          user_id: user.id,
          match_type: matchType,
          session_id: `session_${Date.now()}`,
          metadata: metadata || {}
        });

      if (error) throw error;

      // Refresh stats after recording
      await fetchMatchStats();
    } catch (error) {
      console.error('Error recording match:', error);
      throw error;
    }
  };

  useEffect(() => {
    if (user?.id) {
      fetchMatchStats();
    }
  }, [user?.id]);

  return {
    matchUsage,
    recordMatch,
    refreshStats: fetchMatchStats,
    canPerformMatch,
    hasUnlimitedAccess
  };
};