// ============================================================
// AutoApply AI — Auth State Store (Zustand with Persistence)
// ============================================================

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User, AuthTokens } from '@autoapply/shared';

interface AuthState {
  user: User | null;
  tokens: AuthTokens | null;
  isAuthenticated: boolean;
  setAuth: (user: User, tokens: AuthTokens) => void;
  clearAuth: () => void;
  updateUser: (user: Partial<User>) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      tokens: null,
      isAuthenticated: false,
      setAuth: (user, tokens) => set({ user, tokens, isAuthenticated: true }),
      clearAuth: () => set({ user: null, tokens: null, isAuthenticated: false }),
      updateUser: (userUpdates) =>
        set((state) => ({
          user: state.user ? { ...state.user, ...userUpdates } as User : null,
        })),
    }),
    {
      name: 'autoapply-auth-storage',
    },
  ),
);
