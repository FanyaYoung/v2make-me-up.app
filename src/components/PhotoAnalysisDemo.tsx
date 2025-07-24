import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Camera, CheckCircle, XCircle, Lightbulb } from 'lucide-react';

const PhotoAnalysisDemo = () => {
  const goodPractices = [
    {
      icon: <CheckCircle className="w-5 h-5 text-green-500" />,
      title: "Good Lighting",
      description: "Natural daylight or bright, even indoor lighting"
    },
    {
      icon: <CheckCircle className="w-5 h-5 text-green-500" />,
      title: "Clean Face",
      description: "Remove all makeup for accurate skin tone analysis"
    },
    {
      icon: <CheckCircle className="w-5 h-5 text-green-500" />,
      title: "Direct Angle",
      description: "Face the camera straight on, looking directly at lens"
    },
    {
      icon: <CheckCircle className="w-5 h-5 text-green-500" />,
      title: "Close Distance",
      description: "Get close enough so your face fills most of the frame"
    }
  ];

  const badPractices = [
    {
      icon: <XCircle className="w-5 h-5 text-red-500" />,
      title: "Poor Lighting",
      description: "Avoid shadows, yellow bulbs, or very dim lighting"
    },
    {
      icon: <XCircle className="w-5 h-5 text-red-500" />,
      title: "Makeup On",
      description: "Foundation or filters will affect color analysis"
    },
    {
      icon: <XCircle className="w-5 h-5 text-red-500" />,
      title: "Side Angles",
      description: "Profile shots don't capture undertones properly"
    },
    {
      icon: <XCircle className="w-5 h-5 text-red-500" />,
      title: "Too Far Away",
      description: "Face should be the main focus of the photo"
    }
  ];

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white px-4 py-2 rounded-full mb-4">
          <Camera className="w-5 h-5" />
          <span className="font-semibold">Photo Analysis Demo</span>
        </div>
        <h2 className="text-2xl font-bold mb-2">How to Take the Perfect Analysis Photo</h2>
        <p className="text-muted-foreground">Follow these guidelines for the most accurate skin tone analysis</p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Good Practices */}
        <Card className="border-green-200">
          <CardHeader className="bg-green-50">
            <CardTitle className="text-green-800 flex items-center gap-2">
              <CheckCircle className="w-5 h-5" />
              Best Practices
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 space-y-4">
            {goodPractices.map((practice, index) => (
              <div key={index} className="flex items-start gap-3">
                {practice.icon}
                <div>
                  <h4 className="font-medium text-green-800">{practice.title}</h4>
                  <p className="text-sm text-green-600">{practice.description}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Bad Practices */}
        <Card className="border-red-200">
          <CardHeader className="bg-red-50">
            <CardTitle className="text-red-800 flex items-center gap-2">
              <XCircle className="w-5 h-5" />
              Avoid These
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 space-y-4">
            {badPractices.map((practice, index) => (
              <div key={index} className="flex items-start gap-3">
                {practice.icon}
                <div>
                  <h4 className="font-medium text-red-800">{practice.title}</h4>
                  <p className="text-sm text-red-600">{practice.description}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Pro Tip */}
      <Card className="bg-gradient-to-r from-amber-50 to-orange-50 border-amber-200">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Lightbulb className="w-5 h-5 text-amber-600 mt-0.5" />
            <div>
              <h4 className="font-medium text-amber-800">Pro Tip</h4>
              <p className="text-sm text-amber-700">
                Take multiple photos in different lighting conditions. Our AI will automatically select the best one for analysis.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PhotoAnalysisDemo;