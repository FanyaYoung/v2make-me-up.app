import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Info, Eye, EyeOff } from 'lucide-react';

interface FaceOverlayProps {
  showOverlay?: boolean;
  onToggleOverlay?: (show: boolean) => void;
  primaryColor?: string;
  contourColor?: string;
}

const FaceOverlay = ({ 
  showOverlay = true, 
  onToggleOverlay, 
  primaryColor = '#E8C2A0',
  contourColor = '#D4A574' 
}: FaceOverlayProps) => {
  const [overlayVisible, setOverlayVisible] = useState(showOverlay);

  const handleToggle = () => {
    const newState = !overlayVisible;
    setOverlayVisible(newState);
    onToggleOverlay?.(newState);
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Face Application Guide</CardTitle>
          <Button 
            onClick={handleToggle}
            variant="outline" 
            size="sm"
            className="flex items-center gap-2"
          >
            {overlayVisible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            {overlayVisible ? 'Hide' : 'Show'} Guide
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Face Diagram */}
        <div className="relative w-full h-80 mx-auto">
          <svg
            viewBox="0 0 200 260" 
            className="w-full h-full"
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* Face outline */}
            <ellipse
              cx="100"
              cy="130"
              rx="70"
              ry="90"
              fill="#F5F1EB"
              stroke="#E5E1DB"
              strokeWidth="2"
            />
            
            {/* Jawline */}
            <path
              d="M 40 160 Q 50 200 100 210 Q 150 200 160 160"
              fill="none"
              stroke="#E5E1DB"
              strokeWidth="2"
            />
            
            {overlayVisible && (
              <>
                {/* Primary application area (center face) */}
                <ellipse
                  cx="100"
                  cy="120"
                  rx="45"
                  ry="55"
                  fill={primaryColor}
                  fillOpacity="0.6"
                  stroke={primaryColor}
                  strokeWidth="2"
                  strokeDasharray="4,4"
                />
                
                {/* Contour areas (perimeter and jawline) */}
                {/* Forehead contour */}
                <ellipse
                  cx="100"
                  cy="75"
                  rx="55"
                  ry="15"
                  fill={contourColor}
                  fillOpacity="0.4"
                  stroke={contourColor}
                  strokeWidth="2"
                  strokeDasharray="4,4"
                />
                
                {/* Left side contour */}
                <ellipse
                  cx="50"
                  cy="130"
                  rx="12"
                  ry="40"
                  fill={contourColor}
                  fillOpacity="0.4"
                  stroke={contourColor}
                  strokeWidth="2"
                  strokeDasharray="4,4"
                />
                
                {/* Right side contour */}
                <ellipse
                  cx="150"
                  cy="130"
                  rx="12"
                  ry="40"
                  fill={contourColor}
                  fillOpacity="0.4"
                  stroke={contourColor}
                  strokeWidth="2"
                  strokeDasharray="4,4"
                />
                
                {/* Jawline contour */}
                <ellipse
                  cx="100"
                  cy="190"
                  rx="50"
                  ry="20"
                  fill={contourColor}
                  fillOpacity="0.4"
                  stroke={contourColor}
                  strokeWidth="2"
                  strokeDasharray="4,4"
                />
                
                {/* Eyes (for reference) */}
                <circle cx="80" cy="110" r="3" fill="#8B7355" />
                <circle cx="120" cy="110" r="3" fill="#8B7355" />
                
                {/* Nose (for reference) */}
                <ellipse cx="100" cy="125" rx="4" ry="8" fill="#E5E1DB" />
                
                {/* Mouth (for reference) */}
                <ellipse cx="100" cy="150" rx="8" ry="3" fill="#D4A574" />
              </>
            )}
          </svg>
        </div>

        {/* Legend */}
        {overlayVisible && (
          <div className="space-y-3">
            <div className="flex items-center gap-3 p-3 bg-rose-50 rounded-lg">
              <div 
                className="w-6 h-6 rounded border-2 border-dashed"
                style={{ backgroundColor: primaryColor, borderColor: primaryColor }}
              />
              <div className="text-sm">
                <p className="font-medium text-rose-900">Primary Foundation</p>
                <p className="text-rose-700">Center face, under eyes, nose, chin</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3 p-3 bg-amber-50 rounded-lg">
              <div 
                className="w-6 h-6 rounded border-2 border-dashed"
                style={{ backgroundColor: contourColor, borderColor: contourColor }}
              />
              <div className="text-sm">
                <p className="font-medium text-amber-900">Concealer/Contour</p>
                <p className="text-amber-700">Temples, sides of face, jawline</p>
              </div>
            </div>
          </div>
        )}

        {/* Tips */}
        <div className="bg-blue-50 p-3 rounded-lg">
          <div className="flex items-start gap-2">
            <Info className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
            <div className="text-sm">
              <p className="font-medium text-blue-900 mb-1">Application Tips</p>
              <ul className="text-blue-800 space-y-1 text-xs">
                <li>• Use your primary foundation for the center of your face</li>
                <li>• Apply concealer to perimeter areas for seamless blending</li>
                <li>• Blend outwards from center for natural coverage</li>
                <li>• Use a damp beauty sponge for best results</li>
              </ul>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default FaceOverlay;