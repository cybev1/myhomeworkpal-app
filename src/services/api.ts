import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import { API_CONFIG } from '@/constants/theme';

const api = axios.create({
  baseURL: API_CONFIG.BASE_URL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

// Token management
const getToken = async (): Promise<string | null> => {
  if (Platform.OS === 'web') {
    return localStorage.getItem('auth_token');
  }
  return SecureStore.getItemAsync('auth_token');
};

const setToken = async (token: string): Promise<void> => {
  if (Platform.OS === 'web') {
    localStorage.setItem('auth_token', token);
    return;
  }
  await SecureStore.setItemAsync('auth_token', token);
};

const removeToken = async (): Promise<void> => {
  if (Platform.OS === 'web') {
    localStorage.removeItem('auth_token');
    return;
  }
  await SecureStore.deleteItemAsync('auth_token');
};

// Request interceptor — attach token
api.interceptors.request.use(async (config) => {
  const token = await getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor — handle 401
api.interceptors.response.use(
  (res) => res,
  async (error) => {
    if (error.response?.status === 401) {
      await removeToken();
      // Navigation will handle redirect via auth state
    }
    return Promise.reject(error);
  }
);

// ═══════════════════════════════════════
// AUTH
// ═══════════════════════════════════════
export const authAPI = {
  register: (data: { email: string; password: string; name: string; role: 'student' | 'helper' }) =>
    api.post('/auth/signup', {
      email: data.email,
      password: data.password,
      full_name: data.name,
      role: data.role,
    }),

  login: async (data: { email: string; password: string }) => {
    // Backend expects OAuth2 form data
    const formData = new URLSearchParams();
    formData.append('username', data.email);
    formData.append('password', data.password);

    const res = await api.post('/auth/login', formData.toString(), {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    });
    // Normalize response: backend returns { access_token, token_type }
    // Store expects { token, user }
    const token = res.data.access_token || res.data.token;
    if (token) {
      await setToken(token);
      // Fetch user profile
      const userRes = await api.get('/auth/me', {
        headers: { Authorization: `Bearer ${token}` },
      });
      return { data: { token, user: normalizeUser(userRes.data) } };
    }
    return res;
  },

  me: async () => {
    const res = await api.get('/auth/me');
    return { data: normalizeUser(res.data) };
  },

  forgotPassword: (email: string) =>
    api.post('/auth/forgot-password', { email }),

  resetPassword: (data: { token: string; password: string }) =>
    api.post('/auth/reset-password', data),

  updateProfile: (data: any) =>
    api.patch('/auth/profile', data),

  uploadAvatar: (formData: FormData) =>
    api.post('/auth/avatar', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
};

// Normalize backend user shape to frontend User interface
function normalizeUser(u: any) {
  return {
    id: u.id || u._id || '',
    email: u.email || '',
    name: u.full_name || u.name || '',
    role: u.role || 'student',
    bio: u.bio || '',
    skills: u.skills || [],
    rating: u.rating || 0,
    totalReviews: u.total_reviews || u.totalReviews || 0,
    completedOrders: u.completed_orders || u.completedOrders || 0,
    verified: u.verified || false,
    avatar: u.avatar || '',
    createdAt: u.created_at || u.createdAt || '',
  };
}

// ═══════════════════════════════════════
// HOMEWORK / TASKS
// ═══════════════════════════════════════
export const tasksAPI = {
  create: (data: any) => api.post('/tasks', data),
  list: (params?: any) => api.get('/tasks', { params }),
  get: (id: string) => api.get(`/tasks/${id}`),
  update: (id: string, data: any) => api.patch(`/tasks/${id}`, data),
  delete: (id: string) => api.delete(`/tasks/${id}`),
  myTasks: (params?: any) => api.get('/tasks/mine', { params }),
  uploadFile: (taskId: string, formData: FormData) =>
    api.post(`/tasks/${taskId}/files`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
};

// ═══════════════════════════════════════
// HELPER SERVICES (gigs)
// ═══════════════════════════════════════
export const servicesAPI = {
  create: (data: any) => api.post('/services', data),
  list: (params?: any) => api.get('/services', { params }),
  get: (id: string) => api.get(`/services/${id}`),
  update: (id: string, data: any) => api.patch(`/services/${id}`, data),
  delete: (id: string) => api.delete(`/services/${id}`),
  myServices: () => api.get('/services/mine'),
};

// ═══════════════════════════════════════
// BIDS / PROPOSALS
// ═══════════════════════════════════════
export const bidsAPI = {
  create: (taskId: string, data: any) => api.post(`/tasks/${taskId}/bids`, data),
  list: (taskId: string) => api.get(`/tasks/${taskId}/bids`),
  accept: (bidId: string) => api.post(`/bids/${bidId}/accept`),
  reject: (bidId: string) => api.post(`/bids/${bidId}/reject`),
  withdraw: (bidId: string) => api.post(`/bids/${bidId}/withdraw`),
  myBids: () => api.get('/bids/mine'),
};

// ═══════════════════════════════════════
// ORDERS
// ═══════════════════════════════════════
export const ordersAPI = {
  create: (data: any) => api.post('/orders', data),
  list: (params?: any) => api.get('/orders', { params }),
  get: (id: string) => api.get(`/orders/${id}`),
  deliver: (id: string, formData: FormData) =>
    api.post(`/orders/${id}/deliver`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  approve: (id: string) => api.post(`/orders/${id}/approve`),
  requestRevision: (id: string, data: { message: string }) =>
    api.post(`/orders/${id}/revision`, data),
  dispute: (id: string, data: { reason: string }) =>
    api.post(`/orders/${id}/dispute`, data),
};

// ═══════════════════════════════════════
// PAYMENTS / WALLET
// ═══════════════════════════════════════
export const paymentsAPI = {
  createPaymentIntent: (data: { amount: number; orderId: string }) =>
    api.post('/payments/create-intent', data),
  wallet: () => api.get('/payments/wallet'),
  transactions: (params?: any) => api.get('/payments/transactions', { params }),
  withdraw: (data: { amount: number; method: string }) =>
    api.post('/payments/withdraw', data),
};

// ═══════════════════════════════════════
// CHAT / MESSAGING
// ═══════════════════════════════════════
export const chatAPI = {
  conversations: () => api.get('/chat/conversations'),
  messages: (conversationId: string, params?: any) =>
    api.get(`/chat/conversations/${conversationId}/messages`, { params }),
  send: (conversationId: string, data: { content: string; type?: string }) =>
    api.post(`/chat/conversations/${conversationId}/messages`, data),
  startConversation: (userId: string) =>
    api.post('/chat/conversations', { recipientId: userId }),
};

// ═══════════════════════════════════════
// REVIEWS
// ═══════════════════════════════════════
export const reviewsAPI = {
  create: (orderId: string, data: { rating: number; comment: string }) =>
    api.post(`/orders/${orderId}/review`, data),
  forUser: (userId: string) => api.get(`/users/${userId}/reviews`),
};

// ═══════════════════════════════════════
// COMMUNITY FEED
// ═══════════════════════════════════════
export const feedAPI = {
  posts: (params?: any) => api.get('/feed', { params }),
  create: (data: any) => api.post('/feed', data),
  like: (postId: string) => api.post(`/feed/${postId}/like`),
  comment: (postId: string, data: { content: string }) =>
    api.post(`/feed/${postId}/comments`, data),
  follow: (userId: string) => api.post(`/users/${userId}/follow`),
  unfollow: (userId: string) => api.delete(`/users/${userId}/follow`),
};

// ═══════════════════════════════════════
// USERS / SEARCH
// ═══════════════════════════════════════
export const usersAPI = {
  get: (id: string) => api.get(`/users/${id}`),
  search: (params: any) => api.get('/users/search', { params }),
  topHelpers: () => api.get('/users/top-helpers'),
};

export { api, getToken, setToken, removeToken };
