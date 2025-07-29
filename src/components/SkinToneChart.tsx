import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface SkinTone {
  depth: number;
  name: string;
  color: string;
  undertones: Array<{
    type: 'cool' | 'neutral' | 'warm' | 'olive';
    color: string;
    description: string;
  }>;
}

const skinTones: SkinTone[] = [
  {
    depth: 1,
    name: "Porcelain",
    color: "#F7E7D7",
    undertones: [
      { type: 'cool', color: '#F5E0D0', description: 'Pink undertones' },
      { type: 'neutral', color: '#F6E3D3', description: 'Balanced undertones' },
      { type: 'warm', color: '#F8E8D8', description: 'Yellow undertones' }
    ]
  },
  {
    depth: 2,
    name: "Fair",
    color: "#F2DCC4",
    undertones: [
      { type: 'cool', color: '#F0D5BE', description: 'Pink undertones' },
      { type: 'neutral', color: '#F1D8C1', description: 'Balanced undertones' },
      { type: 'warm', color: '#F3DFC7', description: 'Yellow undertones' }
    ]
  },
  {
    depth: 3,
    name: "Light",
    color: "#EBDCC6",
    undertones: [
      { type: 'cool', color: '#E7D5BC', description: 'Pink undertones' },
      { type: 'neutral', color: '#E9D8C1', description: 'Balanced undertones' },
      { type: 'warm', color: '#EDDFCA', description: 'Yellow undertones' },
      { type: 'olive', color: '#E6D7BE', description: 'Green undertones' }
    ]
  },
  {
    depth: 4,
    name: "Light Medium",
    color: "#E0D1B7",
    undertones: [
      { type: 'cool', color: '#DBC8A8', description: 'Pink undertones' },
      { type: 'neutral', color: '#DDCDAF', description: 'Balanced undertones' },
      { type: 'warm', color: '#E3D5BD', description: 'Yellow undertones' },
      { type: 'olive', color: '#D9CAA6', description: 'Green undertones' }
    ]
  },
  {
    depth: 5,
    name: "Medium",
    color: "#D4A574",
    undertones: [
      { type: 'cool', color: '#CC9A68', description: 'Pink undertones' },
      { type: 'neutral', color: '#D09F6E', description: 'Balanced undertones' },
      { type: 'warm', color: '#D8AB7A', description: 'Yellow undertones' },
      { type: 'olive', color: '#CA9866', description: 'Green undertones' }
    ]
  },
  {
    depth: 6,
    name: "Medium Deep",
    color: "#C1AF93",
    undertones: [
      { type: 'cool', color: '#B7A085', description: 'Pink undertones' },
      { type: 'neutral', color: '#BCA58C', description: 'Balanced undertones' },
      { type: 'warm', color: '#C5B499', description: 'Yellow undertones' },
      { type: 'olive', color: '#B59E83', description: 'Green undertones' }
    ]
  },
  {
    depth: 7,
    name: "Deep",
    color: "#A0835C",
    undertones: [
      { type: 'cool', color: '#967750', description: 'Pink undertones' },
      { type: 'neutral', color: '#9B7D56', description: 'Balanced undertones' },
      { type: 'warm', color: '#A48962', description: 'Yellow undertones' },
      { type: 'olive', color: '#94754E', description: 'Green undertones' }
    ]
  },
  {
    depth: 8,
    name: "Very Deep",
    color: "#8D7B5F",
    undertones: [
      { type: 'cool', color: '#806B4F', description: 'Pink undertones' },
      { type: 'neutral', color: '#867155', description: 'Balanced undertones' },
      { type: 'warm', color: '#948165', description: 'Yellow undertones' },
      { type: 'olive', color: '#7E694D', description: 'Green undertones' }
    ]
  }
];

const SkinToneChart: React.FC = () => {
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-2xl font-bold bg-gradient-to-r from-rose-600 via-pink-600 to-purple-600 bg-clip-text text-transparent">
          Skin Tone Reference Chart
        </CardTitle>
        <p className="text-muted-foreground">
          Understanding skin depth and undertones for accurate foundation matching
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-4">
          {skinTones.map((tone) => (
            <div key={tone.depth} className="space-y-3">
              <div className="flex items-center gap-3">
                <div 
                  className="w-8 h-8 rounded-full border-2 border-border shadow-sm"
                  style={{ backgroundColor: tone.color }}
                />
                <div>
                  <h3 className="font-semibold text-lg">{tone.name}</h3>
                  <Badge variant="secondary" className="text-xs">
                    Depth Level {tone.depth}
                  </Badge>
                </div>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 ml-11">
                {tone.undertones.map((undertone) => (
                  <div 
                    key={undertone.type}
                    className="flex items-center gap-2 p-2 rounded-lg bg-muted/50 hover:bg-muted/70 transition-colors"
                  >
                    <div 
                      className="w-4 h-4 rounded-full border border-border/50"
                      style={{ backgroundColor: undertone.color }}
                    />
                    <div className="text-sm">
                      <div className="font-medium capitalize">{undertone.type}</div>
                      <div className="text-xs text-muted-foreground">{undertone.description}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
        
        <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20 rounded-lg border">
          <h4 className="font-semibold text-blue-800 dark:text-blue-300 mb-2">
            💡 Matching Guidelines
          </h4>
          <ul className="text-sm text-blue-700 dark:text-blue-400 space-y-1">
            <li>• Recommendations should stay within ±1 depth level for consistency</li>
            <li>• Undertones should complement each other (warm with warm, cool with cool)</li>
            <li>• Neutral undertones work well with any undertone type</li>
            <li>• Consider your environment lighting when selecting shades</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};

export default SkinToneChart;