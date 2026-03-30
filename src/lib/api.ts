// ═══════════════════════════════════════════════════════════════
// MyHomeworkPal — Legacy API module (kept for backward compat)
// Primary API is src/services/api.ts — this re-exports from there
// ═══════════════════════════════════════════════════════════════
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_CONFIG } from '@/constants/theme';

const API_URL = API_CONFIG.BASE_URL;
const TOKEN_KEY = 'auth_token';
const USER_KEY = 'user_data';

export const api = axios.create({
  baseURL: API_URL,
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem(TOKEN_KEY);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      await AsyncStorage.multiRemove([TOKEN_KEY, USER_KEY]);
    }
    return Promise.reject(error);
  }
);

export interface User {
  id: string;
  email: string;
  name: string;
  role: string;
}

// Auth methods matching backend
export const authApi = {
  login: async (credentials: { email: string; password: string }) => {
    const { data } = await api.post('/auth/login', credentials);
    await AsyncStorage.setItem(TOKEN_KEY, data.token);
    return data;
  },

  signup: async (userData: { email: string; password: string; name: string; role: string }) => {
    const { data } = await api.post('/auth/register', userData);
    await AsyncStorage.setItem(TOKEN_KEY, data.token);
    return data;
  },

  getMe: async (): Promise<User> => {
    const { data } = await api.get('/auth/me');
    await AsyncStorage.setItem(USER_KEY, JSON.stringify(data));
    return data;
  },

  logout: async (): Promise<void> => {
    await AsyncStorage.multiRemove([TOKEN_KEY, USER_KEY]);
  },
};

export const getErrorMessage = (error: any): string => {
  if (axios.isAxiosError(error)) {
    return error.response?.data?.detail || error.message || 'An error occurred';
  }
  return 'An unexpected error occurred';
};
