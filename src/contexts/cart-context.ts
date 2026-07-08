import { createContext } from 'react';

export interface CartContextType {
  items: import('@/contexts/CartContext').CartItem[];
  addToCart: (
    product: import('@/types/foundation').FoundationMatch,
    selectedShade?: 'primary' | 'contour'
  ) => void;
  removeFromCart: (itemId: string) => void;
  updateQuantity: (itemId: string, quantity: number) => void;
  updateItemPricing: (
    itemId: string,
    updates: Partial<import('@/types/foundation').FoundationMatch>,
    options?: Partial<
      Pick<
        import('@/contexts/CartContext').CartItem,
        'priceCheckedAt' | 'retailerUrl' | 'affiliateUrl' | 'affiliateProvider' | 'purchaseModel'
      >
    >
  ) => void;
  clearCart: () => void;
  getTotalPrice: () => number;
  getTotalItems: () => number;
}

export const CartContext = createContext<CartContextType | undefined>(undefined);
