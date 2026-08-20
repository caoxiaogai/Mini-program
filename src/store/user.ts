import { create } from 'zustand';
import type { UserInfo } from '../types';

interface UserState {
  userInfo: UserInfo | null;
  isLoggedIn: boolean;
  authReady: boolean;
  setUserInfo: (info: UserInfo) => void;
  setAuthReady: (ready: boolean) => void;
  logout: () => void;
}

export const useUserStore = create<UserState>((set) => ({
  userInfo: null,
  isLoggedIn: false,
  authReady: false,
  setUserInfo: (info) => set({ userInfo: info, isLoggedIn: true }),
  setAuthReady: (ready) => set({ authReady: ready }),
  logout: () => set({ userInfo: null, isLoggedIn: false }),
}));
