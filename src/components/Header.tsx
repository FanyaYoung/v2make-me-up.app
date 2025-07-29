
import React from 'react';
import { Palette, User, LogOut, Camera, Crown, ShoppingCart } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useCart } from '@/contexts/CartContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Link, useNavigate } from 'react-router-dom';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const Header = () => {
  const { user, signOut, isAuthenticated } = useAuth();
  const { getTotalItems } = useCart();
  const navigate = useNavigate();
  const totalItems = getTotalItems();

  return (
    <header className="bg-white/80 backdrop-blur-sm shadow-sm border-b border-rose-100">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <Link to="/" className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-r from-rose-500 to-purple-500 rounded-full flex items-center justify-center">
              <Palette className="w-5 h-5 text-white" />
            </div>
            <span className="text-2xl font-bold bg-gradient-to-r from-rose-600 to-purple-600 bg-clip-text text-transparent">
              Make Me Up
            </span>
          </Link>
          <nav className="hidden md:flex items-center space-x-8">
            <Link to="/" className="text-gray-600 hover:text-rose-600 transition-colors font-medium">Home</Link>
            <Link to="/shade-matcher" className="text-gray-600 hover:text-rose-600 transition-colors font-medium flex items-center gap-1">
              <Palette className="w-4 h-4" />
              Shade Matcher
            </Link>
            <Link to="/virtual-try-on" className="text-gray-600 hover:text-rose-600 transition-colors font-medium flex items-center gap-1">
              <Camera className="w-4 h-4" />
              Virtual Try-On
            </Link>
            <Link to="/premium-looks" className="text-gray-600 hover:text-rose-600 transition-colors font-medium flex items-center gap-1">
              <Crown className="w-4 h-4" />
              Premium Looks
            </Link>
            
            {/* Cart Icon */}
            <Link to="/cart" className="relative text-gray-600 hover:text-rose-600 transition-colors">
              <ShoppingCart className="w-5 h-5" />
              {totalItems > 0 && (
                <Badge 
                  className="absolute -top-2 -right-2 w-5 h-5 flex items-center justify-center p-0 text-xs bg-rose-500 text-white rounded-full"
                >
                  {totalItems}
                </Badge>
              )}
            </Link>
            
            {isAuthenticated ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="flex items-center space-x-2">
                    <User className="w-4 h-4" />
                    <span>{user?.email?.split('@')[0] || 'User'}</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="bg-white z-50" align="end">
                  <DropdownMenuItem onClick={signOut} className="flex items-center space-x-2">
                    <LogOut className="w-4 h-4" />
                    <span>Sign Out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button 
                className="bg-gradient-to-r from-rose-500 to-purple-500 text-white px-6 py-2 rounded-full hover:shadow-lg transition-all duration-300 font-medium"
                onClick={() => navigate('/auth')}
              >
                Sign In
              </Button>
            )}
          </nav>
        </div>
      </div>
    </header>
  );
};

export default Header;
