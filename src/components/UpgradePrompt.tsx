import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Crown, 
  TrendingUp, 
  Calendar, 
  Zap, 
  Star,
  Clock,
  CheckCircle,
  ArrowRight,
  Sparkles
} from 'lucide-react';

interface UpgradePromptProps {
  matchUsage: {
    usedToday: number;
    usedThisWeek: number;
    usedThisMonth: number;
    totalUsed: number;
    averagePerWeek: number;
    lastMatchDate: string | null;
  };
  remainingMatches: number;
  maxMatches: number;
  onUpgrade: (tier: 'one_time' | 'weekly' | 'monthly' | 'yearly') => void;
  urgencyLevel: 'low' | 'medium' | 'high' | 'critical';
}

const UpgradePrompt = ({ 
  matchUsage, 
  remainingMatches, 
  maxMatches, 
  onUpgrade, 
  urgencyLevel 
}: UpgradePromptProps) => {
  const usagePercentage = ((maxMatches - remainingMatches) / maxMatches) * 100;

  const getPersonalizedMessage = () => {
    const { averagePerWeek, totalUsed, usedThisWeek } = matchUsage;
    
    if (urgencyLevel === 'critical') {
      return {
        title: "You've used all your matches!",
        subtitle: "Upgrade now to continue finding your perfect foundation match",
        reason: `Based on your ${averagePerWeek} matches per week, you're a power user who needs unlimited access.`
      };
    }
    
    if (urgencyLevel === 'high') {
      return {
        title: "Almost out of matches!",
        subtitle: `Only ${remainingMatches} match${remainingMatches === 1 ? '' : 'es'} remaining`,
        reason: usedThisWeek >= 3 
          ? "You're using matches frequently this week - an upgrade would give you peace of mind."
          : "With your foundation matching habits, an upgrade ensures you never run out."
      };
    }
    
    if (urgencyLevel === 'medium') {
      return {
        title: "Running low on matches",
        subtitle: `${remainingMatches} of ${maxMatches} matches left`,
        reason: totalUsed >= 8 
          ? "You're clearly loving foundation matching! Upgrade for unlimited access."
          : "Stay ahead of the game with unlimited matches and premium features."
      };
    }
    
    return {
      title: "Upgrade for unlimited matches",
      subtitle: "Get the most out of your foundation matching experience",
      reason: "Join thousands of users who've upgraded for unlimited access and premium features."
    };
  };

  const getRecommendedTier = () => {
    const { averagePerWeek } = matchUsage;
    
    if (averagePerWeek >= 4) {
      return 'monthly';
    } else if (averagePerWeek >= 2) {
      return 'weekly';
    } else {
      return 'one_time';
    }
  };

  const getTierBenefits = (tier: string) => {
    const benefits = {
      one_time: [
        'Single premium match',
        'Advanced AI analysis',
        'Brand recommendations'
      ],
      weekly: [
        'Unlimited matches for 7 days',
        'Virtual try-on access',
        'Weekly trend updates',
        'Priority support'
      ],
      monthly: [
        'Unlimited matches for 30 days',
        'All premium features',
        'Skin tone analysis',
        'Look recommendations',
        'Priority support'
      ],
      yearly: [
        'Unlimited matches all year',
        'All premium features',
        'Exclusive product access',
        'Personal beauty advisor',
        'VIP support'
      ]
    };
    
    return benefits[tier as keyof typeof benefits] || [];
  };

  const message = getPersonalizedMessage();
  const recommendedTier = getRecommendedTier();

  const tiers = [
    {
      id: 'one_time' as const,
      name: 'One-Time Match',
      price: '$2.00',
      description: 'Perfect for occasional users',
      popular: false,
      savings: null
    },
    {
      id: 'weekly' as const,
      name: 'Weekly',
      price: '$4.00',
      description: 'Great for regular users',
      popular: recommendedTier === 'weekly',
      savings: 'Save vs per-match pricing'
    },
    {
      id: 'monthly' as const,
      name: 'Monthly',
      price: '$10.00',
      description: 'Best value for frequent users',
      popular: recommendedTier === 'monthly',
      savings: 'Save 50% vs weekly'
    },
    {
      id: 'yearly' as const,
      name: 'Annual',
      price: '$100.00',
      description: 'Ultimate beauty experience',
      popular: false,
      savings: 'Save 16% vs monthly'
    }
  ];

  const getUrgencyColor = () => {
    switch (urgencyLevel) {
      case 'critical': return 'border-red-500 bg-red-50';
      case 'high': return 'border-orange-500 bg-orange-50';
      case 'medium': return 'border-yellow-500 bg-yellow-50';
      default: return 'border-blue-500 bg-blue-50';
    }
  };

  return (
    <Card className={`${getUrgencyColor()} border-2`}>
      <CardHeader className="text-center">
        <div className="flex justify-center mb-4">
          {urgencyLevel === 'critical' ? (
            <Zap className="w-12 h-12 text-red-500" />
          ) : (
            <Crown className="w-12 h-12 text-yellow-500" />
          )}
        </div>
        
        <CardTitle className="text-2xl font-bold text-gray-800">
          {message.title}
        </CardTitle>
        <p className="text-gray-600">{message.subtitle}</p>
        
        {/* Progress Bar */}
        <div className="w-full max-w-md mx-auto mt-4">
          <div className="flex justify-between text-sm text-gray-600 mb-2">
            <span>Matches used</span>
            <span>{maxMatches - remainingMatches}/{maxMatches}</span>
          </div>
          <Progress value={usagePercentage} className="h-3" />
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Personalized Reason */}
        <div className="text-center p-4 bg-white rounded-lg border border-gray-200">
          <TrendingUp className="w-6 h-6 text-blue-500 mx-auto mb-2" />
          <p className="text-sm text-gray-700">{message.reason}</p>
        </div>

        {/* Usage Stats */}
        <div className="grid grid-cols-3 gap-4 text-center">
          <div className="p-3 bg-white rounded-lg">
            <Calendar className="w-5 h-5 text-purple-500 mx-auto mb-1" />
            <div className="text-lg font-semibold">{matchUsage.usedThisWeek}</div>
            <div className="text-xs text-gray-600">This week</div>
          </div>
          <div className="p-3 bg-white rounded-lg">
            <Star className="w-5 h-5 text-yellow-500 mx-auto mb-1" />
            <div className="text-lg font-semibold">{matchUsage.totalUsed}</div>
            <div className="text-xs text-gray-600">Total matches</div>
          </div>
          <div className="p-3 bg-white rounded-lg">
            <Clock className="w-5 h-5 text-green-500 mx-auto mb-1" />
            <div className="text-lg font-semibold">{matchUsage.averagePerWeek.toFixed(1)}</div>
            <div className="text-xs text-gray-600">Per week</div>
          </div>
        </div>

        {/* Upgrade Options */}
        <div className="space-y-3">
          <h4 className="font-semibold text-gray-800 text-center mb-4">
            Choose Your Upgrade Plan
          </h4>
          
          {tiers.map((tier) => (
            <Card 
              key={tier.id}
              className={`cursor-pointer transition-all hover:shadow-md ${
                tier.popular ? 'border-rose-500 bg-rose-50' : 'border-gray-200'
              }`}
              onClick={() => onUpgrade(tier.id)}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h5 className="font-semibold text-gray-800">{tier.name}</h5>
                      {tier.popular && (
                        <Badge className="bg-rose-500 text-white">
                          <Sparkles className="w-3 h-3 mr-1" />
                          Recommended
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{tier.description}</p>
                    
                    {/* Benefits */}
                    <div className="space-y-1">
                      {getTierBenefits(tier.id).slice(0, 3).map((benefit, index) => (
                        <div key={index} className="flex items-center gap-2 text-xs text-gray-600">
                          <CheckCircle className="w-3 h-3 text-green-500" />
                          <span>{benefit}</span>
                        </div>
                      ))}
                    </div>
                    
                    {tier.savings && (
                      <Badge variant="outline" className="mt-2 text-green-600 border-green-600">
                        {tier.savings}
                      </Badge>
                    )}
                  </div>
                  
                  <div className="text-right ml-4">
                    <div className="text-xl font-bold text-gray-800">{tier.price}</div>
                    <Button 
                      size="sm"
                      className={tier.popular ? "bg-rose-500 hover:bg-rose-600" : ""}
                    >
                      <ArrowRight className="w-4 h-4 ml-1" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Footer Message */}
        <div className="text-center text-sm text-gray-600 pt-4 border-t border-gray-200">
          <p>Join thousands of users who've upgraded for unlimited foundation matching</p>
        </div>
      </CardContent>
    </Card>
  );
};

export default UpgradePrompt;