"""
Technical Indicators Module
Provides calculation functions for EMA, RSI, and other trading indicators
"""
import numpy as np
from typing import List, Optional


class TechnicalIndicators:
    """Technical indicators calculator for trading strategies"""
    
    @staticmethod
    def calculate_ema(prices: List[float], period: int) -> Optional[float]:
        """
        Calculate Exponential Moving Average (EMA)
        
        Formula:
        - Multiplier = 2 / (period + 1)
        - EMA = (Price × Multiplier) + (Previous EMA × (1 - Multiplier))
        - First EMA uses SMA as seed
        
        Args:
            prices: List of prices (closing prices)
            period: EMA period (e.g., 20, 50)
            
        Returns:
            Current EMA value or None if insufficient data
        """
        if len(prices) < period:
            return None
        
        # Calculate multiplier
        multiplier = 2 / (period + 1)
        
        # Initialize with SMA (Simple Moving Average)
        sma = sum(prices[:period]) / period
        ema = sma
        
        # Calculate EMA for each subsequent price
        for price in prices[period:]:
            ema = (price * multiplier) + (ema * (1 - multiplier))
        
        return ema
    
    @staticmethod
    def calculate_ema_series(prices: List[float], period: int) -> List[Optional[float]]:
        """
        Calculate EMA series for all prices
        
        Args:
            prices: List of prices
            period: EMA period
            
        Returns:
            List of EMA values (None for insufficient data points)
        """
        ema_values = []
        
        for i in range(len(prices)):
            if i < period - 1:
                ema_values.append(None)
            else:
                ema = TechnicalIndicators.calculate_ema(prices[:i+1], period)
                ema_values.append(ema)
        
        return ema_values
    
    @staticmethod
    def calculate_rsi(prices: List[float], period: int = 14) -> Optional[float]:
        """
        Calculate Relative Strength Index (RSI)
        
        Formula:
        1. Calculate price deltas
        2. Separate gains and losses
        3. Calculate average gain and average loss (smoothed)
        4. RS = Average Gain / Average Loss
        5. RSI = 100 - (100 / (1 + RS))
        
        Args:
            prices: List of prices (closing prices)
            period: RSI period (default: 14)
            
        Returns:
            Current RSI value or None if insufficient data
        """
        if len(prices) < period + 1:
            return None
        
        # Calculate price deltas
        deltas = [prices[i] - prices[i-1] for i in range(1, len(prices))]
        
        # Separate gains and losses
        gains = [delta if delta > 0 else 0 for delta in deltas]
        losses = [-delta if delta < 0 else 0 for delta in deltas]
        
        # Calculate first average (simple average)
        avg_gain = sum(gains[:period]) / period
        avg_loss = sum(losses[:period]) / period
        
        # Calculate smoothed averages for remaining periods
        for i in range(period, len(gains)):
            avg_gain = (avg_gain * (period - 1) + gains[i]) / period
            avg_loss = (avg_loss * (period - 1) + losses[i]) / period
        
        # Avoid division by zero
        if avg_loss == 0:
            return 100
        
        # Calculate RS and RSI
        rs = avg_gain / avg_loss
        rsi = 100 - (100 / (1 + rs))
        
        return rsi
    
    @staticmethod
    def is_bullish_crossover(fast_ema: float, slow_ema: float, 
                            prev_fast_ema: float, prev_slow_ema: float) -> bool:
        """
        Check if bullish crossover occurred (fast EMA crosses above slow EMA)
        
        Args:
            fast_ema: Current fast EMA value
            slow_ema: Current slow EMA value
            prev_fast_ema: Previous fast EMA value
            prev_slow_ema: Previous slow EMA value
            
        Returns:
            True if bullish crossover occurred
        """
        return prev_fast_ema <= prev_slow_ema and fast_ema > slow_ema
    
    @staticmethod
    def is_bearish_crossover(fast_ema: float, slow_ema: float,
                            prev_fast_ema: float, prev_slow_ema: float) -> bool:
        """
        Check if bearish crossover occurred (fast EMA crosses below slow EMA)
        
        Args:
            fast_ema: Current fast EMA value
            slow_ema: Current slow EMA value
            prev_fast_ema: Previous fast EMA value
            prev_slow_ema: Previous slow EMA value
            
        Returns:
            True if bearish crossover occurred
        """
        return prev_fast_ema >= prev_slow_ema and fast_ema < slow_ema
    
    @staticmethod
    def is_rsi_oversold(rsi: float, threshold: float = 30) -> bool:
        """
        Check if RSI is in oversold territory
        
        Args:
            rsi: Current RSI value
            threshold: Oversold threshold (default: 30)
            
        Returns:
            True if RSI is oversold
        """
        return rsi < threshold
    
    @staticmethod
    def is_rsi_overbought(rsi: float, threshold: float = 70) -> bool:
        """
        Check if RSI is in overbought territory
        
        Args:
            rsi: Current RSI value
            threshold: Overbought threshold (default: 70)
            
        Returns:
            True if RSI is overbought
        """
        return rsi > threshold
