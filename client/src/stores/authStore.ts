import { create } from 'zustand';
import { loginUser, registerUser, getCurrentUser } from '../api/auth';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string, role: 'teacher' | 'student') => Promise<void>;
  logout: () => void;
  checkAuth: () => Promise<boolean>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isAuthenticated: false,
  loading: false,
  error: null,

  login: async (email, password) => {
    set({ loading: true, error: null });
    try {
      const data = await loginUser({ email, password });
      localStorage.setItem('token', data.token);
      set({ user: data.user, isAuthenticated: true, loading: false });
    } catch (error: any) {
      const message = error.response?.data?.message || 'Login failed';
      set({ error: message, loading: false });
      throw new Error(message);
    }
  },

  register: async (name, email, password, role) => {
    set({ loading: true, error: null });
    try {
      const data = await registerUser({ name, email, password, role });
      localStorage.setItem('token', data.token);
      set({ user: data.user, isAuthenticated: true, loading: false });
    } catch (error: any) {
      const message = error.response?.data?.message || 'Registration failed';
      set({ error: message, loading: false });
      throw new Error(message);
    }
  },

  logout: () => {
    localStorage.removeItem('token');
    set({ user: null, isAuthenticated: false });
  },

  checkAuth: async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      set({ isAuthenticated: false, user: null });
      return false;
    }

    set({ loading: true });
    try {
      const user = await getCurrentUser();
      set({ user, isAuthenticated: true, loading: false });
      return true;
    } catch (error) {
      localStorage.removeItem('token');
      set({ user: null, isAuthenticated: false, loading: false });
      return false;
    }
  }
}));