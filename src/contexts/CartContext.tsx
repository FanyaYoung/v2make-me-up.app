import React, { createContext, useContext, useState, ReactNode } from 'react';
import { FoundationMatch } from '@/types/foundation';

export interface CartItem {
  id: string;
  product: FoundationMatch;
  quantity: number;
  selectedShade?: 'primary' | 'contour';
  shadeName?: string;
  addedAt: Date;
}

interface CartContextType {
  items: CartItem[];
  addToCart: (product: FoundationMatch, selectedShade?: 'primary' | 'contour') => void;
  removeFromCart: (itemId: string) => void;
  updateQuantity: (itemId: string, quantity: number) => void;
  clearCart: () => void;
  getTotalPrice: () => number;
  getTotalItems: () => number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

interface CartProviderProps {
  children: ReactNode;
}

export const CartProvider = ({ children }: CartProviderProps) => {
  const [items, setItems] = useState<CartItem[]>([]);

  const addToCart = (product: FoundationMatch, selectedShade?: 'primary' | 'contour') => {
    const shadeName = selectedShade === 'contour' 
      ? product.contourShade?.name 
      : product.primaryShade?.name || product.shade;
    
    const itemId = `${product.id}-${selectedShade || 'primary'}`;
    
    setItems(prevItems => {
      const existingItem = prevItems.find(item => item.id === itemId);
      
      if (existingItem) {
        return prevItems.map(item =>
          item.id === itemId
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      
      return [...prevItems, {
        id: itemId,
        product,
        quantity: 1,
        selectedShade,
        shadeName,
        addedAt: new Date()
      }];
    });
  };

  const removeFromCart = (itemId: string) => {
    setItems(prevItems => prevItems.filter(item => item.id !== itemId));
  };

  const updateQuantity = (itemId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(itemId);
      return;
    }
    
    setItems(prevItems =>
      prevItems.map(item =>
        item.id === itemId ? { ...item, quantity } : item
      )
    );
  };

  const clearCart = () => {
    setItems([]);
  };

  const getTotalPrice = () => {
    return items.reduce((total, item) => total + (item.product.price * item.quantity), 0);
  };

  const getTotalItems = () => {
    return items.reduce((total, item) => total + item.quantity, 0);
  };

  return (
    <CartContext.Provider value={{
      items,
      addToCart,
      removeFromCart,
      updateQuantity,
      clearCart,
      getTotalPrice,
      getTotalItems
    }}>
      {children}
    </CartContext.Provider>
  );
};