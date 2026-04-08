import {create} from 'zustand';
import {persist, createJSONStorage} from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {UserProfile} from '../types/user';

interface UserState {
  profile: UserProfile | null;
  isProfileComplete: boolean;
  isLoading: boolean;
  error: string | null;

  setProfile: (profile: UserProfile | null) => void;
  updateProfile: (updates: Partial<UserProfile>) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearProfile: () => void;
}

export const useUserStore = create<UserState>()(
  persist(
    (set, get) => ({
      profile: null,
      isProfileComplete: false,
      isLoading: false,
      error: null,

      setProfile: (profile) =>
        set({
          profile,
          isProfileComplete: !!profile?.name,
        }),

      updateProfile: (updates) => {
        const current = get().profile;
        if (!current) {
          return;
        }
        const updated = {...current, ...updates};
        set({
          profile: updated,
          isProfileComplete: !!updated.name,
        });
      },

      setLoading: (isLoading) => set({isLoading}),

      setError: (error) => set({error}),

      clearProfile: () =>
        set({profile: null, isProfileComplete: false}),
    }),
    {
      name: 'user-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        profile: state.profile,
        isProfileComplete: state.isProfileComplete,
      }),
    },
  ),
);
