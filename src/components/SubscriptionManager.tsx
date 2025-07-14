import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, Crown, Zap, Calendar, CreditCard } from 'lucide-react';
import { useSubscription } from '@/hooks/useSubscription';
import { useToast } from '@/hooks/use-toast';

// Pre-built Stripe payment URLs
const STRIPE_PAYMENT_URLS = {
  one_time: 'https://buy.stripe.com/test_4gweVo6QR2XMgMw5kl',
  weekly: 'https://buy.stripe.com/test_6oEaFY3EFeAu4cE9AC',
  monthly: 'https://buy.stripe.com/test_cN23dwhppasmfIscMN',
  yearly: 'https://buy.stripe.com/test_5kA29s3EF5a2fIscMO',
} as const;

const TIERS = [
  {
    id: 'one_time',
    name: 'One-Time Match',
    price: '$2',
    description: 'Perfect for a single foundation match',
    features: [
      'One foundation match',
      'Basic skin analysis',
      'Product recommendations',
      'Results saved to account',
    ],
    icon: Zap,
    popular: false,
    paymentUrl: STRIPE_PAYMENT_URLS.one_time,
  },
  {
    id: 'weekly',
    name: 'Weekly Premium',
    price: '$4/week',
    description: 'Great for short-term access',
    features: [
      'Unlimited foundation matches',
      'Advanced skin analysis',
      'Premium recommendations',
      'Virtual try-on features',
    ],
    icon: Calendar,
    popular: false,
    paymentUrl: STRIPE_PAYMENT_URLS.weekly,
  },
  {
    id: 'monthly',
    name: 'Monthly Premium',
    price: '$10/month',
    description: 'Most popular choice for regular users',
    features: [
      'Everything in Weekly Premium',
      'Priority customer support',
      'New features first',
      'Cancel anytime',
    ],
    icon: Crown,
    popular: true,
    paymentUrl: STRIPE_PAYMENT_URLS.monthly,
  },
  {
    id: 'yearly',
    name: 'Yearly Premium',
    price: '$100/year',
    description: 'Best value - save over $20 per year',
    features: [
      'Everything in Monthly Premium',
      'Significant savings',
      'Exclusive yearly bonuses',
      'Priority feature requests',
    ],
    icon: Crown,
    popular: false,
    paymentUrl: STRIPE_PAYMENT_URLS.yearly,
  },
];

export const SubscriptionManager = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState<string | null>(null);
  const subscription = useSubscription();

  const handleUpgrade = async (tier: 'one_time' | 'weekly' | 'monthly' | 'yearly') => {
    setLoading(tier);
    try {
      const paymentUrl = STRIPE_PAYMENT_URLS[tier];
      if (paymentUrl) {
        window.open(paymentUrl, '_blank');
        toast({
          title: "Redirecting to payment",
          description: "You're being redirected to complete your purchase.",
        });
      } else {
        toast({
          title: "Error",
          description: "Payment URL not found. Please try again.",
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
            (subscription.subscription_tier === 'weekly' && ['monthly', 'yearly'].includes(tier.id)) ||
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