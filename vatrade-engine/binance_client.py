import asyncio
import httpx
from binance.client import Client
from binance.exceptions import BinanceAPIException
from typing import Dict, Optional
import logging

from config import settings

logger = logging.getLogger(__name__)


class BinanceClient:
    """Wrapper for Binance API client with credential management"""
    
    def __init__(self, user_id: int, credential_id: int, api_key: str, secret_key: str):
        self.user_id = user_id
        self.credential_id = credential_id
        self.api_key = api_key
        self.api_secret = secret_key
        self.client: Optional[Client] = None
    
    async def initialize(self):
        """Initialize Binance client with provided credentials"""
        try:
            # Credentials sudah diterima dari backend via constructor
            
            # Initialize Binance client
            # Testnet mode bisa diubah via environment variable
            self.client = Client(
                api_key=self.api_key,
                api_secret=self.api_secret,
                testnet=settings.binance_testnet  # False = Production, True = Testnet
            )
            
            # Test connection
            await self._test_connection()
            
            logger.info(f"Binance client initialized for user {self.user_id}")
            
        except Exception as e:
            logger.error(f"Failed to initialize Binance client: {str(e)}")
            raise
    
    async def _test_connection(self):
        """Test API connection"""
        try:
            # Run in executor to avoid blocking
            loop = asyncio.get_event_loop()
            await loop.run_in_executor(None, self.client.ping)
            logger.info("Binance API connection successful")
        except BinanceAPIException as e:
            logger.error(f"Binance API connection failed: {str(e)}")
            raise
    
    async def get_ticker(self, symbol: str) -> Dict:
        """Get current ticker price"""
        try:
            loop = asyncio.get_event_loop()
            ticker = await loop.run_in_executor(
                None, 
                self.client.get_symbol_ticker,
                symbol.replace('/', '')  # BTC/USDT -> BTCUSDT
            )
            return ticker
        except Exception as e:
            logger.error(f"Failed to get ticker for {symbol}: {str(e)}")
            raise
    
    async def get_klines(self, symbol: str, interval: str, limit: int = 100) -> list:
        """
        Get candlestick data
        
        interval: 1m, 5m, 15m, 1h, 4h, 1d, etc.
        """
        try:
            loop = asyncio.get_event_loop()
            klines = await loop.run_in_executor(
                None,
                self.client.get_klines,
                symbol.replace('/', ''),
                interval,
                limit
            )
            return klines
        except Exception as e:
            logger.error(f"Failed to get klines for {symbol}: {str(e)}")
            raise
    
    async def get_account_info(self) -> Dict:
        """Get full account information"""
        try:
            loop = asyncio.get_event_loop()
            account = await loop.run_in_executor(None, self.client.get_account)
            return account
        except Exception as e:
            logger.error(f"Failed to get account info: {str(e)}")
            raise
    
    async def get_account_balance(self) -> Dict:
        """Get account balance (simplified, only non-zero)"""
        try:
            loop = asyncio.get_event_loop()
            account = await loop.run_in_executor(None, self.client.get_account)
            
            # Parse balances
            balances = {}
            for balance in account['balances']:
                free = float(balance['free'])
                locked = float(balance['locked'])
                if free > 0 or locked > 0:
                    balances[balance['asset']] = {
                        'free': free,
                        'locked': locked,
                        'total': free + locked
                    }
            
            return balances
        except Exception as e:
            logger.error(f"Failed to get account balance: {str(e)}")
            raise
    
    async def place_order(self, symbol: str, side: str, amount: float, 
                         price: Optional[float] = None) -> Dict:
        """
        Place an order
        
        side: BUY or SELL
        amount: quantity to trade
        price: limit price (None for market order)
        """
        try:
            loop = asyncio.get_event_loop()
            
            symbol_clean = symbol.replace('/', '')  # BTC/USDT -> BTCUSDT
            
            if price:
                # Limit order
                order = await loop.run_in_executor(
                    None,
                    self.client.create_order,
                    symbol_clean,
                    side,
                    'LIMIT',
                    'GTC',  # Good till cancelled
                    amount,
                    str(price)
                )
            else:
                # Market order
                order = await loop.run_in_executor(
                    None,
                    self.client.create_order,
                    symbol_clean,
                    side,
                    'MARKET',
                    None,
                    amount
                )
            
            logger.info(f"Order placed: {order['orderId']} - {side} {amount} {symbol}")
            return order
            
        except BinanceAPIException as e:
            logger.error(f"Binance API error placing order: {str(e)}")
            raise
        except Exception as e:
            logger.error(f"Failed to place order: {str(e)}")
            raise
    
    async def get_order_status(self, symbol: str, order_id: int) -> Dict:
        """Get order status"""
        try:
            loop = asyncio.get_event_loop()
            order = await loop.run_in_executor(
                None,
                self.client.get_order,
                symbol.replace('/', ''),
                order_id
            )
            return order
        except Exception as e:
            logger.error(f"Failed to get order status: {str(e)}")
            raise
    
    async def cancel_order(self, symbol: str, order_id: int) -> Dict:
        """Cancel an order"""
        try:
            loop = asyncio.get_event_loop()
            result = await loop.run_in_executor(
                None,
                self.client.cancel_order,
                symbol.replace('/', ''),
                order_id
            )
            logger.info(f"Order cancelled: {order_id}")
            return result
        except Exception as e:
            logger.error(f"Failed to cancel order: {str(e)}")
            raise
    
    async def close(self):
        """Cleanup resources"""
        # python-binance doesn't require explicit cleanup
        logger.info(f"Binance client closed for user {self.user_id}")
