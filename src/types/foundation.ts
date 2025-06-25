
export interface FoundationMatch {
  id: string;
  brand: string;
  product: string;
  shade: string;
  price: number;
  rating: number;
  reviewCount: number;
  availability: {
    online: boolean;
    inStore: boolean;
    readyForPickup: boolean;
    nearbyStores: string[];
  };
  matchPercentage: number;
  undertone: string;
  coverage: string;
  finish: string;
  imageUrl: string;
}
