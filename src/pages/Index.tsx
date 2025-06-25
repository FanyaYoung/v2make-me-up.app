
import React from 'react';
import FoundationMatcher from '../components/FoundationMatcher';
import Header from '../components/Header';

const Index = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-pink-50 to-purple-50">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold bg-gradient-to-r from-rose-600 to-purple-600 bg-clip-text text-transparent mb-4">
            Foundation Finder
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Discover your perfect foundation match across all brands. Enter your current shade and find similar options with pricing, reviews, and virtual try-on.
          </p>
        </div>
        <FoundationMatcher />
      </main>
    </div>
  );
};

export default Index;
