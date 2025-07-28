
import React, { useState } from 'react';
import Header from '../components/Header';
import EnhancedFoundationMatcher from '../components/EnhancedFoundationMatcher';
import FoundationVisual from '../components/FoundationVisual';
import Face3DGuide from '../components/Face3DGuide';
import { Toaster } from '@/components/ui/toaster';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Layers } from 'lucide-react';
import AuthGuard from '../components/AuthGuard';

const ShadeMatcher = () => {
  const [showGuide, setShowGuide] = useState(false);

  return (
    <AuthGuard>
      <div className="min-h-screen bg-gradient-to-br from-rose-50 via-pink-50 to-purple-50">
        <Header />
        <div className="py-8">
          <div className="container mx-auto px-4 text-center mb-8">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-rose-600 via-pink-600 to-purple-600 bg-clip-text text-transparent mb-4">
              AI Foundation Shade Matcher
            </h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto mb-6">
              Find your perfect foundation pair using advanced color science and our comprehensive product database.
            </p>
            
            {/* 3D Application Guide Button */}
            <Dialog open={showGuide} onOpenChange={setShowGuide}>
              <DialogTrigger asChild>
                <Button variant="outline" className="flex items-center gap-2">
                  <Layers className="w-4 h-4" />
                  View 3D Application Guide
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>3D Foundation Application Guide</DialogTitle>
                </DialogHeader>
                <Face3DGuide 
                  primaryShade={{
                    name: "Foundation Shade",
                    color: "#F5DEB3",
                    brand: "Your Match"
                  }}
                  contourShade={{
                    name: "Contour Shade", 
                    color: "#D2B48C",
                    brand: "Your Match"
                  }}
                />
              </DialogContent>
            </Dialog>
          </div>
          
          <FoundationVisual />
          
          <main className="container mx-auto px-4 py-8">
            <EnhancedFoundationMatcher />
          </main>
        </div>
        <Toaster />
      </div>
    </AuthGuard>
  );
};

export default ShadeMatcher;
