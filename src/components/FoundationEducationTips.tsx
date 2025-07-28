import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Lightbulb, 
  Sparkles, 
  Crown, 
  ArrowRight, 
  CheckCircle,
  Palette,
  Star,
  Clock
} from 'lucide-react';
import { useSubscription } from '@/hooks/useSubscription';

interface FoundationTip {
  id: string;
  title: string;
  content: string;
  category: 'application' | 'matching' | 'technique' | 'science' | 'premium';
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  timeToRead: number; // seconds
  isPremium?: boolean;
}

interface FoundationEducationTipsProps {
  isAnalyzing: boolean;
  analysisProgress: number;
  onUpgradeClick?: () => void;
}

const FOUNDATION_TIPS: FoundationTip[] = [
  {
    id: '1',
    title: 'The Golden Rule of Foundation Matching',
    content: 'Always test foundation on your jawline, not your hand or wrist. Your face and hands often have different undertones due to sun exposure and blood circulation patterns.',
    category: 'matching',
    difficulty: 'beginner',
    timeToRead: 15
  },
  {
    id: '2',
    title: 'Understanding Undertones vs. Overtones',
    content: 'Undertones are the subtle hues beneath your skin surface (warm, cool, neutral, olive), while overtones are what you see on the surface. Great foundation matching focuses on undertones.',
    category: 'science',
    difficulty: 'intermediate',
    timeToRead: 20
  },
  {
    id: '3',
    title: 'The Triangle Application Technique',
    content: 'Apply foundation in a triangle under each eye, down the center of your nose, and on your chin. This covers all areas where you naturally have redness or discoloration.',
    category: 'application',
    difficulty: 'beginner',
    timeToRead: 18
  },
  {
    id: '4',
    title: 'Why Natural Light is Your Best Friend',
    content: 'Artificial lighting can distort how foundation looks. Always check your foundation match in natural daylight before making a final decision.',
    category: 'matching',
    difficulty: 'beginner',
    timeToRead: 12
  },
  {
    id: '5',
    title: 'The Two-Shade Strategy for Perfect Matching',
    content: 'Many professional MUAs use two shades: one that matches your face center and one slightly deeper for the perimeter. This creates natural dimension.',
    category: 'technique',
    difficulty: 'advanced',
    timeToRead: 25,
    isPremium: true
  },
  {
    id: '6',
    title: 'Seasonal Shade Adjustments',
    content: 'Your skin tone can shift slightly with the seasons. You might need a slightly different shade in winter vs. summer due to sun exposure and vitamin D levels.',
    category: 'matching',
    difficulty: 'intermediate',
    timeToRead: 22
  },
  {
    id: '7',
    title: 'The Color Science Behind Perfect Matches',
    content: 'Foundation matching uses Delta E color difference calculations. A Delta E of less than 2 is considered imperceptible to the human eye.',
    category: 'science',
    difficulty: 'advanced',
    timeToRead: 30,
    isPremium: true
  },
  {
    id: '8',
    title: 'Mixing Foundations Like a Pro',
    content: 'Mix different undertones and depths on the back of your hand first. A 70:30 ratio usually works best when combining two shades.',
    category: 'technique',
    difficulty: 'intermediate',
    timeToRead: 20,
    isPremium: true
  },
  {
    id: '9',
    title: 'Why Your Foundation Looks Different After 2 Hours',
    content: 'Foundation oxidizes as it interacts with your skin\'s natural oils and pH. This can make it appear 1-2 shades darker than initial application.',
    category: 'science',
    difficulty: 'intermediate',
    timeToRead: 18
  },
  {
    id: '10',
    title: 'The Inclusive Beauty Revolution',
    content: 'Modern shade matching considers diverse beauty standards and skin tones across all ethnicities. Inclusive brands now offer 40+ shades compared to 12 in the past.',
    category: 'science',
    difficulty: 'beginner',
    timeToRead: 15
  }
];

const CATEGORY_COLORS = {
  application: 'bg-blue-100 text-blue-800',
  matching: 'bg-green-100 text-green-800',
  technique: 'bg-purple-100 text-purple-800',
  science: 'bg-orange-100 text-orange-800',
  premium: 'bg-gradient-to-r from-yellow-400 to-orange-500 text-white'
};

const DIFFICULTY_ICONS = {
  beginner: '⭐',
  intermediate: '⭐⭐',
  advanced: '⭐⭐⭐'
};

