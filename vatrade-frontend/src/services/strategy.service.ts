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

export interface StrategyCoin {
  id: string;
  userId: string;
  symbol: string;
  allocationAmount: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCoinDto {
  symbol: string;
  allocationAmount: number;
  isActive?: boolean;
}

export interface UpdateCoinDto {
  symbol?: string;
  allocationAmount?: number;
  isActive?: boolean;
}

class StrategyService {
  async getCoins(): Promise<StrategyCoin[]> {
    const response = await api.get<StrategyCoin[]>('/strategy-coins');
    return response.data;
  }

  async getCoin(id: string): Promise<StrategyCoin> {
    const response = await api.get<StrategyCoin>(`/strategy-coins/${id}`);
    return response.data;
  }

  async createCoin(data: CreateCoinDto): Promise<StrategyCoin> {
    const response = await api.post<StrategyCoin>('/strategy-coins', data);
    return response.data;
  }

  async updateCoin(id: string, data: UpdateCoinDto): Promise<StrategyCoin> {
    const response = await api.put<StrategyCoin>(`/strategy-coins/${id}`, data);
    return response.data;
  }

  async deleteCoin(id: string): Promise<void> {
    await api.delete(`/strategy-coins/${id}`);
  }
}

export const strategyService = new StrategyService();
