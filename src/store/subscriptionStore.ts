import {create} from 'zustand';
import {persist, createJSONStorage} from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface SubscriptionState {
  status: 'free' | 'premium' | 'business';
  expiry: number | null;
  isLoading: boolean;

  setStatus: (status: 'free' | 'premium' | 'business') => void;
  setExpiry: (expiry: number | null) => void;
  setLoading: (loading: boolean) => void;
  isPremium: () => boolean;
  reset: () => void;
}

export const useSubscriptionStore = create<SubscriptionState>()(
  persist(
    (set, get) => ({
      status: 'free',
      expiry: null,
      isLoading: false,

      setStatus: (status) => set({status}),
      setExpiry: (expiry) => set({expiry}),
      setLoading: (isLoading) => set({isLoading}),

      isPremium: () => {
        const {status, expiry} = get();
        if (status === 'free') {
          return false;
        }
        if (expiry && Date.now() > expiry) {
          return false;
        }
        return true;
      },

      reset: () => set({status: 'free', expiry: null}),
    }),
    {
      name: 'subscription-storage',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
