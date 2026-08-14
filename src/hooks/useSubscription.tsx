import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useUserRole } from './useUserRole';

export interface SubscriptionStatus {
  subscribed: boolean;
  subscription_tier: 'one_time' | 'weekly' | 'monthly' | 'yearly' | null;
  subscription_end: string | null;
  loading: boolean;
}

export const useSubscription = () => {
  const { user } = useAuth();
  const { hasUnlimitedAccess, isSuperAdmin } = useUserRole();
  const [subscription, setSubscription] = useState<SubscriptionStatus>({
    subscribed: false,
    subscription_tier: null,
    subscription_end: null,
    loading: true,
  });

  const fetchSubscriptionStatus = async () => {
    const { data, error } = await supabase.functions.invoke('check-subscription');

    if (error) {
      throw new Error(error.message || 'Unable to check subscription status.');
    }

    return {
      subscribed: Boolean(data?.subscribed),
      subscription_tier: data?.subscription_tier ?? null,
      subscription_end: data?.subscription_end ?? null,
    } satisfies Omit<SubscriptionStatus, 'loading'>;
  };

  const checkSubscription = async () => {
    if (!user) {
      setSubscription({
        subscribed: false,
        subscription_tier: null,
        subscription_end: null,
        loading: false,
      });
      return;
    }

    try {
      const nextSubscription = await fetchSubscriptionStatus();
      setSubscription({
        ...nextSubscription,
        loading: false,
      });
    } catch (error) {
      console.error('Error invoking check-subscription:', error);
      setSubscription(prev => ({ ...prev, loading: false }));
    }
  };

  const createCheckout = async (tier: 'one_time' | 'weekly' | 'monthly' | 'yearly') => {
    try {
      const { data, error } = await supabase.functions.invoke('create-checkout', {
        body: { tier }
      });
      
      if (error) {
        throw new Error(error.message || 'Unable to create checkout session.');
      }

      if (!data?.url) {
        throw new Error('No checkout URL returned.');
      }

      return data.url as string;
    } catch (error) {
      console.error('Error invoking create-checkout:', error);
      throw error instanceof Error ? error : new Error('Unable to create checkout session.');
    }
  };

  const openCustomerPortal = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('customer-portal');
      
      if (error) {
        throw new Error(error.message || 'Unable to open customer portal.');
      }

      if (!data?.url) {
        throw new Error('No customer portal URL returned.');
      }

      return data.url as string;
    } catch (error) {
      console.error('Error invoking customer-portal:', error);
      throw error instanceof Error ? error : new Error('Unable to open customer portal.');
    }
  };

  useEffect(() => {
    const runCheck = async () => {
      if (!user) {
        setSubscription({
          subscribed: false,
          subscription_tier: null,
          subscription_end: null,
          loading: false,
        });
        return;
      }

      try {
        const nextSubscription = await fetchSubscriptionStatus();
        setSubscription({
          ...nextSubscription,
          loading: false,
        });
      } catch (error) {
        console.error('Error invoking check-subscription:', error);
        setSubscription(prev => ({ ...prev, loading: false }));
      }
    };

    void runCheck();
  }, [user]);

  const isPremium = (subscription.subscribed && subscription.subscription_tier !== null) || hasUnlimitedAccess;
  const isOneTime = subscription.subscription_tier === 'one_time';
  const isRecurring = subscription.subscription_tier === 'weekly' || subscription.subscription_tier === 'monthly' || subscription.subscription_tier === 'yearly';

  return {
    ...subscription,
    isPremium,
    isOneTime,
    isRecurring,
    checkSubscription,
    createCheckout,
    openCustomerPortal,
    hasUnlimitedAccess,
    isSuperAdmin,
  };
};
