export const CATEGORIES = [
  {id: 'good_morning', label: 'Good Morning', icon: '🌅'},
  {id: 'good_night', label: 'Good Night', icon: '🌙'},
  {id: 'motivational', label: 'Motivational', icon: '💪'},
  {id: 'devotional', label: 'Devotional', icon: '🙏'},
  {id: 'festival', label: 'Festival', icon: '🎉'},
  {id: 'shayari', label: 'Shayari', icon: '✍️'},
  {id: 'birthday', label: 'Birthday', icon: '🎂'},
  {id: 'anniversary', label: 'Anniversary', icon: '💍'},
  {id: 'business', label: 'Business', icon: '💼'},
  {id: 'patriotic', label: 'Patriotic', icon: '🇮🇳'},
  {id: 'love', label: 'Love', icon: '❤️'},
  {id: 'friendship', label: 'Friendship', icon: '🤝'},
] as const;

export const LANGUAGES = [
  {id: 'hi', label: 'Hindi'},
  {id: 'en', label: 'English'},
  {id: 'mr', label: 'Marathi'},
  {id: 'gu', label: 'Gujarati'},
  {id: 'ta', label: 'Tamil'},
  {id: 'te', label: 'Telugu'},
  {id: 'kn', label: 'Kannada'},
  {id: 'ml', label: 'Malayalam'},
] as const;

export const SUBSCRIPTION_PLANS = [
  {
    id: 'free',
    name: 'Free',
    price: 0,
    currency: 'INR',
    interval: 'monthly' as const,
    features: [
      'Browse all templates',
      'Quick Mode with watermark',
      'Basic fonts',
    ],
  },
  {
    id: 'premium_monthly',
    name: 'Premium Monthly',
    price: 99,
    currency: 'INR',
    interval: 'monthly' as const,
    features: [
      'No watermark',
      'All templates',
      'All fonts',
      'Video export',
      'Priority support',
    ],
  },
  {
    id: 'premium_yearly',
    name: 'Premium Yearly',
    price: 599,
    currency: 'INR',
    interval: 'yearly' as const,
    features: [
      'Everything in Premium',
      'Save ₹589/year',
    ],
  },
  {
    id: 'business',
    name: 'Business',
    price: 1999,
    currency: 'INR',
    interval: 'yearly' as const,
    features: [
      'Everything in Premium',
      'Custom branded frames',
      'Priority templates',
      'Business card maker',
    ],
  },
] as const;

export const DEFAULT_CANVAS = {
  width: 1080,
  height: 1080,
};