export default function FoundationEducationTips({ 
  isAnalyzing, 
  analysisProgress,
  onUpgradeClick 
}: FoundationEducationTipsProps) {
  const [currentTipIndex, setCurrentTipIndex] = useState(0);
  const [readTips, setReadTips] = useState<Set<string>>(new Set());
  const [timeLeft, setTimeLeft] = useState(0);
  const subscription = useSubscription();
  
  const currentTip = FOUNDATION_TIPS[currentTipIndex];
  const isPremiumTip = currentTip?.isPremium;
  const canViewPremiumTips = subscription.isPremium;

  useEffect(() => {
    if (!isAnalyzing) return;

    const interval = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 0) {
          // Move to next tip
          setCurrentTipIndex(current => {
            const nextIndex = (current + 1) % FOUNDATION_TIPS.length;
            return nextIndex;
          });
          return FOUNDATION_TIPS[currentTipIndex]?.timeToRead || 15;
        }
        return prev - 1;
      });
    }, 1000);

    // Initialize timer
    if (timeLeft === 0) {
      setTimeLeft(currentTip?.timeToRead || 15);
    }

    return () => clearInterval(interval);
  }, [isAnalyzing, currentTipIndex, timeLeft, currentTip]);

  const handleTipRead = () => {
    if (currentTip) {
      setReadTips(prev => new Set([...prev, currentTip.id]));
    }
  };

  const handleNextTip = () => {
    setCurrentTipIndex(current => (current + 1) % FOUNDATION_TIPS.length);
    setTimeLeft(FOUNDATION_TIPS[(currentTipIndex + 1) % FOUNDATION_TIPS.length]?.timeToRead || 15);
  };

  const handleUpgrade = () => {
    onUpgradeClick?.();
  };

  if (!isAnalyzing || !currentTip) {
    return null;
  }

  const progressPercentage = Math.max(0, 100 - (timeLeft / currentTip.timeToRead) * 100);

  return (
    <div className="space-y-4">
      {/* Analysis Progress */}
      <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-secondary/5">
        <CardContent className="p-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="animate-spin">
              <Sparkles className="w-5 h-5 text-primary" />
            </div>
            <span className="text-sm font-medium">AI Shade Analysis in Progress...</span>
            <span className="text-xs text-muted-foreground ml-auto">
              {Math.round(analysisProgress)}%
            </span>
          </div>
          <Progress value={analysisProgress} className="h-2" />
        </CardContent>
      </Card>

      {/* Educational Tip */}
      <Card className="relative overflow-hidden">
        {isPremiumTip && !canViewPremiumTips && (
          <div className="absolute inset-0 bg-gradient-to-br from-yellow-400/20 to-orange-500/20 backdrop-blur-sm z-10 flex items-center justify-center">
            <div className="text-center p-6">
              <Crown className="w-8 h-8 text-yellow-500 mx-auto mb-2" />
              <p className="font-medium mb-3">Premium Tip</p>
              <Button onClick={handleUpgrade} size="sm" className="gap-2">
                <Sparkles className="w-4 h-4" />
                Upgrade to View
              </Button>
            </div>
          </div>
        )}
        
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <Lightbulb className="w-5 h-5 text-primary flex-shrink-0" />
              <div>
                <CardTitle className="text-base leading-tight">{currentTip.title}</CardTitle>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="outline" className={CATEGORY_COLORS[currentTip.category]}>
                    {currentTip.category}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {DIFFICULTY_ICONS[currentTip.difficulty]} {currentTip.difficulty}
                  </span>
                </div>
              </div>
            </div>
            
            {readTips.has(currentTip.id) && (
              <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
            )}
          </div>
        </CardHeader>

        <CardContent className="pt-0">
          <p className="text-sm leading-relaxed mb-4 text-muted-foreground">
            {currentTip.content}
          </p>
          
          {/* Reading Progress */}
          <div className="flex items-center justify-between text-xs text-muted-foreground mb-4">
            <div className="flex items-center gap-2">
              <Clock className="w-3 h-3" />
              <span>{timeLeft}s remaining</span>
            </div>
            <span>{currentTipIndex + 1} of {FOUNDATION_TIPS.length}</span>
          </div>
          
          <Progress value={progressPercentage} className="h-1 mb-4" />
          
          <div className="flex items-center justify-between">
            <Button
              variant="outline"
              size="sm"
              onClick={handleTipRead}
              disabled={readTips.has(currentTip.id)}
              className="gap-2"
            >
              {readTips.has(currentTip.id) ? (
                <>
                  <CheckCircle className="w-4 h-4" />
                  Read
                </>
              ) : (
                <>
                  <Star className="w-4 h-4" />
                  Mark as Read
                </>
              )}
            </Button>
            
            <Button
              size="sm"
              onClick={handleNextTip}
              className="gap-2"
            >
              Next Tip
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Reading Progress Summary */}
      <Card className="border-muted">
        <CardContent className="p-4">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <Palette className="w-4 h-4 text-primary" />
              <span>Tips Read: {readTips.size}/{FOUNDATION_TIPS.length}</span>
            </div>
            <div className="flex items-center gap-2">
              <Crown className="w-4 h-4 text-yellow-500" />
              <span>
                Premium Tips: {canViewPremiumTips ? 'Unlocked' : 'Locked'}
              </span>
            </div>
          </div>
          <Progress 
            value={(readTips.size / FOUNDATION_TIPS.length) * 100} 
            className="h-1 mt-2" 
          />
        </CardContent>
      </Card>
    </div>
  );
}