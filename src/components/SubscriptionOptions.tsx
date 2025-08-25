
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, Star, Crown, AlertCircle } from 'lucide-react';
import { useSubscription } from '@/hooks/useSubscription';

const SubscriptionOptions = () => {
  const { createCheckout, isPremium } = useSubscription();

  const plans = [
    {
      id: 'weekly',
      name: 'Weekly Plan',
      price: '$10.00',
      period: 'Per week',
      subtitle: 'Perfect for trying out',
      icon: <Star className="w-5 h-5" />,
      popular: false,
      description: 'Weekly access to all premium features',
      features: [
        'Complete AI shade matching',
        'Virtual try-on access',
        'All foundation brands',
        'Email support'
      ],
      expectedOutput: 'Full access to all features with weekly billing'
    },
    {
      id: 'monthly',
      name: 'Monthly Plan',
      price: '$10.00',
      period: 'Per month',
      subtitle: 'Most popular',
      icon: <Crown className="w-5 h-5" />,
      popular: true,
      description: 'Monthly access with best value',
      features: [
        'Everything in Weekly',
        'Priority customer support',
        'Advanced analytics',
        'Early access to new features'
      ],
      expectedOutput: 'Complete beauty suite with monthly convenience and savings'
    },
    {
      id: 'yearly',
      name: 'Annual Plan',
      price: '$10.00',
      period: 'Per year',
      subtitle: 'Best value',
      icon: <Crown className="w-5 h-5" />,
      popular: false,
      description: 'Maximum savings with annual billing',
      features: [
        'Everything in Monthly',
        'Custom consultations',
        'Exclusive products',
        'Personal beauty advisor'
      ],
      expectedOutput: 'Premium experience with maximum savings and exclusive perks'
    }
  ];

  const handleSubscribe = async (planId: string) => {
    const url = await createCheckout(planId as 'weekly' | 'monthly' | 'yearly');
    if (url) {
      window.open(url, '_blank');
    }
  };

  if (isPremium) {
    return (
      <Card className="border-green-200 bg-green-50">
        <CardContent className="p-6 text-center">
          <Crown className="w-12 h-12 text-green-600 mx-auto mb-3" />
          <h3 className="text-xl font-semibold text-green-800 mb-2">You're All Set!</h3>
          <p className="text-green-600">Enjoy full access to all features</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className="flex items-center justify-center gap-2 mb-4">
          <AlertCircle className="w-6 h-6 text-orange-600" />
          <Badge variant="destructive" className="text-sm font-semibold">
            SUBSCRIPTION REQUIRED
          </Badge>
        </div>
        <h2 className="text-3xl font-bold mb-2">
          Choose Your Subscription Plan
        </h2>
        <p className="text-muted-foreground">A subscription is required to access Make Me Up features</p>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {plans.map((plan) => (
          <Card 
            key={plan.id} 
            className={`relative overflow-hidden transition-all duration-300 hover:shadow-lg ${
              plan.popular ? 'ring-2 ring-purple-500 scale-105' : ''
            }`}
          >
            {plan.popular && (
              <Badge className="absolute top-4 right-4 bg-purple-500 text-white">
                Most Popular
              </Badge>
            )}
            
            <CardHeader className="text-center">
              <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full text-white mx-auto mb-3">
                {plan.icon}
              </div>
              <CardTitle className="text-xl">{plan.name}</CardTitle>
              <div className="text-3xl font-bold text-primary">
                {plan.price}
              </div>
              <div className="text-sm font-normal text-muted-foreground">{plan.period}</div>
              <div className="text-sm text-muted-foreground">{plan.subtitle}</div>
            </CardHeader>

            <CardContent className="space-y-4">
              <div className="space-y-3">
                <h4 className="font-semibold text-sm">Features Included:</h4>
                {plan.features.map((feature, index) => (
                  <div key={index} className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span className="text-sm">{feature}</span>
                  </div>
                ))}
              </div>

              <div className="border-t pt-4">
                <h4 className="font-semibold text-sm mb-2">What You Get:</h4>
                <p className="text-sm text-muted-foreground">{plan.expectedOutput}</p>
              </div>

              <Button 
                className={`w-full ${plan.popular ? 'bg-black hover:bg-gray-800 text-white' : ''}`}
                variant={plan.popular ? "default" : "outline"}
                onClick={() => handleSubscribe(plan.id)}
              >
                Subscribe Now
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default SubscriptionOptions;
