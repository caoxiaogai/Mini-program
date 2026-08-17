import { create } from 'zustand';
import type { UserInfo } from '../types';

interface UserState {
  userInfo: UserInfo | null;
  isLoggedIn: boolean;
  setUserInfo: (info: UserInfo) => void;
  logout: () => void;
}

export const useUserStore = create<UserState>((set) => ({
  userInfo: null,
  isLoggedIn: false,
  setUserInfo: (info) => set({ userInfo: info, isLoggedIn: true }),
  logout: () => set({ userInfo: null, isLoggedIn: false })
}));
