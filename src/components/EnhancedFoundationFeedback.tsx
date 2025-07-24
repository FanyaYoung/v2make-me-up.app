import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ThumbsUp, ThumbsDown, MessageSquare } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { FoundationMatch, FEEDBACK_CATEGORIES, FeedbackCategory } from '@/types/foundation';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface EnhancedFoundationFeedbackProps {
  foundation: FoundationMatch;
  onFeedback: (foundationId: string, feedback: {
    rating: 'positive' | 'negative';
    comment?: string;
    category?: string;
    feedbackType?: string;
  }) => void;
}

const EnhancedFoundationFeedback = ({ foundation, onFeedback }: EnhancedFoundationFeedbackProps) => {
  const [selectedFeedback, setSelectedFeedback] = useState<'positive' | 'negative' | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [showCategories, setShowCategories] = useState(false);
  const [showComment, setShowComment] = useState(false);
  const [comment, setComment] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleFeedbackSelect = (feedback: 'positive' | 'negative') => {
    setSelectedFeedback(feedback);
    if (feedback === 'negative') {
      setShowCategories(true);
    } else {
      setShowComment(true);
    }
  };

  const handleCategorySelect = (categoryId: string) => {
    setSelectedCategory(categoryId);
    setShowComment(true);
  };

  const handleSubmitFeedback = async () => {
    if (!selectedFeedback) return;

    setIsSubmitting(true);
    
    try {
      const category = FEEDBACK_CATEGORIES.find(cat => cat.id === selectedCategory);
      
      // Store in database
      const { error } = await supabase
        .from('foundation_feedback')
        .insert({
          foundation_id: foundation.id,
          feedback_type: category?.type || 'other',
          feedback_category: selectedCategory,
          comment: comment.trim() || null,
          rating: selectedFeedback
        });

      if (error) {
        console.error('Error storing feedback:', error);
        toast({
          title: "Error",
          description: "Failed to store feedback. Please try again.",
          variant: "destructive"
        });
        return;
      }

      // Call parent callback
      onFeedback(foundation.id, {
        rating: selectedFeedback,
        comment: comment.trim() || undefined,
        category: selectedCategory || undefined,
        feedbackType: category?.type || 'other'
      });

      setSubmitted(true);
      toast({
        title: "Thank you!",
        description: "Your feedback helps us improve our recommendations.",
      });
    } catch (error) {
      console.error('Error submitting feedback:', error);
      toast({
        title: "Error",
        description: "Failed to submit feedback. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetFeedback = () => {
    setSelectedFeedback(null);
    setSelectedCategory(null);
    setShowCategories(false);
    setShowComment(false);
    setComment('');
  };

  if (submitted) {
    return (
      <Card className="border-green-200 bg-green-50">
        <CardContent className="p-3">
          <div className="flex items-center gap-2 text-green-700">
            <ThumbsUp className="w-4 h-4" />
            <span className="text-sm font-medium">Thank you for your feedback!</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  const filteredCategories = selectedFeedback === 'negative' 
    ? FEEDBACK_CATEGORIES 
    : [];

  return (
    <Card className="border-gray-200">
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-700">
            How well does this match work for you?
          </span>
          <div className="flex gap-2">
            <Button
              variant={selectedFeedback === 'positive' ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleFeedbackSelect('positive')}
              className={selectedFeedback === 'positive' ? 'bg-green-600 hover:bg-green-700' : ''}
            >
              <ThumbsUp className="w-4 h-4" />
            </Button>
            <Button
              variant={selectedFeedback === 'negative' ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleFeedbackSelect('negative')}
              className={selectedFeedback === 'negative' ? 'bg-red-600 hover:bg-red-700' : ''}
            >
              <ThumbsDown className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {showCategories && selectedFeedback === 'negative' && (
          <div className="space-y-3">
            <div className="text-sm text-gray-600">
              What's the issue with this recommendation?
            </div>
            <div className="flex flex-wrap gap-2">
              {filteredCategories.map((category) => (
                <Badge
                  key={category.id}
                  variant={selectedCategory === category.id ? 'default' : 'outline'}
                  className={`cursor-pointer transition-colors ${
                    selectedCategory === category.id 
                      ? 'bg-primary text-primary-foreground' 
                      : 'hover:bg-muted'
                  }`}
                  onClick={() => handleCategorySelect(category.id)}
                >
                  {category.label}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {showComment && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <MessageSquare className="w-4 h-4" />
              <span>Additional comments (optional):</span>
            </div>
            <Textarea
              placeholder="Tell us more about your experience with this recommendation..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="text-sm"
              rows={2}
            />
            <div className="flex gap-2">
              <Button
                onClick={handleSubmitFeedback}
                size="sm"
                className="flex-1"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Submitting...' : 'Submit Feedback'}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={resetFeedback}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default EnhancedFoundationFeedback;