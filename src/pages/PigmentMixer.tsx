import React from 'react';
import Header from '@/components/Header';
import { PigmentColorMixer } from '@/components/PigmentColorMixer';
import { Toaster } from '@/components/ui/toaster';

const PigmentMixer = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-background">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="text-center space-y-2">
            <h1 className="text-4xl font-bold tracking-tight">Foundation Pigment Mixer</h1>
            <p className="text-lg text-muted-foreground">
              Professional color matching using traditional pigment mixing ratios
            </p>
          </div>
          
          <PigmentColorMixer />
        </div>
      </main>
      <Toaster />
    </div>
  );
};

export default PigmentMixer;
