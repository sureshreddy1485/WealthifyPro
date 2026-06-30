import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

import Constants from 'expo-constants';
import * as Crypto from 'expo-crypto';
import { useNoteStore } from './noteStore';
import { useLedgerStore } from './ledgerStore';
import { useEmiStore } from './emiStore';
import { useSyncStore } from './syncStore';

const API_URL = 'https://wealthifypro.onrender.com/api';

export const api = axios.create({
  baseURL: API_URL,
});

export interface User {
  id: string;
  name: string;
  emailOrPhone: string;
  profilePictureUrl?: string;
}

interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  token: string | null;
  deviceId: string;
  login: (token: string, user: User) => void;
  logout: () => void;
  updateUser: (user: User) => void;
  ensureDeviceId: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      isAuthenticated: false,
      user: null,
      token: null,
      deviceId: '',
      ensureDeviceId: () => {
        if (!get().deviceId) {
          set({ deviceId: Crypto.randomUUID() });
        }
      },
      login: (token, user) => {
        // Automatically set token for all subsequent axios requests
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        set({ isAuthenticated: true, user, token });
      },
      logout: () => {
        delete api.defaults.headers.common['Authorization'];
        set({ isAuthenticated: false, user: null, token: null });
        
        // Clear all local user data to prevent cross-account pollution
        useNoteStore.setState({ folders: [], notes: [] });
        useLedgerStore.setState({ folders: [], ledgers: [] });
        useEmiStore.setState({ folders: [], emis: [] });
        useSyncStore.setState({ status: 'idle', lastSyncedAt: null });
      },
      updateUser: (user) => set({ user }),
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => AsyncStorage),
      onRehydrateStorage: () => (state) => {
        if (state) {
          if (!state.deviceId) {
            state.deviceId = Crypto.randomUUID();
          }
          if (state.token) {
            api.defaults.headers.common['Authorization'] = `Bearer ${state.token}`;
          }
        }
      },
    }
  )
);
