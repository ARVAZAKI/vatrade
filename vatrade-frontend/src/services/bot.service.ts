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

export interface StartBotRequest {
  coinId: string;
  credentialId: string;
  strategy?: string;
}

export interface BotStatusResponse {
  success: boolean;
  data: {
    totalCoins: number;
    activeCoins: number;
    runningBots: number;
    bots: Array<{
      coinId: string;
      botId: string;
      symbol: string;
      startedAt: string;
    }>;
  };
}

const botService = {
  /**
   * Start trading bot for a coin
   */
  async startBot(request: StartBotRequest) {
    const response = await api.post('/strategy-coins/bot/start', request);
    return response.data;
  },

  /**
   * Stop trading bot for a coin
   */
  async stopBot(coinId: string) {
    const response = await api.post(`/strategy-coins/bot/stop/${coinId}`);
    return response.data;
  },

  /**
   * Get bot status
   */
  async getBotStatus(): Promise<BotStatusResponse> {
    const response = await api.get('/strategy-coins/bot/status');
    return response.data;
  },
};

export default botService;
