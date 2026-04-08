export interface UserProfile {
  userId: string;
  name: string;
  phone?: string;
  photoUrl?: string;
  businessName?: string;
  logoUrl?: string;
  language: string;
  subscriptionStatus: 'free' | 'premium' | 'business';
  subscriptionExpiry?: number;
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  price: number;
  currency: string;
  interval: 'monthly' | 'yearly';
  features: string[];
}
