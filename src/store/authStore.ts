import {create} from 'zustand';
import {persist, createJSONStorage} from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import auth, {FirebaseAuthTypes} from '@react-native-firebase/auth';

interface AuthState {
  user: FirebaseAuthTypes.User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  confirmationResult: FirebaseAuthTypes.ConfirmationResult | null;

  setUser: (user: FirebaseAuthTypes.User | null) => void;
  setToken: (token: string | null) => void;
  setLoading: (loading: boolean) => void;
  setConfirmationResult: (result: FirebaseAuthTypes.ConfirmationResult | null) => void;
  signOut: () => Promise<void>;
  getIdToken: () => Promise<string | null>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: true,
      confirmationResult: null,

      setUser: (user) =>
        set({user, isAuthenticated: !!user, isLoading: false}),

      setToken: (token) => set({token}),

      setLoading: (isLoading) => set({isLoading}),

      setConfirmationResult: (confirmationResult) =>
        set({confirmationResult}),

      signOut: async () => {
        await auth().signOut();
        set({
          user: null,
          token: null,
          isAuthenticated: false,
          confirmationResult: null,
        });
      },

      getIdToken: async () => {
        const currentUser = auth().currentUser;
        if (!currentUser) {
          return null;
        }
        const token = await currentUser.getIdToken(true);
        set({token});
        return token;
      },
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
    },
  ),
);
