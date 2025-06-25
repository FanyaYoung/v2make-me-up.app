
import React from 'react';
import { Camera, Search } from 'lucide-react';

const Header = () => {
  return (
    <header className="bg-white/80 backdrop-blur-sm shadow-sm border-b border-rose-100">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-r from-rose-500 to-purple-500 rounded-full flex items-center justify-center">
              <Search className="w-5 h-5 text-white" />
            </div>
            <span className="text-2xl font-bold bg-gradient-to-r from-rose-600 to-purple-600 bg-clip-text text-transparent">
              Make Me Up
            </span>
          </div>
          <nav className="hidden md:flex items-center space-x-6">
            <a href="#" className="text-gray-600 hover:text-rose-600 transition-colors font-medium">Home</a>
            <a href="#" className="text-gray-600 hover:text-rose-600 transition-colors font-medium">Brands</a>
            <a href="#" className="text-gray-600 hover:text-rose-600 transition-colors font-medium">Reviews</a>
            <button className="bg-gradient-to-r from-rose-500 to-purple-500 text-white px-6 py-2 rounded-full hover:shadow-lg transition-all duration-300 font-medium">
              Try Virtual Makeup
            </button>
          </nav>
        </div>
      </div>
    </header>
  );
};

export default Header;
