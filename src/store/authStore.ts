// src/store/authStore.ts
import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authApi, User } from '../lib/api';

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  
  login: (email: string, password: string) => Promise<void>;
  signup: (data: {
    email: string;
    password: string;
    full_name: string;
    role: string;
  }) => Promise<void>;
  logout: () => Promise<void>;
  loadUser: () => Promise<void>;
  checkAuth: () => Promise<boolean>;
}

const TOKEN_KEY = 'auth_token';
const USER_KEY = 'user_data';

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: null,
  isLoading: false,
  isAuthenticated: false,

  login: async (email: string, password: string) => {
    set({ isLoading: true });
    try {
      const response = await authApi.login({ username: email, password });
      const user = await authApi.getMe();
      
      set({
        token: response.access_token,
        user,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  signup: async (data) => {
    set({ isLoading: true });
    try {
      await authApi.signup(data);
      await get().login(data.email, data.password);
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  logout: async () => {
    set({ isLoading: true });
    try {
      await authApi.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      set({
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
      });
    }
  },

  loadUser: async () => {
    try {
      const user = await authApi.getMe();
      set({ user, isAuthenticated: true });
    } catch (error) {
      set({ user: null, token: null, isAuthenticated: false });
      throw error;
    }
  },

  checkAuth: async () => {
    const token = await AsyncStorage.getItem(TOKEN_KEY);
    const userData = await AsyncStorage.getItem(USER_KEY);

    if (token && userData) {
      try {
        const user = JSON.parse(userData);
        set({ token, user, isAuthenticated: true });
        await get().loadUser();
        return true;
      } catch (error) {
        await AsyncStorage.multiRemove([TOKEN_KEY, USER_KEY]);
        set({ token: null, user: null, isAuthenticated: false });
        return false;
      }
    }
    return false;
  },
}));
