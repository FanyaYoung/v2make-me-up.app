import React from 'react';
import Header from '../components/Header';
import LightingAwareFoundationMatcher from '../components/LightingAwareFoundationMatcher';
import { Toaster } from '@/components/ui/toaster';
import AuthGuard from '../components/AuthGuard';

const LightingMatcher = () => {
  return (
    <AuthGuard>
      <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-background">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <LightingAwareFoundationMatcher />
        </main>
        <Toaster />
      </div>
    </AuthGuard>
  );
};

export default LightingMatcher;
