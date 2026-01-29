import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const credentialApi = axios.create({
  baseURL: `${API_BASE_URL}/user-credentials`,
});

// Add token to requests
credentialApi.interceptors.request.use((config) => {
  const token = localStorage.getItem('vatrade-token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export interface Credential {
  id: string;
  userId: string;
  apiKey: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCredentialDto {
  apiKey: string;
  secretKey: string;
}

export interface UpdateCredentialDto {
  apiKey?: string;
  secretKey?: string;
}

export const credentialService = {
  async getCredentials(): Promise<Credential> {
    const response = await credentialApi.get('/');
    return response.data;
  },

  async createCredentials(data: CreateCredentialDto): Promise<Credential> {
    const response = await credentialApi.post('/', data);
    return response.data;
  },

  async updateCredentials(data: UpdateCredentialDto): Promise<Credential> {
    const response = await credentialApi.put('/', data);
    return response.data;
  },

  async deleteCredentials(): Promise<{ message: string }> {
    const response = await credentialApi.delete('/');
    return response.data;
  },
};
