
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
  hexColor?: string; // Add hex color field for actual pigment colors
  // Dual recommendation support
  primaryShade?: {
    name: string;
    purpose: 'face_center';
  };
  contourShade?: {
    name: string;
    purpose: 'face_sides';
    mixable: boolean;
  };
}

export interface FeedbackCategory {
  id: string;
  label: string;
  type: 'shade_mismatch' | 'technical_issue' | 'other';
}

export const FEEDBACK_CATEGORIES: FeedbackCategory[] = [
  // Shade mismatch categories
  { id: 'too_light', label: 'Too light', type: 'shade_mismatch' },
  { id: 'too_dark', label: 'Too dark', type: 'shade_mismatch' },
  { id: 'ashen', label: 'Ashen/grey', type: 'shade_mismatch' },
  { id: 'too_olive', label: 'Too olive', type: 'shade_mismatch' },
  { id: 'too_red', label: 'Too red', type: 'shade_mismatch' },
  { id: 'too_blue', label: 'Too blue', type: 'shade_mismatch' },
  { id: 'too_yellow', label: 'Too yellow', type: 'shade_mismatch' },
  { id: 'too_pink', label: 'Too pink', type: 'shade_mismatch' },
  
  // Technical issues
  { id: 'virtual_try_on_failed', label: 'The virtual try-on didn\'t launch', type: 'technical_issue' },
  { id: 'no_new_recommendations', label: 'After saving my profile, I didn\'t get any new recommendations below', type: 'technical_issue' },
];
