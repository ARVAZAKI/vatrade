import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests if available
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('vatrade-token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auth API
export const authApi = {
  register: async (data: {
    name: string;
    email: string;
    password: string;
    phone?: string;
  }) => {
    const response = await api.post('/auth/register', data);
    return response.data;
  },

  login: async (data: { email: string; password: string }) => {
    const response = await api.post('/auth/login', data);
    return response.data;
  },

  logout: () => {
    localStorage.removeItem('vatrade-token');
    localStorage.removeItem('vatrade-user');
  },

  getToken: () => localStorage.getItem('vatrade-token'),

  getUser: () => {
    const user = localStorage.getItem('vatrade-user');
    return user ? JSON.parse(user) : null;
  },

  setAuth: (token: string, user: any) => {
    localStorage.setItem('vatrade-token', token);
    localStorage.setItem('vatrade-user', JSON.stringify(user));
  },

  isAuthenticated: () => {
    return !!localStorage.getItem('vatrade-token');
  },
};

export default api;
