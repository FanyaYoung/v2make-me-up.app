import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ThumbsUp, ThumbsDown, MessageSquare } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { FoundationMatch } from '@/types/foundation';

interface FoundationFeedbackProps {
  foundation: FoundationMatch;
  onFeedback: (foundationId: string, feedback: {
    rating: 'positive' | 'negative';
    comment?: string;
  }) => void;
}

const FoundationFeedback = ({ foundation, onFeedback }: FoundationFeedbackProps) => {
  const [selectedFeedback, setSelectedFeedback] = useState<'positive' | 'negative' | null>(null);
  const [showComment, setShowComment] = useState(false);
  const [comment, setComment] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleFeedbackSelect = (feedback: 'positive' | 'negative') => {
    setSelectedFeedback(feedback);
    setShowComment(true);
  };

  const handleSubmitFeedback = () => {
    if (selectedFeedback) {
      onFeedback(foundation.id, {
        rating: selectedFeedback,
        comment: comment.trim() || undefined
      });
      setSubmitted(true);
    }
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

        {showComment && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <MessageSquare className="w-4 h-4" />
              <span>Tell us more (optional):</span>
            </div>
            <Textarea
              placeholder="What worked well or didn't work about this recommendation?"
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
              >
                Submit Feedback
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setShowComment(false);
                  setSelectedFeedback(null);
                  setComment('');
                }}
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

export default FoundationFeedback;