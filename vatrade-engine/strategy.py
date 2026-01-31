from abc import ABC, abstractmethod
from typing import Dict, Optional, List
import logging
from indicators import TechnicalIndicators

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


class EMA20EMA50RSIStrategy(BaseStrategy):
    """
    Advanced EMA20/EMA50 with RSI Strategy
    
    Entry Conditions (BUY):
    - Trend Filter: close > EMA50 AND EMA50 > EMA50[1] (uptrend)
    - Pullback: low[1] <= EMA20[1] (previous candle touched EMA20)
    - Breakout: close > EMA20 (current close above EMA20)
    - Not Too High: close < EMA20 * 1.06 (within 6% of EMA20)
    - RSI: RSI > 50 (momentum confirmation)
    - Cooldown: 2 candles since last buy
    
    Exit Management:
    - Stop Loss: low[1] * 0.997 (0.3% below pullback low)
    - Take Profit 1: Risk:Reward 1:2 → sell 50% position
    - Trailing Stop: 2% from highest price after TP1
    - Breakeven: Move SL to entry when profit >= 2%
    """
    
    def __init__(self, client, symbol: str, trade_amount: float):
        super().__init__(client, symbol, trade_amount)
        self.interval = 300  # Check every 5 minutes
        
        # Position state
        self.position = None  # None or dict with entry details
        self.last_buy_bar = -10  # Last candle index when bought
        self.current_bar = 0  # Current candle index
        self.highest_price_since_entry = 0  # For trailing stop
        self.tp1_reached = False  # TP1 status
        
    async def analyze(self) -> Optional[Dict]:
        """Analyze market using EMA20/EMA50/RSI strategy"""
        try:
            # Get candlestick data (15-minute candles)
            # Need enough data for EMA50 calculation + history
            klines = await self.client.get_klines(
                symbol=self.symbol,
                interval='15m',
                limit=100
            )
            
            if len(klines) < 60:
                logger.warning(f"Insufficient data for {self.symbol}")
                return None
            
            # Extract OHLC data
            closes = [float(k[4]) for k in klines]  # Close prices
            lows = [float(k[3]) for k in klines]    # Low prices
            highs = [float(k[2]) for k in klines]   # High prices
            
            # Calculate indicators
            ema20_series = TechnicalIndicators.calculate_ema_series(closes, 20)
            ema50_series = TechnicalIndicators.calculate_ema_series(closes, 50)
            rsi = TechnicalIndicators.calculate_rsi(closes, 14)
            
            # Current values
            current_close = closes[-1]
            current_low = lows[-1]
            current_high = highs[-1]
            ema20 = ema20_series[-1]
            ema50 = ema50_series[-1]
            
            # Previous values
            prev_low = lows[-2]
            prev_ema20 = ema20_series[-2]
            prev_ema50 = ema50_series[-2]
            
            # Increment bar counter
            self.current_bar += 1
            
            # Check if we have valid indicators
            if ema20 is None or ema50 is None or rsi is None:
                logger.warning(f"Indicators not ready for {self.symbol}")
                return None
            
            signal = None
            
            # === POSITION MANAGEMENT (if we have open position) ===
            if self.position:
                signal = await self._check_exit_conditions(
                    current_close, current_low, current_high, ema20
                )
                if signal:
                    return signal
            
            # === ENTRY LOGIC (if no position) ===
            # Only check entry if we don't have any open position
            # Must wait until position is fully closed (TP/CL) before buying again
            if not self.position:
                signal = self._check_entry_conditions(
                    current_close, current_low, ema20, ema50, 
                    prev_low, prev_ema20, prev_ema50, rsi
                )
            
            # Log current state
            logger.debug(
                f"{self.symbol} - Price: {current_close:.2f}, "
                f"EMA20: {ema20:.2f}, EMA50: {ema50:.2f}, RSI: {rsi:.2f}, "
                f"Position: {'OPEN' if self.position else 'NONE'}"
            )
            
            return signal
            
        except Exception as e:
            logger.error(f"Error in EMA20/EMA50/RSI strategy: {str(e)}")
            return None
    
    def _check_entry_conditions(self, current_close: float, current_low: float,
                                ema20: float, ema50: float, prev_low: float,
                                prev_ema20: float, prev_ema50: float, 
                                rsi: float) -> Optional[Dict]:
        """Check all entry conditions for BUY signal"""
        
        # IMPORTANT: Only buy if NO position is open
        # Must wait until current position is fully closed before buying again
        if self.position is not None:
            return None
        
        # A. Trend Filter (Uptrend)
        trend_up = current_close > ema50 and ema50 > prev_ema50
        
        # B. Pullback occurred (previous candle touched EMA20)
        pullback_prev = prev_low <= prev_ema20
        
        # C. Breakout (current close above EMA20)
        break_up_now = current_close > ema20
        
        # D. Not too high (within 6% of EMA20)
        not_too_high = current_close < ema20 * 1.06
        
        # E. RSI momentum (RSI > 50)
        rsi_ok = rsi > 50
        
        # F. Cooldown (2 candles since last buy)
        cooldown_bars = 2
        can_buy = (self.current_bar - self.last_buy_bar) > cooldown_bars
        
        # Check if ALL conditions are met
        buy_signal = (
            trend_up and pullback_prev and break_up_now and 
            not_too_high and rsi_ok and can_buy
        )
        
        if buy_signal:
            # Calculate stop loss (0.3% below previous low)
            stop_loss = prev_low * 0.997
            
            # Calculate risk
            risk = current_close - stop_loss
            
            # Calculate TP1 (Risk:Reward 1:2)
            take_profit_1 = current_close + (risk * 2)
            
            logger.info(
                f"🟢 BUY SIGNAL for {self.symbol} at {current_close:.2f} | "
                f"EMA20={ema20:.2f}, EMA50={ema50:.2f}, RSI={rsi:.2f} | "
                f"SL={stop_loss:.2f}, TP1={take_profit_1:.2f}"
            )
            
            # Update position state
            self.position = {
                'entry_price': current_close,
                'stop_loss': stop_loss,
                'take_profit_1': take_profit_1,
                'initial_amount': self.trade_amount,
                'remaining_amount': self.trade_amount,
                'risk': risk,
                'pullback_low': prev_low
            }
            self.last_buy_bar = self.current_bar
            self.highest_price_since_entry = current_close
            self.tp1_reached = False
            
            return {
                'type': 'buy',
                'price': current_close,
                'amount': self.trade_amount,
                'stop_loss': stop_loss,
                'take_profit': take_profit_1,
                'reason': (
                    f'EMA20/50/RSI Strategy: Uptrend + Pullback + Breakout | '
                    f'EMA20={ema20:.2f}, EMA50={ema50:.2f}, RSI={rsi:.2f}'
                )
            }
        
        return None
    
    async def _check_exit_conditions(self, current_close: float, 
                                     current_low: float, current_high: float,
                                     ema20: float) -> Optional[Dict]:
        """Check exit conditions: Stop Loss, TP1, Trailing Stop, Breakeven"""
        
        if not self.position:
            return None
        
        entry_price = self.position['entry_price']
        stop_loss = self.position['stop_loss']
        take_profit_1 = self.position['take_profit_1']
        remaining_amount = self.position['remaining_amount']
        
        # Update highest price for trailing stop
        if current_high > self.highest_price_since_entry:
            self.highest_price_since_entry = current_high
        
        # Calculate current profit percentage
        profit_pct = ((current_close - entry_price) / entry_price) * 100
        
        # === 1. BREAKEVEN (Move SL to entry when profit >= 2%) ===
        if profit_pct >= 2 and stop_loss < entry_price:
            self.position['stop_loss'] = entry_price
            stop_loss = entry_price
            logger.info(
                f"📊 BREAKEVEN activated for {self.symbol} | "
                f"SL moved to entry: {entry_price:.2f}"
            )
        
        # === 2. STOP LOSS (Cut Loss) ===
        if current_low <= stop_loss:
            logger.info(
                f"🔴 STOP LOSS hit for {self.symbol} at {current_close:.2f} | "
                f"Entry: {entry_price:.2f}, Loss: {profit_pct:.2f}%"
            )
            
            # Close entire position
            signal = {
                'type': 'sell',
                'price': current_close,
                'amount': remaining_amount,
                'reason': f'Stop Loss triggered at {stop_loss:.2f} | Loss: {profit_pct:.2f}%'
            }
            
            # Reset position
            self.position = None
            self.tp1_reached = False
            self.highest_price_since_entry = 0
            
            return signal
        
        # === 3. TAKE PROFIT 1 (Partial Exit at TP1) ===
        if not self.tp1_reached and current_high >= take_profit_1:
            self.tp1_reached = True
            
            # Sell 50% of position
            partial_amount = self.position['initial_amount'] * 0.5
            self.position['remaining_amount'] = remaining_amount - partial_amount
            
            logger.info(
                f"🟢 TAKE PROFIT 1 reached for {self.symbol} at {current_close:.2f} | "
                f"Selling 50% position | Profit: {profit_pct:.2f}%"
            )
            
            return {
                'type': 'sell',
                'price': current_close,
                'amount': partial_amount,
                'reason': f'Take Profit 1 (50% exit) | Profit: {profit_pct:.2f}%'
            }
        
        # === 4. TRAILING STOP (After TP1, track remaining 50%) ===
        if self.tp1_reached:
            # Trailing stop = 2% below highest price
            trailing_stop = self.highest_price_since_entry * 0.98
            
            if current_low <= trailing_stop:
                logger.info(
                    f"🟡 TRAILING STOP hit for {self.symbol} at {current_close:.2f} | "
                    f"Highest: {self.highest_price_since_entry:.2f}, "
                    f"Final Profit: {profit_pct:.2f}%"
                )
                
                # Close remaining position
                signal = {
                    'type': 'sell',
                    'price': current_close,
                    'amount': remaining_amount,
                    'reason': f'Trailing Stop (2%) | Final Profit: {profit_pct:.2f}%'
                }
                
                # Reset position
                self.position = None
                self.tp1_reached = False
                self.highest_price_since_entry = 0
                
                return signal
        
        return None


class StrategyFactory:
    """Factory for creating strategy instances"""
    
    STRATEGIES = {
        'simple_moving_average': SimpleMovingAverageStrategy,
        'rsi': RSIStrategy,
        'ema20_ema50_rsi': EMA20EMA50RSIStrategy,
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
