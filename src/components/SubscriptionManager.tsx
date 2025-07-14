import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, Crown, Zap, Calendar, CreditCard } from 'lucide-react';
import { useSubscription } from '@/hooks/useSubscription';
import { useToast } from '@/hooks/use-toast';

const TIERS = [
  {
    id: 'one_time',
    name: 'One-Time Access',
    price: '$8',
    description: 'Perfect for trying out premium features',
    features: [
      'Unlimited foundation matches',
      'Advanced skin analysis',
      'Premium recommendations',
      'Virtual try-on features',
    ],
    icon: Zap,
    popular: false,
  },
  {
    id: 'monthly',
    name: 'Monthly Premium',
    price: '$10/month',
    description: 'Monthly subscription with all premium features',
    features: [
      'Everything in One-Time Access',
      'Priority customer support',
      'New features first',
      'Cancel anytime',
    ],
    icon: Calendar,
    popular: true,
  },
  {
    id: 'yearly',
    name: 'Yearly Premium',
    price: '$100/year',
    description: 'Best value - save $20 per year',
    features: [
      'Everything in Monthly Premium',
      'Significant savings',
      'Exclusive yearly bonuses',
      'Priority feature requests',
    ],
    icon: Crown,
    popular: false,
  },
];

export const SubscriptionManager = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState<string | null>(null);
  const subscription = useSubscription();

  const handleUpgrade = async (tier: 'one_time' | 'monthly' | 'yearly') => {
    setLoading(tier);
    try {
      const url = await subscription.createCheckout(tier);
      if (url) {
        window.open(url, '_blank');
      } else {
        toast({
          title: "Error",
          description: "Failed to create checkout session. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(null);
    }
  };

  const handleManageSubscription = async () => {
    setLoading('portal');
    try {
      const url = await subscription.openCustomerPortal();
      if (url) {
        window.open(url, '_blank');
      } else {
        toast({
          title: "Error",
          description: "Failed to open customer portal. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(null);
    }
  };

  const getCurrentTierName = () => {
    const tier = TIERS.find(t => t.id === subscription.subscription_tier);
    return tier ? tier.name : 'Free';
  };

  const formatSubscriptionEnd = () => {
    if (!subscription.subscription_end) return null;
    return new Date(subscription.subscription_end).toLocaleDateString();
  };

  if (subscription.loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Current Subscription Status */}
      {subscription.isPremium && (
        <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-accent/5">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Crown className="h-5 w-5 text-primary" />
                  Current Plan: {getCurrentTierName()}
                </CardTitle>
                <CardDescription>
                  {subscription.subscription_end && subscription.subscription_tier !== 'one_time' && (
                    `Renews on ${formatSubscriptionEnd()}`
                  )}
                  {subscription.subscription_tier === 'one_time' && 'Lifetime access'}
                </CardDescription>
              </div>
              <Badge variant="default" className="bg-primary">
                Active
              </Badge>
            </div>
          </CardHeader>
          {subscription.isRecurring && (
            <CardContent>
              <Button
                onClick={handleManageSubscription}
                disabled={loading === 'portal'}
                variant="outline"
                className="w-full"
              >
                <CreditCard className="h-4 w-4 mr-2" />
                {loading === 'portal' ? 'Opening...' : 'Manage Subscription'}
              </Button>
            </CardContent>
          )}
        </Card>
      )}

      {/* Subscription Tiers */}
      <div className="grid md:grid-cols-3 gap-6">
        {TIERS.map((tier) => {
          const Icon = tier.icon;
          const isCurrentTier = subscription.subscription_tier === tier.id;
          const isUpgrade = !subscription.isPremium || 
            (subscription.subscription_tier === 'one_time' && tier.id !== 'one_time') ||
            (subscription.subscription_tier === 'monthly' && tier.id === 'yearly');

          return (
            <Card
              key={tier.id}
              className={`relative ${
                tier.popular ? 'border-primary shadow-lg' : ''
              } ${
                isCurrentTier ? 'ring-2 ring-primary' : ''
              }`}
            >
              {tier.popular && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <Badge className="bg-primary">Most Popular</Badge>
                </div>
              )}
              
              <CardHeader className="text-center pb-4">
                <div className="flex justify-center mb-2">
                  <Icon className="h-8 w-8 text-primary" />
                </div>
                <CardTitle className="text-xl">{tier.name}</CardTitle>
                <div className="text-3xl font-bold text-primary">{tier.price}</div>
                <CardDescription>{tier.description}</CardDescription>
              </CardHeader>
              
              <CardContent className="space-y-4">
                <ul className="space-y-2">
                  {tier.features.map((feature, index) => (
                    <li key={index} className="flex items-center gap-2 text-sm">
                      <Check className="h-4 w-4 text-primary" />
                      {feature}
                    </li>
                  ))}
                </ul>
                
                {isCurrentTier ? (
                  <Button disabled className="w-full">
                    Current Plan
                  </Button>
                ) : isUpgrade ? (
                  <Button
                    onClick={() => handleUpgrade(tier.id as any)}
                    disabled={loading === tier.id}
                    className="w-full"
                    variant={tier.popular ? "default" : "outline"}
                  >
                    {loading === tier.id ? 'Processing...' : 'Upgrade Now'}
                  </Button>
                ) : (
                  <Button disabled className="w-full" variant="secondary">
                    Downgrade Not Available
                  </Button>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};