from abc import ABC, abstractmethod
from typing import Dict, Optional
import logging

logger = logging.getLogger(__name__)


class BaseStrategy(ABC):
    """Base class for trading strategies"""
    
    def __init__(self, client, symbol: str, trade_amount: float):
        self.client = client
        self.symbol = symbol
        self.trade_amount = trade_amount
        self.interval = 60  # Default check interval in seconds
    
    @abstractmethod
    async def analyze(self) -> Optional[Dict]:
        """
        Analyze market and return trading signal
        
        Returns:
            Dict with 'type' (buy/sell), 'price', 'amount' or None if no signal
        """
        pass
    
    def get_interval(self) -> int:
        """Get check interval in seconds"""
        return self.interval


class SimpleMovingAverageStrategy(BaseStrategy):
    """
    Simple Moving Average (SMA) Crossover Strategy
    
    Buy signal: Short-term SMA crosses above long-term SMA
    Sell signal: Short-term SMA crosses below long-term SMA
    """
    
    def __init__(self, client, symbol: str, trade_amount: float,
                 short_period: int = 7, long_period: int = 25):
        super().__init__(client, symbol, trade_amount)
        self.short_period = short_period
        self.long_period = long_period
        self.last_short_sma = None
        self.last_long_sma = None
        self.position = None  # None, 'long', 'short'
        self.interval = 300  # Check every 5 minutes
    
    async def analyze(self) -> Optional[Dict]:
        """Analyze using SMA crossover"""
        try:
            # Get candlestick data (15-minute candles)
            klines = await self.client.get_klines(
                symbol=self.symbol,
                interval='15m',
                limit=self.long_period + 10
            )
            
            # Extract closing prices
            closes = [float(k[4]) for k in klines]  # Index 4 is close price
            
            # Calculate SMAs
            short_sma = sum(closes[-self.short_period:]) / self.short_period
            long_sma = sum(closes[-self.long_period:]) / self.long_period
            
            current_price = closes[-1]
            
            signal = None
            
            # Check for crossover
            if self.last_short_sma is not None and self.last_long_sma is not None:
                # Bullish crossover - BUY signal
                if (self.last_short_sma <= self.last_long_sma and 
                    short_sma > long_sma and 
                    self.position != 'long'):
                    
                    logger.info(f"BUY signal for {self.symbol}: SMA crossover detected")
                    signal = {
                        'type': 'buy',
                        'price': current_price,
                        'amount': self.trade_amount,
                        'reason': f'SMA crossover (short={short_sma:.2f}, long={long_sma:.2f})'
                    }
                    self.position = 'long'
                
                # Bearish crossover - SELL signal
                elif (self.last_short_sma >= self.last_long_sma and 
                      short_sma < long_sma and 
                      self.position == 'long'):
                    
                    logger.info(f"SELL signal for {self.symbol}: SMA crossover detected")
                    signal = {
                        'type': 'sell',
                        'price': current_price,
                        'amount': self.trade_amount,
                        'reason': f'SMA crossover (short={short_sma:.2f}, long={long_sma:.2f})'
                    }
                    self.position = None
            
            # Update last values
            self.last_short_sma = short_sma
            self.last_long_sma = long_sma
            
            # Log current state
            logger.debug(
                f"{self.symbol} - Price: {current_price:.2f}, "
                f"Short SMA: {short_sma:.2f}, Long SMA: {long_sma:.2f}, "
                f"Position: {self.position}"
            )
            
            return signal
            
        except Exception as e:
            logger.error(f"Error in SMA strategy analysis: {str(e)}")
            return None


class RSIStrategy(BaseStrategy):
    """
    RSI (Relative Strength Index) Strategy
    
    Buy signal: RSI < 30 (oversold)
    Sell signal: RSI > 70 (overbought)
    """
    
    def __init__(self, client, symbol: str, trade_amount: float,
                 period: int = 14, oversold: float = 30, overbought: float = 70):
        super().__init__(client, symbol, trade_amount)
        self.period = period
        self.oversold = oversold
        self.overbought = overbought
        self.position = None
        self.interval = 300  # Check every 5 minutes
    
    def calculate_rsi(self, prices: list) -> float:
        """Calculate RSI indicator"""
        deltas = [prices[i] - prices[i-1] for i in range(1, len(prices))]
        
        gains = [d if d > 0 else 0 for d in deltas]
        losses = [-d if d < 0 else 0 for d in deltas]
        
        avg_gain = sum(gains[-self.period:]) / self.period
        avg_loss = sum(losses[-self.period:]) / self.period
        
        if avg_loss == 0:
            return 100
        
        rs = avg_gain / avg_loss
        rsi = 100 - (100 / (1 + rs))
        
        return rsi
    
    async def analyze(self) -> Optional[Dict]:
        """Analyze using RSI"""
        try:
            # Get candlestick data
            klines = await self.client.get_klines(
                symbol=self.symbol,
                interval='15m',
                limit=self.period + 20
            )
            
            # Extract closing prices
            closes = [float(k[4]) for k in klines]
            current_price = closes[-1]
            
            # Calculate RSI
            rsi = self.calculate_rsi(closes)
            
            signal = None
            
            # Oversold - BUY signal
            if rsi < self.oversold and self.position != 'long':
                logger.info(f"BUY signal for {self.symbol}: RSI oversold ({rsi:.2f})")
                signal = {
                    'type': 'buy',
                    'price': current_price,
                    'amount': self.trade_amount,
                    'reason': f'RSI oversold ({rsi:.2f})'
                }
                self.position = 'long'
            
            # Overbought - SELL signal
            elif rsi > self.overbought and self.position == 'long':
                logger.info(f"SELL signal for {self.symbol}: RSI overbought ({rsi:.2f})")
                signal = {
                    'type': 'sell',
                    'price': current_price,
                    'amount': self.trade_amount,
                    'reason': f'RSI overbought ({rsi:.2f})'
                }
                self.position = None
            
            logger.debug(f"{self.symbol} - Price: {current_price:.2f}, RSI: {rsi:.2f}")
            
            return signal
            
        except Exception as e:
            logger.error(f"Error in RSI strategy analysis: {str(e)}")
            return None


class StrategyFactory:
    """Factory for creating strategy instances"""
    
    STRATEGIES = {
        'simple_moving_average': SimpleMovingAverageStrategy,
        'rsi': RSIStrategy,
    }
    
    @classmethod
    def create(cls, strategy_name: str, client, symbol: str, 
               trade_amount: float) -> BaseStrategy:
        """Create strategy instance by name"""
        
        strategy_class = cls.STRATEGIES.get(strategy_name.lower())
        
        if not strategy_class:
            raise ValueError(
                f"Unknown strategy: {strategy_name}. "
                f"Available: {', '.join(cls.STRATEGIES.keys())}"
            )
        
        return strategy_class(client, symbol, trade_amount)
    
    @classmethod
    def list_strategies(cls) -> list:
        """List available strategies"""
        return list(cls.STRATEGIES.keys())
