const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export const config = {
  apiUrl: API_URL,
  endpoints: {
    health: `${API_URL}/health`,
    googleAuth: `${API_URL}/auth/google`,
  },
};
