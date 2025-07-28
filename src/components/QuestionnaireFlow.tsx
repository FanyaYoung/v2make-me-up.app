import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ChevronRight, ChevronLeft } from 'lucide-react';

interface QuestionnaireFlowProps {
  onComplete: (answers: {
    hairColor: string;
    eyeColor: string;
    skinType: string;
    preferredCoverage: string;
    preferredFinish: string;
  }) => void;
  onClose: () => void;
}

const QuestionnaireFlow = ({ onComplete, onClose }: QuestionnaireFlowProps) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState({
    hairColor: '',
    eyeColor: '',
    skinType: '',
    preferredCoverage: '',
    preferredFinish: ''
  });

  const questions = [
    {
      id: 'hairColor',
      title: 'What is your natural hair color?',
      options: [
        { value: 'black', label: 'Black', color: '#1a1a1a' },
        { value: 'brown', label: 'Brown', color: '#8B4513' },
        { value: 'blonde', label: 'Blonde', color: '#F5DEB3' },
        { value: 'red', label: 'Red/Auburn', color: '#A0522D' },
        { value: 'gray', label: 'Gray/Silver', color: '#C0C0C0' },
        { value: 'other', label: 'Other/Dyed', color: '#9B59B6' }
      ]
    },
    {
      id: 'eyeColor',
      title: 'What is your eye color?',
      options: [
        { value: 'brown', label: 'Brown', color: '#8B4513' },
        { value: 'hazel', label: 'Hazel', color: '#DAA520' },
        { value: 'green', label: 'Green', color: '#228B22' },
        { value: 'blue', label: 'Blue', color: '#4169E1' },
        { value: 'gray', label: 'Gray', color: '#708090' },
        { value: 'amber', label: 'Amber', color: '#FFBF00' }
      ]
    },
    {
      id: 'skinType',
      title: 'How would you describe your skin type?',
      options: [
        { value: 'oily', label: 'Oily', description: 'Shiny, prone to breakouts' },
        { value: 'dry', label: 'Dry', description: 'Tight, flaky, needs moisture' },
        { value: 'combination', label: 'Combination', description: 'Oily T-zone, dry cheeks' },
        { value: 'normal', label: 'Normal', description: 'Balanced, rarely breaks out' },
        { value: 'sensitive', label: 'Sensitive', description: 'Easily irritated, reactive' }
      ]
    },
    {
      id: 'preferredCoverage',
      title: 'What coverage do you prefer?',
      options: [
        { value: 'light', label: 'Light', description: 'Natural, lets skin show through' },
        { value: 'medium', label: 'Medium', description: 'Balanced coverage for most flaws' },
        { value: 'full', label: 'Full', description: 'Complete coverage, flawless finish' },
        { value: 'buildable', label: 'Buildable', description: 'Customizable from light to full' }
      ]
    },
    {
      id: 'preferredFinish',
      title: 'What finish do you prefer?',
      options: [
        { value: 'matte', label: 'Matte', description: 'No shine, controls oil' },
        { value: 'satin', label: 'Satin', description: 'Soft, subtle glow' },
        { value: 'dewy', label: 'Dewy', description: 'Hydrated, glowing look' },
        { value: 'natural', label: 'Natural', description: 'Skin-like finish' },
        { value: 'radiant', label: 'Radiant', description: 'Luminous, healthy glow' }
      ]
    }
  ];

  const currentQuestion = questions[currentStep];

  const handleAnswerSelect = (value: string) => {
    const newAnswers = { ...answers, [currentQuestion.id]: value };
    setAnswers(newAnswers);
    
    if (currentStep < questions.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onComplete(newAnswers);
      onClose();
    }
  };

  const goBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center">
            Color Profile Quiz
          </DialogTitle>
          <div className="flex justify-center gap-2 mt-4">
            {questions.map((_, index) => (
              <div
                key={index}
                className={`w-2 h-2 rounded-full ${
                  index <= currentStep ? 'bg-primary' : 'bg-muted'
                }`}
              />
            ))}
          </div>
        </DialogHeader>

        <div className="space-y-6">
          <div className="text-center">
            <h3 className="text-lg font-semibold mb-2">
              {currentQuestion.title}
            </h3>
            <p className="text-sm text-muted-foreground">
              Step {currentStep + 1} of {questions.length}
            </p>
          </div>

          <div className="grid gap-3">
            {currentQuestion.options.map((option) => (
              <Card
                key={option.value}
                className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => handleAnswerSelect(option.value)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    {option.color && (
                      <div
                        className="w-6 h-6 rounded-full border-2 border-gray-200"
                        style={{ backgroundColor: option.color }}
                      />
                    )}
                    <div className="flex-1">
                      <div className="font-medium">{option.label}</div>
                      {option.description && (
                        <div className="text-sm text-muted-foreground">
                          {option.description}
                        </div>
                      )}
                    </div>
                    <ChevronRight className="w-4 h-4 text-muted-foreground" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {currentStep > 0 && (
            <Button 
              variant="outline" 
              onClick={goBack}
              className="w-full flex items-center gap-2"
            >
              <ChevronLeft className="w-4 h-4" />
              Previous Question
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default QuestionnaireFlow;