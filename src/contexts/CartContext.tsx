import React, { createContext, useContext, useState, ReactNode } from 'react';
import { FoundationMatch } from '@/types/foundation';
import { buildAffiliateUrl, inferAffiliateProvider, type AffiliateProvider } from '@/lib/affiliate';

export interface CartItem {
  id: string;
  product: FoundationMatch;
  quantity: number;
  selectedShade?: 'primary' | 'contour';
  shadeName?: string;
  shadeHex?: string;
  addedAt: Date;
  priceCheckedAt: Date;
  purchaseModel: 'direct' | 'affiliate';
  retailerUrl?: string;
  affiliateUrl?: string;
  affiliateProvider?: AffiliateProvider;
}

interface CartContextType {
  items: CartItem[];
  addToCart: (product: FoundationMatch, selectedShade?: 'primary' | 'contour') => void;
  removeFromCart: (itemId: string) => void;
  updateQuantity: (itemId: string, quantity: number) => void;
  updateItemPricing: (
    itemId: string,
    updates: Partial<FoundationMatch>,
    options?: Partial<Pick<CartItem, 'priceCheckedAt' | 'retailerUrl' | 'affiliateUrl' | 'affiliateProvider' | 'purchaseModel'>>
  ) => void;
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

type CartSourceProduct = FoundationMatch & {
  hex?: string;
  affiliate_url?: string;
  product_link?: string;
  website_link?: string;
};

export const CartProvider = ({ children }: CartProviderProps) => {
  const [items, setItems] = useState<CartItem[]>([]);

  const addToCart = (product: FoundationMatch, selectedShade?: 'primary' | 'contour') => {
    const sourceProduct = product as CartSourceProduct;
    const shadeName = selectedShade === 'contour' 
      ? product.contourShade?.name 
      : product.primaryShade?.name || product.shade;
    
    // Get hex from the product itself (it's on the main object, not on shade sub-objects)
    const shadeHex = sourceProduct.hex;
    const retailerUrl =
      sourceProduct.affiliate_url ||
      sourceProduct.product_link ||
      sourceProduct.website_link ||
      sourceProduct.productUrl ||
      sourceProduct.rakutenData?.productUrl;
    const affiliateUrl = buildAffiliateUrl(retailerUrl, product.id);
    const purchaseModel = affiliateUrl ? 'affiliate' : 'direct';
    const affiliateProvider = affiliateUrl ? inferAffiliateProvider(affiliateUrl) : undefined;
    
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
        shadeHex,
        addedAt: new Date(),
        priceCheckedAt: new Date(),
        purchaseModel,
        retailerUrl,
        affiliateUrl,
        affiliateProvider,
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

  const updateItemPricing = (
    itemId: string,
    updates: Partial<FoundationMatch>,
    options?: Partial<Pick<CartItem, 'priceCheckedAt' | 'retailerUrl' | 'affiliateUrl' | 'affiliateProvider' | 'purchaseModel'>>
  ) => {
    setItems(prevItems =>
      prevItems.map(item =>
        item.id === itemId
          ? {
              ...item,
              product: {
                ...item.product,
                ...updates,
              },
              ...(options?.priceCheckedAt ? { priceCheckedAt: options.priceCheckedAt } : {}),
              ...(options?.retailerUrl !== undefined ? { retailerUrl: options.retailerUrl } : {}),
              ...(options?.affiliateUrl !== undefined ? { affiliateUrl: options.affiliateUrl } : {}),
              ...(options?.affiliateProvider !== undefined ? { affiliateProvider: options.affiliateProvider } : {}),
              ...(options?.purchaseModel !== undefined ? { purchaseModel: options.purchaseModel } : {}),
            }
          : item
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
      updateItemPricing,
      clearCart,
      getTotalPrice,
      getTotalItems
    }}>
      {children}
    </CartContext.Provider>
  );
};
