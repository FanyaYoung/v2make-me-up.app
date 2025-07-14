import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, Crown, Home } from 'lucide-react';
import { useSubscription } from '@/hooks/useSubscription';

export default function SubscriptionSuccess() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const tier = searchParams.get('tier');
  const subscription = useSubscription();

  useEffect(() => {
    // Refresh subscription status after successful payment
    subscription.checkSubscription();
  }, []);

  const getTierInfo = () => {
    switch (tier) {
      case 'one_time':
        return { name: 'One-Time Access', price: '$8', description: 'Lifetime premium access' };
      case 'monthly':
        return { name: 'Monthly Premium', price: '$10/month', description: 'Monthly subscription' };
      case 'yearly':
        return { name: 'Yearly Premium', price: '$100/year', description: 'Annual subscription' };
      default:
        return { name: 'Premium', price: '', description: 'Premium access' };
    }
  };

  const tierInfo = getTierInfo();

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50 flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
          <CardTitle className="text-2xl">Payment Successful!</CardTitle>
          <CardDescription>
            Welcome to {tierInfo.name}
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Crown className="h-5 w-5 text-primary" />
              <span className="font-medium">{tierInfo.name}</span>
            </div>
            <p className="text-sm text-muted-foreground">{tierInfo.description}</p>
            {tierInfo.price && (
              <p className="text-lg font-bold text-primary mt-2">{tierInfo.price}</p>
            )}
          </div>

          <div className="bg-muted/50 rounded-lg p-4">
            <h4 className="font-medium mb-2">What's included:</h4>
            <ul className="text-sm space-y-1 text-muted-foreground">
              <li>• Unlimited foundation matches</li>
              <li>• Advanced skin analysis</li>
              <li>• Premium recommendations</li>
              <li>• Virtual try-on features</li>
              {(tier === 'monthly' || tier === 'yearly') && (
                <li>• Priority customer support</li>
              )}
            </ul>
          </div>

          <div className="space-y-3">
            <Button 
              onClick={() => navigate('/virtual-try-on')} 
              className="w-full"
            >
              Start Using Premium Features
            </Button>
            <Button 
              onClick={() => navigate('/')} 
              variant="outline" 
              className="w-full"
            >
              <Home className="h-4 w-4 mr-2" />
              Go to Home
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}