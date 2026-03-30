// ═══════════════════════════════════════════════════════════════
// MyHomeworkPal Stores v2.1.0
// Fixed: auth flow matches backend {token, user} response
// ═══════════════════════════════════════════════════════════════
import { create } from 'zustand';
import { authAPI, setToken, removeToken, getToken, tasksAPI, chatAPI } from '@/services/api';

export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  role: 'student' | 'helper' | 'admin';
  bio?: string;
  skills?: string[];
  rating?: number;
  totalReviews?: number;
  completedOrders?: number;
  verified?: boolean;
  createdAt: string;
}

interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: { email: string; password: string; name: string; role: 'student' | 'helper' }) => Promise<void>;
  logout: () => Promise<void>;
  loadUser: () => Promise<void>;
  updateProfile: (data: Partial<User>) => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: true,
  isAuthenticated: false,

  login: async (email, password) => {
    // Backend returns { token, user }
    const { data } = await authAPI.login({ email, password });
    await setToken(data.token);
    set({ user: data.user, isAuthenticated: true });
  },

  register: async (registerData) => {
    // Backend register also returns { token, user }
    const { data } = await authAPI.register(registerData);
    await setToken(data.token);
    set({ user: data.user, isAuthenticated: true });
  },

  logout: async () => {
    await removeToken();
    set({ user: null, isAuthenticated: false });
  },

  loadUser: async () => {
    try {
      const token = await getToken();
      if (!token) {
        set({ isLoading: false });
        return;
      }
      const { data } = await authAPI.me();
      set({ user: data, isAuthenticated: true, isLoading: false });
    } catch {
      await removeToken();
      set({ user: null, isAuthenticated: false, isLoading: false });
    }
  },

  updateProfile: async (profileData) => {
    const { data } = await authAPI.updateProfile(profileData);
    set({ user: data });
  },
}));

// ═══════════════════════════════════════
// TASK STORE
// ═══════════════════════════════════════
export interface Task {
  id: string;
  title: string;
  description: string;
  category: string;
  budget: number;
  deadline: string;
  status: 'open' | 'in_progress' | 'delivered' | 'completed' | 'cancelled' | 'disputed';
  files?: string[];
  studentId: string;
  student?: User;
  bidsCount?: number;
  createdAt: string;
}

interface TaskState {
  tasks: Task[];
  currentTask: Task | null;
  isLoading: boolean;
  filters: { category?: string; status?: string; sort?: string };
  fetchTasks: (params?: any) => Promise<void>;
  fetchTask: (id: string) => Promise<void>;
  setFilters: (filters: any) => void;
}

export const useTaskStore = create<TaskState>((set) => ({
  tasks: [],
  currentTask: null,
  isLoading: false,
  filters: {},

  fetchTasks: async (params) => {
    set({ isLoading: true });
    try {
      const { data } = await tasksAPI.list(params);
      set({ tasks: data.tasks || data || [], isLoading: false });
    } catch {
      set({ tasks: [], isLoading: false });
    }
  },

  fetchTask: async (id) => {
    set({ isLoading: true });
    try {
      const { data } = await tasksAPI.get(id);
      set({ currentTask: data, isLoading: false });
    } catch {
      set({ isLoading: false });
    }
  },

  setFilters: (filters) => set({ filters }),
}));

// ═══════════════════════════════════════
// CHAT STORE
// ═══════════════════════════════════════
export interface Message {
  id: string;
  content: string;
  senderId: string;
  type: 'text' | 'file' | 'system';
  createdAt: string;
}

export interface Conversation {
  id: string;
  participant: User;
  lastMessage?: Message;
  unreadCount: number;
  updatedAt: string;
}

interface ChatState {
  conversations: Conversation[];
  currentMessages: Message[];
  isLoading: boolean;
  fetchConversations: () => Promise<void>;
  fetchMessages: (conversationId: string) => Promise<void>;
  addMessage: (message: Message) => void;
}

export const useChatStore = create<ChatState>((set) => ({
  conversations: [],
  currentMessages: [],
  isLoading: false,

  fetchConversations: async () => {
    set({ isLoading: true });
    try {
      const { data } = await chatAPI.conversations();
      set({ conversations: data.conversations || data || [], isLoading: false });
    } catch {
      set({ conversations: [], isLoading: false });
    }
  },

  fetchMessages: async (conversationId) => {
    set({ isLoading: true });
    try {
      const { data } = await chatAPI.messages(conversationId);
      set({ currentMessages: data.messages || data || [], isLoading: false });
    } catch {
      set({ currentMessages: [], isLoading: false });
    }
  },

  addMessage: (message) =>
    set((state) => ({ currentMessages: [...state.currentMessages, message] })),
}));
