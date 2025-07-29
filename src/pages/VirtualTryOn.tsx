import React, { useState } from 'react';
import Header from '../components/Header';
import VirtualTryOn from '../components/VirtualTryOn';
import EnhancedProductRecommendations from '../components/EnhancedProductRecommendations';
import SkinToneAnalysisDisplay from '../components/SkinToneAnalysisDisplay';
import UpgradePrompt from '../components/UpgradePrompt';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Camera, Upload, Zap, Crown, CreditCard } from 'lucide-react';
import AuthGuard from '../components/AuthGuard';
import { Toaster } from '@/components/ui/toaster';
import { useSubscription } from '@/hooks/useSubscription';
import { useMatchTracking } from '@/hooks/useMatchTracking';
import { useNavigate } from 'react-router-dom';
import { FoundationMatch } from '../types/foundation';
import { useToast } from '@/hooks/use-toast';

const VirtualTryOnPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const subscription = useSubscription();
  const { matchUsage, recordMatch } = useMatchTracking();
  
  const [recommendations, setRecommendations] = useState<{
    shade: FoundationMatch;
    confidence: number;
    targetTone: 'dominant' | 'secondary';
  }[]>([]);
  const [selectedMatch, setSelectedMatch] = useState<FoundationMatch | null>(null);
  const [skinToneAnalysis, setSkinToneAnalysis] = useState<{
    dominantTone: {
      undertone: string;
      depth: string;
      confidence: number;
    };
    secondaryTone?: {
      undertone: string;
      depth: string;
      confidence: number;
    };
  } | null>(null);
  
  // Calculate match limits and usage
  const FREE_MATCH_LIMIT = 3;
  const usedMatches = matchUsage.usedToday; // For free tier, count daily usage
  const remainingMatches = subscription.isPremium ? Infinity : Math.max(0, FREE_MATCH_LIMIT - usedMatches);
  const canTryOn = subscription.isPremium || usedMatches < FREE_MATCH_LIMIT;
  
  // Determine urgency level for upgrade prompts
  const getUrgencyLevel = () => {
    if (!subscription.isPremium) {
      if (remainingMatches === 0) return 'critical';
      if (remainingMatches === 1) return 'high';
      if (remainingMatches <= 2) return 'medium';
    }
    return 'low';
  };

  const handleUpgrade = async (tier: 'one_time' | 'weekly' | 'monthly' | 'yearly') => {
    // Use existing Stripe payment URLs from landing page
    const STRIPE_PAYMENT_URLS = {
      one_time: 'https://buy.stripe.com/test_4gweVo6QR2XMgMw5kl',
      weekly: 'https://buy.stripe.com/test_6oEaFY3EFeAu4cE9AC',
      monthly: 'https://buy.stripe.com/test_cN23dwhppasmfIscMN',
      yearly: 'https://buy.stripe.com/test_5kA29s3EF5a2fIscMO',
    };
    
    const paymentUrl = STRIPE_PAYMENT_URLS[tier];
    if (paymentUrl) {
      window.open(paymentUrl, '_blank');
      toast({
        title: "Redirecting to payment",
        description: `Processing ${tier} subscription...`,
      });
    }
  };

  const handleShadeRecommendations = async (newRecommendations: typeof recommendations) => {
    try {
      // Record match usage when analysis is performed
      await recordMatch('virtual_try_on', {
        recommendations_count: newRecommendations.length,
        skin_analysis_performed: true
      });
      
      setRecommendations(newRecommendations);
      // Extract skin tone analysis from the first recommendation if available
      if (newRecommendations.length > 0) {
        // This would typically come from the actual skin analysis in VirtualTryOn
        // For now, we'll create a sample analysis based on the recommendations
        const firstShade = newRecommendations[0].shade;
        setSkinToneAnalysis({
          dominantTone: {
            undertone: firstShade.undertone,
            depth: firstShade.shade.toLowerCase().includes('fair') ? 'fair' :
                   firstShade.shade.toLowerCase().includes('light') ? 'light' :
                   firstShade.shade.toLowerCase().includes('medium') ? 'medium' :
                   firstShade.shade.toLowerCase().includes('deep') ? 'deep' : 'medium',
            confidence: 0.92
          },
          secondaryTone: newRecommendations.length > 1 ? {
            undertone: newRecommendations[1].shade.undertone,
            depth: 'medium',
            confidence: 0.75
          } : undefined
        });
      }
    } catch (error) {
      console.error('Error recording match usage:', error);
      toast({
        title: "Error",
        description: "Failed to record match usage",
        variant: "destructive"
      });
    }
  };

  const handleVirtualTryOn = (shade: FoundationMatch) => {
    setSelectedMatch(shade);
  };

  const getUserTierDisplay = () => {
    if (subscription.isPremium) {
      return subscription.subscription_tier === 'one_time' ? 'Premium' : 
             subscription.subscription_tier === 'monthly' ? 'Monthly' :
             subscription.subscription_tier === 'yearly' ? 'Yearly' : 'Premium';
    }
    return 'Free';
  };

  return (
    <AuthGuard>
      <div className="min-h-screen bg-gradient-to-br from-rose-50 via-pink-50 to-purple-50">
        <Header />
        
        <div className="py-8">
          <div className="container mx-auto px-4">
            {/* Hero Image Section */}
            <div className="relative rounded-lg overflow-hidden mb-8 max-w-4xl mx-auto">
              <img 
                src="/lovable-uploads/a68d3215-f709-4f7d-8787-82bf8d454614.png"
                alt="Virtual try-on model"
                className="w-full h-64 object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end">
                <div className="p-6 text-white">
                  <h1 className="text-4xl font-bold mb-2">Virtual Foundation Try-On</h1>
                  <p className="text-lg text-gray-200">
                    See how different foundations look on you before you buy
                  </p>
                </div>
              </div>
            </div>
            
            <div className="text-center mb-8">
              {/* Usage Tracker */}
              <div className="inline-flex items-center gap-3 bg-white rounded-full px-6 py-3 shadow-lg">
                <Badge variant={!subscription.isPremium ? 'secondary' : 'default'} className="capitalize">
                  {subscription.isPremium ? (
                    <>
                      <Crown className="w-4 h-4 mr-1" />
                      {getUserTierDisplay()}
                    </>
                  ) : (
                    'Free'
                  )}
                </Badge>
                <span className="text-sm text-gray-600">
                  {subscription.isPremium ? 'Unlimited' : `${remainingMatches} of ${FREE_MATCH_LIMIT}`} matches remaining
                  {!subscription.isPremium && ` today`}
                </span>
                {matchUsage.loading && (
                  <div className="w-4 h-4 border-2 border-gray-300 border-t-rose-500 rounded-full animate-spin"></div>
                )}
              </div>
            </div>

            {canTryOn ? (
              <>
                {/* Show upgrade prompt for non-premium users who are running low on matches */}
                {!subscription.isPremium && getUrgencyLevel() !== 'low' && (
                  <div className="mb-8">
                    <UpgradePrompt
                      matchUsage={matchUsage}
                      remainingMatches={remainingMatches}
                      maxMatches={FREE_MATCH_LIMIT}
                      onUpgrade={handleUpgrade}
                      urgencyLevel={getUrgencyLevel()}
                    />
                  </div>
                )}

                {/* Virtual Try-On Component */}
                <div className="grid lg:grid-cols-3 gap-8">
                  <div className="lg:col-span-1">
                    <VirtualTryOn 
                      selectedMatch={selectedMatch} 
                      onShadeRecommendations={handleShadeRecommendations}
                    />
                  </div>
                  
                  {/* Enhanced Product Recommendations */}
                  <div className="lg:col-span-2 space-y-8">
                    {/* Skin Tone Analysis */}
                    {skinToneAnalysis && (
                      <SkinToneAnalysisDisplay analysis={{
                        faceRegions: [],
                        dominantTone: {
                          hexColor: '#E8C5A0',
                          undertone: skinToneAnalysis.dominantTone.undertone,
                          depthLevel: skinToneAnalysis.dominantTone.depth === 'fair' ? 2 : 
                                    skinToneAnalysis.dominantTone.depth === 'light' ? 4 :
                                    skinToneAnalysis.dominantTone.depth === 'medium' ? 6 : 8,
                          confidence: skinToneAnalysis.dominantTone.confidence
                        },
                        secondaryTone: skinToneAnalysis.secondaryTone ? {
                          hexColor: '#D4B896',
                          undertone: skinToneAnalysis.secondaryTone.undertone,
                          depthLevel: 6,
                          confidence: skinToneAnalysis.secondaryTone.confidence
                        } : {
                          hexColor: '#D4B896',
                          undertone: 'neutral',
                          depthLevel: 6,
                          confidence: 0.7
                        },
                        overallConfidence: skinToneAnalysis.dominantTone.confidence
                      }} />
                    )}
                    
                    {/* Product Recommendations */}
                    {recommendations.length > 0 && (
                      <EnhancedProductRecommendations 
                        recommendations={recommendations}
                        onVirtualTryOn={handleVirtualTryOn}
                      />
                    )}
                  </div>
                </div>
              </>
            ) : (
              /* Upgrade Prompt */
              <div className="text-center py-16">
                <div className="max-w-md mx-auto">
                  <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Zap className="h-10 w-10 text-gray-400" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-800 mb-4">
                    You've Used All Your Try-Ons
                  </h3>
                  <p className="text-gray-600 mb-8">
                    Upgrade your plan to continue using virtual try-on and get more matches.
                  </p>
                  
                  {/* Upgrade Options */}
                  <div className="space-y-4">
                    <Button 
                      size="lg" 
                      className="w-full"
                      onClick={() => navigate('/subscription')}
                    >
                      <CreditCard className="w-5 h-5 mr-2" />
                      View Subscription Plans
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
        
        <Toaster />
      </div>
    </AuthGuard>
  );
};

export default VirtualTryOnPage;