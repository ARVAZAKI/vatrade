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

export interface BinanceOrder {
  symbol: string;
  orderId: number;
  clientOrderId: string;
  price: string;
  origQty: string;
  executedQty: string;
  cummulativeQuoteQty: string;
  status: string;
  timeInForce: string;
  type: string;
  side: string;
  time: number;
  updateTime: number;
}

export interface BinanceTrade {
  symbol: string;
  id: number;
  orderId: number;
  price: string;
  qty: string;
  quoteQty: string;
  commission: string;
  commissionAsset: string;
  time: number;
  isBuyer: boolean;
  isMaker: boolean;
  isBestMatch: boolean;
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
   * Get Binance account information (REST API)
   */
  async getAccount(credentialId: string) {
    const response = await api.get(`/binance/account?credentialId=${credentialId}`);
    return response.data;
  },

  /**
   * Get Binance account balance (REST API, simplified)
   */
  async getBalance(credentialId: string): Promise<{ success: boolean; message: string; data: { balances: BinanceBalance } }> {
    const response = await api.get(`/binance/balance?credentialId=${credentialId}`);
    return response.data;
  },

  /**
   * Get balance via WebSocket API (real-time)
   */
  async getBalanceWebSocket(credentialId: string): Promise<{ success: boolean; message: string; data: { balances: BinanceBalance } }> {
    const response = await api.get(`/binance/ws/balance?credentialId=${credentialId}`);
    return response.data;
  },

  /**
   * Get order history via WebSocket API
   */
  async getOrdersWebSocket(credentialId: string, symbol: string = 'BTCUSDT', limit: number = 100): Promise<{ success: boolean; message: string; data: { orders: BinanceOrder[] } }> {
    const response = await api.get(`/binance/ws/orders?credentialId=${credentialId}&symbol=${symbol}&limit=${limit}`);
    return response.data;
  },

  /**
   * Get trade history via WebSocket API
   */
  async getTradesWebSocket(credentialId: string, symbol: string = 'BTCUSDT', limit: number = 100): Promise<{ success: boolean; message: string; data: { trades: BinanceTrade[] } }> {
    const response = await api.get(`/binance/ws/trades?credentialId=${credentialId}&symbol=${symbol}&limit=${limit}`);
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
