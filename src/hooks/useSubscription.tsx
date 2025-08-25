
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface SubscriptionStatus {
  subscribed: boolean;
  subscription_tier: 'weekly' | 'monthly' | 'yearly' | null;
  subscription_end: string | null;
  loading: boolean;
}

export const useSubscription = () => {
  const { user } = useAuth();
  const [subscription, setSubscription] = useState<SubscriptionStatus>({
    subscribed: false,
    subscription_tier: null,
    subscription_end: null,
    loading: true,
  });

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
      const { data, error } = await supabase.functions.invoke('check-subscription');
      
      if (error) {
        console.error('Error checking subscription:', error);
        return;
      }

      setSubscription({
        subscribed: data.subscribed,
        subscription_tier: data.subscription_tier,
        subscription_end: data.subscription_end,
        loading: false,
      });
    } catch (error) {
      console.error('Error invoking check-subscription:', error);
      setSubscription(prev => ({ ...prev, loading: false }));
    }
  };

  const createCheckout = async (tier: 'weekly' | 'monthly' | 'yearly') => {
    try {
      const { data, error } = await supabase.functions.invoke('create-checkout', {
        body: { tier }
      });
      
      if (error) {
        console.error('Error creating checkout:', error);
        return null;
      }

      return data.url;
    } catch (error) {
      console.error('Error invoking create-checkout:', error);
      return null;
    }
  };

  const openCustomerPortal = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('customer-portal');
      
      if (error) {
        console.error('Error opening customer portal:', error);
        return null;
      }

      return data.url;
    } catch (error) {
      console.error('Error invoking customer-portal:', error);
      return null;
    }
  };

  useEffect(() => {
    checkSubscription();
  }, [user]);

  // Everyone must be a premium subscriber now
  const isPremium = subscription.subscribed && subscription.subscription_tier !== null;
  const isRecurring = subscription.subscription_tier === 'weekly' || subscription.subscription_tier === 'monthly' || subscription.subscription_tier === 'yearly';

  return {
    ...subscription,
    isPremium,
    isRecurring,
    checkSubscription,
    createCheckout,
    openCustomerPortal,
  };
};
