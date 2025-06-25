
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';

const ShadeComparison = () => {
  const shadeComparisons = [
    {
      originalBrand: "Fenty Beauty",
      originalShade: "220",
      matches: [
        { brand: "Charlotte Tilbury", shade: "6 Medium", image: "https://images.unsplash.com/photo-1596462502278-27bfdc403348?q=80&w=2030&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D" },
        { brand: "Rare Beauty", shade: "240N", image: "https://images.unsplash.com/photo-1586495777744-4413f21062fa?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D" },
        { brand: "NARS", shade: "Barcelona", image: "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?q=80&w=2126&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D" }
      ]
    }
  ];

  return (
    <section className="py-16 bg-gradient-to-br from-rose-50 to-purple-50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-gray-800 mb-4">
            See The Perfect Matches
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Visual shade comparisons showing how different brands match your perfect tone
          </p>
        </div>

        {shadeComparisons.map((comparison, index) => (
          <Card key={index} className="bg-white/80 backdrop-blur-sm shadow-xl border-0 overflow-hidden max-w-6xl mx-auto">
            <CardContent className="p-8">
              <div className="text-center mb-8">
                <h3 className="text-2xl font-bold text-gray-800 mb-2">
                  Perfect Matches for {comparison.originalBrand} {comparison.originalShade}
                </h3>
                <p className="text-gray-600">Here are identical shades from other brands</p>
              </div>

              <div className="grid md:grid-cols-4 gap-6">
                {/* Original Shade */}
                <div className="text-center">
                  <div className="relative mb-4">
                    <img 
                      src="https://images.unsplash.com/photo-1631214540242-0671f8420636?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
                      alt={`${comparison.originalBrand} ${comparison.originalShade}`}
                      className="w-full h-48 object-cover rounded-lg shadow-md"
                    />
                    <div className="absolute top-2 left-2 bg-rose-500 text-white px-2 py-1 rounded text-xs font-medium">
                      Original
                    </div>
                  </div>
                  <h4 className="font-semibold text-gray-800">{comparison.originalBrand}</h4>
                  <p className="text-gray-600">{comparison.originalShade}</p>
                </div>

                {/* Matching Shades */}
                {comparison.matches.map((match, matchIndex) => (
                  <div key={matchIndex} className="text-center">
                    <div className="relative mb-4">
                      <img 
                        src={match.image}
                        alt={`${match.brand} ${match.shade}`}
                        className="w-full h-48 object-cover rounded-lg shadow-md"
                      />
                      <div className="absolute top-2 left-2 bg-green-500 text-white px-2 py-1 rounded text-xs font-medium">
                        95% Match
                      </div>
                    </div>
                    <h4 className="font-semibold text-gray-800">{match.brand}</h4>
                    <p className="text-gray-600">{match.shade}</p>
                  </div>
                ))}
              </div>

              <div className="mt-8 text-center">
                <p className="text-sm text-gray-500 mb-4">
                  All shades shown have been color-matched using our advanced AI technology
                </p>
                <div className="flex justify-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-rose-500 rounded-full"></div>
                    <span className="text-sm text-gray-600">Your Current Shade</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <span className="text-sm text-gray-600">Perfect Matches</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
};

export default ShadeComparison;
