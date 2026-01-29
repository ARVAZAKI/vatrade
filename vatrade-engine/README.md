# VATrade Bot Engine

Python-based automated trading bot engine for cryptocurrency trading.

## Features

- 🤖 Automated trading bot management
- 📊 Multiple trading strategies (SMA, RSI)
- 🔐 Secure API credential management
- 📈 Real-time Binance integration
- 🚀 FastAPI REST API
- 🐳 Docker support

## API Endpoints

### Bot Management

- `POST /bot/start` - Start a trading bot
- `POST /bot/stop` - Stop a running bot
- `POST /bot/status` - Get bot status
- `GET /bots/active` - List all active bots

## Available Strategies

1. **Simple Moving Average (SMA)** - `simple_moving_average`
   - Crossover strategy using short and long-term moving averages
   
2. **RSI Strategy** - `rsi`
   - Relative Strength Index with overbought/oversold signals

## Setup

### Local Development

1. Install dependencies:
```bash
pip install -r requirements.txt
```

2. Copy environment file:
```bash
cp .env.example .env
```

3. Run the server:
```bash
uvicorn main:app --reload
```

### Docker

```bash
docker-compose up engine
```

## Architecture

```
vatrade-engine/
├── main.py              # FastAPI application
├── bot_manager.py       # Bot lifecycle management
├── binance_client.py    # Binance API wrapper
├── strategy.py          # Trading strategies
├── config.py            # Configuration
└── requirements.txt     # Dependencies
```

## Integration with Backend

Engine menerima credentials **langsung dari backend** saat start bot:

1. **Backend** mengambil user credentials dari database
2. **Backend** mengirim POST request ke `/bot/start` dengan `api_key` dan `secret_key`
3. **Engine** menggunakan credentials untuk koneksi ke Binance
4. **Engine** menjalankan bot dan tracking trades

### Contoh Request dari NestJS Backend

```typescript
// Di NestJS backend service
async startUserBot(userId: number, credentialId: number, strategy: string) {
  // 1. Ambil credentials dari database
  const credential = await this.userCredentialsService.findOne(credentialId);
  
  // 2. Kirim request ke engine dengan credentials
  const response = await axios.post('http://engine:8000/bot/start', {
    user_id: userId,
    credential_id: credentialId,
    api_key: credential.apiKey,        // ← Per user berbeda
    secret_key: credential.secretKey,  // ← Per user berbeda
    strategy: strategy,
    symbol: 'BTC/USDT',
    trade_amount: 100
  });
  
  return response.data;
}

// Stop bot
async stopUserBot(userId: number, botId: string) {
  await axios.post('http://engine:8000/bot/stop', {
    user_id: userId,
    bot_id: botId
  });
}

// Get status
async getBotStatus(userId: number, botId?: string) {
  const response = await axios.post('http://engine:8000/bot/status', {
    user_id: userId,
    bot_id: botId  // Optional, null = all user's bots
  });
  return response.data;
}
```

**🔒 Keamanan:**
- API key dan secret key **berbeda per user**
- Credentials **dikirim dari backend** (sudah ter-enkripsi di database)
- Credentials **tidak disimpan** di engine, hanya di memory saat bot running
- Binance API endpoint **sama untuk semua user** (api.binance.com)

## Environment Variables

- `HOST` - Server host (default: 0.0.0.0)
- `PORT` - Server port (default: 8000)
- `DEBUG` - Debug mode (default: True)
- `BACKEND_URL` - Backend API URL
- `DATABASE_URL` - PostgreSQL connection string
- `REDIS_URL` - Redis connection string

## License

MIT
