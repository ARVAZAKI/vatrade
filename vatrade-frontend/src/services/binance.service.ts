import { config } from '../config/api';
import axios from 'axios';

const api = axios.create({
  baseURL: config.apiUrl,
});

// Add token to requests
api.interceptors.request.use((req) => {
  const token = localStorage.getItem('vatrade-token');
  if (token) {
    req.headers.Authorization = `Bearer ${token}`;
  }
  return req;
});

export interface BinanceBalance {
  [asset: string]: {
    free: number;
    locked: number;
    total: number;
  };
}

export interface BinanceAccountInfo {
  makerCommission?: number;
  takerCommission?: number;
  canTrade?: boolean;
  canWithdraw?: boolean;
  canDeposit?: boolean;
  accountType?: string;
  balances?: Array<{
    asset: string;
    free: string;
    locked: string;
  }>;
  permissions?: string[];
}

const binanceService = {
  /**
   * Get Binance account information
   */
  async getAccount(credentialId: string) {
    const response = await api.get(`/binance/account?credentialId=${credentialId}`);
    return response.data;
  },

  /**
   * Get Binance account balance (simplified, non-zero only)
   */
  async getBalance(credentialId: string): Promise<{ success: boolean; message: string; data: { balances: BinanceBalance } }> {
    const response = await api.get(`/binance/balance?credentialId=${credentialId}`);
    return response.data;
  },

  /**
   * Get ticker price for a symbol
   */
  async getTicker(credentialId: string, symbol: string = 'BTCUSDT') {
    const response = await api.get(`/binance/ticker?credentialId=${credentialId}&symbol=${symbol}`);
    return response.data;
  },
};

export default binanceService;
