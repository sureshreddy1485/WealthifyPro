import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

import Constants from 'expo-constants';
import * as Crypto from 'expo-crypto';

// Dynamically determine the API URL based on the Expo bundler's host IP
// This ensures the app always connects to the backend running on the same PC, even if the IP changes!
let API_URL = 'http://192.168.1.6:3000/api'; 
const hostUri = Constants.expoConfig?.hostUri;
if (hostUri) {
  const ip = hostUri.split(':')[0];
  API_URL = `http://${ip}:3000/api`;
}

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
