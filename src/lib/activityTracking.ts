import { supabase } from '@/integrations/supabase/client';

type ActivityPayload = Record<string, unknown>;

export const trackUserActivity = async (
  userId: string | undefined,
  activityType: string,
  activityData?: ActivityPayload
) => {
  if (!userId) return;

  try {
    await supabase.from('user_activity').insert({
      user_id: userId,
      activity_type: activityType,
      activity_data: activityData ?? {},
    });
  } catch (error) {
    console.warn(`Failed to track activity: ${activityType}`, error);
  }
};
