
import React from 'react';
import { Card } from '@/components/ui/card';

const FoundationVisual = () => {
  // Sample foundation shades data for visualization
  const foundationShades = [
    { name: 'Fair Light', color: '#F4D5B4', brand: 'Brand A' },
    { name: 'Light Medium', color: '#E8C2A0', brand: 'Brand B' },
    { name: 'Medium', color: '#D2AD86', brand: 'Brand C' },
    { name: 'Medium Deep', color: '#B5967A', brand: 'Brand D' },
    { name: 'Deep', color: '#8B6F56', brand: 'Brand E' },
    { name: 'Very Deep', color: '#6B4F3A', brand: 'Brand F' },
  ];

  const matchingPairs = [
    { original: foundationShades[1], matches: [foundationShades[0], foundationShades[2]] },
    { original: foundationShades[3], matches: [foundationShades[2], foundationShades[4]] },
  ];

  return (
    <section className="py-16 bg-white">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold mb-4 bg-gradient-to-r from-rose-600 to-purple-600 bg-clip-text text-transparent">
            See Foundation Matching in Action
          </h2>
          <p className="text-gray-600 text-lg max-w-2xl mx-auto">
            Our AI analyzes undertones, depth, and color properties to find your perfect matches across all major brands
          </p>
        </div>

        {/* Matching Examples */}
        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto mb-16">
          {matchingPairs.map((pair, pairIndex) => (
            <Card key={pairIndex} className="p-6 bg-gradient-to-br from-rose-50 to-purple-50 border-rose-200">
              <div className="text-center mb-4">
                <h4 className="text-lg font-semibold text-gray-800 mb-2">
                  Your skin tone
                </h4>
                <div className="flex justify-center items-center mb-4">
                  <div
                    className="w-20 h-20 rounded-full shadow-lg border-3 border-white"
                    style={{ backgroundColor: pair.original.color }}
                  ></div>
                </div>
                <p className="font-medium text-gray-700">{pair.original.name}</p>
                <p className="text-sm text-gray-600">{pair.original.brand}</p>
              </div>

              <div className="text-center">
                <div className="w-12 h-0.5 bg-gradient-to-r from-rose-400 to-purple-400 mx-auto mb-4"></div>
                <h5 className="text-md font-semibold text-gray-800 mb-4">
                  Perfect Matches Found
                </h5>
                <div className="flex justify-center space-x-6">
                  {pair.matches.map((match, matchIndex) => (
                    <div key={matchIndex} className="text-center">
                      <div
                        className="w-16 h-16 rounded-full shadow-md border-2 border-white mx-auto mb-2"
                        style={{ backgroundColor: match.color }}
                      ></div>
                      <p className="text-xs font-medium text-gray-700">{match.name}</p>
                      <p className="text-xs text-gray-500">{match.brand}</p>
                      <div className="mt-1">
                        <span className="inline-block bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                          {95 - matchIndex * 2}% Match
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Interactive Demo Hint */}
        <div className="text-center">
          <div className="inline-flex items-center bg-gradient-to-r from-rose-500 to-purple-500 text-white px-6 py-3 rounded-full">
            <span className="text-sm font-medium">
              Try the foundation matcher below to see your personalized results!
            </span>
          </div>
        </div>
      </div>
    </section>
  );
};

export default FoundationVisual;
