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
      name: 'Single Analysis',
      price: '$4.99',
      period: 'one-time',
      icon: <Zap className="w-5 h-5" />,
      popular: false,
      description: 'Perfect for trying out our AI analysis',
      features: [
        '1 complete skin tone analysis',
        '3 foundation matches',
        'Basic undertone detection',
        'Color recommendations',
        '24-hour access to results'
      ],
      expectedOutput: 'Instant analysis with foundation matches from major brands'
    },
    {
      id: 'weekly',
      name: 'Weekly Plan',
      price: '$9.99',
      period: 'per week',
      icon: <Star className="w-5 h-5" />,
      popular: true,
      description: 'Great for makeup enthusiasts',
      features: [
        'Unlimited analyses',
        '10+ foundation matches per analysis',
        'Advanced undertone mapping',
        'Seasonal color palette',
        'Virtual try-on access',
        'Premium brand recommendations',
        'Skincare suggestions'
      ],
      expectedOutput: 'Comprehensive analysis with premium brand matches and seasonal recommendations'
    },
    {
      id: 'monthly',
      name: 'Monthly Pro',
      price: '$29.99',
      period: 'per month',
      icon: <Crown className="w-5 h-5" />,
      popular: false,
      description: 'Ultimate beauty analysis experience',
      features: [
        'Everything in Weekly',
        'Personal color consultant chat',
        'Custom makeup looks',
        'Brand partnership discounts',
        'Early access to new features',
        'Detailed heritage analysis',
        'Professional makeup tips',
        'Priority customer support'
      ],
      expectedOutput: 'Professional-level analysis with personal consultation and exclusive features'
    }
  ];

  const handleSubscribe = async (planId: string) => {
    const url = await createCheckout(planId as 'one_time' | 'weekly' | 'monthly');
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
        <h2 className="text-3xl font-bold mb-2 bg-gradient-to-r from-purple-600 via-pink-600 to-orange-600 bg-clip-text text-transparent">
          Choose Your Analysis Plan
        </h2>
        <p className="text-muted-foreground">Select the plan that best fits your beauty journey</p>
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
                <span className="text-sm font-normal text-muted-foreground">/{plan.period}</span>
              </div>
              <p className="text-sm text-muted-foreground">{plan.description}</p>
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
                className="w-full"
                variant={plan.popular ? "default" : "outline"}
                onClick={() => handleSubscribe(plan.id)}
              >
                {plan.id === 'one_time' ? 'Get Analysis' : 'Start Subscription'}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default SubscriptionOptions;