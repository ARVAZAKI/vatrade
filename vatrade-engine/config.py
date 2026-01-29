from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    """Application settings"""
    
    # Server
    host: str = "0.0.0.0"
    port: int = 8000
    debug: bool = True
    
    # Backend API
    backend_url: str = "http://backend:3000"
    
    # Database
    database_url: str = "postgresql://postgres:postgres@postgres:5432/vatrade"
    
    # Redis
    redis_url: str = "redis://redis:6379/0"
    
    # Binance API
    binance_api_url: str = "https://api.binance.com"
    binance_testnet: bool = False
    
    # Trading
    default_trade_amount: float = 10.0
    max_concurrent_bots: int = 10
    
    class Config:
        env_file = ".env"
        case_sensitive = False


# Global settings instance
settings = Settings()
