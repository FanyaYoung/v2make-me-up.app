import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, Star, Crown, Zap } from 'lucide-react';
import { useSubscription } from '@/hooks/useSubscription';

const SubscriptionOptions = () => {
  const { createCheckout, isPremium } = useSubscription();

  const plans = [
    {
      id: 'one_time',
      name: 'One-Time Match',
      price: '$2.00',
      period: '',
      subtitle: 'Single match',
      icon: <Zap className="w-5 h-5" />,
      popular: false,
      description: 'Perfect for trying out our AI matching',
      features: [
        'AI shade matching',
        'Foundation database access',
        'Basic recommendations'
      ],
      expectedOutput: 'Get your perfect foundation match with AI-powered shade analysis'
    },
    {
      id: 'weekly',
      name: 'Weekly',
      price: '$4.00',
      period: 'Per week',
      subtitle: '',
      icon: <Star className="w-5 h-5" />,
      popular: false,
      description: 'Enhanced matching for regular users',
      features: [
        'Enhanced matching',
        'Virtual try-on access',
        'Weekly updates',
        'Email support'
      ],
      expectedOutput: 'Advanced matching with virtual try-on and weekly product updates'
    },
    {
      id: 'monthly',
      name: 'Monthly Matches',
      price: '$10.00',
      period: 'Per month',
      subtitle: '',
      icon: <Crown className="w-5 h-5" />,
      popular: true,
      description: 'Most popular plan for beauty enthusiasts',
      features: [
        'Premium matching',
        'Unlimited try-ons',
        'Look recommendations',
        'Priority support'
      ],
      expectedOutput: 'Premium matching with unlimited features and personalized look recommendations'
    },
    {
      id: 'yearly',
      name: 'Annual',
      price: '$100.00',
      period: 'Per year',
      subtitle: '',
      icon: <Crown className="w-5 h-5" />,
      popular: false,
      description: 'Best value with all premium features',
      features: [
        'All features',
        'Custom consultations',
        'Exclusive products',
        'Personal beauty advisor'
      ],
      expectedOutput: 'Complete beauty suite with personal consultation and exclusive access'
    }
  ];

  const handleSubscribe = async (planId: string) => {
    const url = await createCheckout(planId as 'one_time' | 'weekly' | 'monthly' | 'yearly');
    if (url) {
      window.open(url, '_blank');
    }
  };

  if (isPremium) {
    return (
      <Card className="border-green-200 bg-green-50">
        <CardContent className="p-6 text-center">
          <Crown className="w-12 h-12 text-green-600 mx-auto mb-3" />
          <h3 className="text-xl font-semibold text-green-800 mb-2">You're Already Premium!</h3>
          <p className="text-green-600">Enjoy unlimited access to all features</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-3xl font-bold mb-2">
          Choose Your Plan
        </h2>
        <p className="text-muted-foreground">Select the plan that best fits your beauty journey</p>
      </div>

      <div className="grid md:grid-cols-4 gap-6">
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
              {plan.period && (
                <div className="text-sm font-normal text-muted-foreground">{plan.period}</div>
              )}
              {plan.subtitle && (
                <div className="text-sm text-muted-foreground">{plan.subtitle}</div>
              )}
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
                <h4 className="font-semibold text-sm mb-2">Expected Output:</h4>
                <p className="text-sm text-muted-foreground">{plan.expectedOutput}</p>
              </div>

              <Button 
                className={`w-full ${plan.popular ? 'bg-black hover:bg-gray-800 text-white' : ''}`}
                variant={plan.popular ? "default" : "outline"}
                onClick={() => handleSubscribe(plan.id)}
              >
                Choose Plan
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default SubscriptionOptions;