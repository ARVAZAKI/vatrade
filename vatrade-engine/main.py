from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Dict, Optional
import uvicorn
import logging

from config import settings
from bot_manager import BotManager

# Configure logging
logging.basicConfig(
    level=logging.INFO if settings.debug else logging.WARNING,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Initialize FastAPI app
app = FastAPI(
    title="VATrade Bot Engine",
    description="Automated trading bot engine for cryptocurrency trading",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify exact origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Bot manager instance
bot_manager = BotManager()


# Request/Response models
class BotStartRequest(BaseModel):
    user_id: int
    credential_id: int
    api_key: str  # Binance API key dari backend
    secret_key: str  # Binance secret key dari backend
    strategy: str = "simple_moving_average"
    symbol: str = "BTC/USDT"
    trade_amount: Optional[float] = None


class BotStopRequest(BaseModel):
    user_id: int
    bot_id: str


class BotStatusRequest(BaseModel):
    user_id: int
    bot_id: Optional[str] = None


class BotResponse(BaseModel):
    success: bool
    message: str
    data: Optional[Dict] = None


@app.get("/")
async def root():
    """Health check endpoint"""
    return {
        "service": "VATrade Bot Engine",
        "status": "running",
        "version": "1.0.0",
        "active_bots": bot_manager.get_active_count()
    }


@app.post("/bot/start", response_model=BotResponse)
async def start_bot(request: BotStartRequest):
    """
    Start a trading bot for a user
    
    - **user_id**: ID of the user
    - **credential_id**: ID of the API credential
    - **api_key**: Binance API key (dari backend/database)
    - **secret_key**: Binance secret key (dari backend/database)
    - **strategy**: Trading strategy to use (default: simple_moving_average)
    - **symbol**: Trading pair symbol (default: BTC/USDT)
    - **trade_amount**: Amount to trade per order (optional)
    
    Note: API key dan secret key berbeda per user dan harus dikirim dari backend
    """
    try:
        logger.info(f"Starting bot for user {request.user_id} with strategy {request.strategy}")
        
        bot_id = await bot_manager.start_bot(
            user_id=request.user_id,
            credential_id=request.credential_id,
            api_key=request.api_key,
            secret_key=request.secret_key,
            strategy=request.strategy,
            symbol=request.symbol,
            trade_amount=request.trade_amount or settings.default_trade_amount
        )
        
        return BotResponse(
            success=True,
            message=f"Bot started successfully",
            data={"bot_id": bot_id, "status": "running"}
        )
    except Exception as e:
        logger.error(f"Failed to start bot: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/bot/stop", response_model=BotResponse)
async def stop_bot(request: BotStopRequest):
    """
    Stop a running bot
    
    - **user_id**: ID of the user
    - **bot_id**: ID of the bot to stop
    """
    try:
        logger.info(f"Stopping bot {request.bot_id} for user {request.user_id}")
        
        success = await bot_manager.stop_bot(
            user_id=request.user_id,
            bot_id=request.bot_id
        )
        
        if not success:
            raise HTTPException(status_code=404, detail="Bot not found or already stopped")
        
        return BotResponse(
            success=True,
            message="Bot stopped successfully",
            data={"bot_id": request.bot_id, "status": "stopped"}
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to stop bot: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/bot/status", response_model=BotResponse)
async def get_bot_status(request: BotStatusRequest):
    """
    Get status of bot(s)
    
    - **user_id**: ID of the user
    - **bot_id**: ID of specific bot (optional, if not provided returns all user's bots)
    """
    try:
        if request.bot_id:
            status = await bot_manager.get_bot_status(request.user_id, request.bot_id)
            if not status:
                raise HTTPException(status_code=404, detail="Bot not found")
            data = status
        else:
            data = await bot_manager.get_all_user_bots(request.user_id)
        
        return BotResponse(
            success=True,
            message="Status retrieved successfully",
            data=data
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to get bot status: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/bots/active")
async def get_active_bots():
    """Get all active bots (admin endpoint)"""
    try:
        active_bots = await bot_manager.get_all_active_bots()
        return {
            "success": True,
            "count": len(active_bots),
            "bots": active_bots
        }
    except Exception as e:
        logger.error(f"Failed to get active bots: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


# Binance Data Endpoints
class BinanceAccountRequest(BaseModel):
    user_id: str  # Changed to str to accept UUID
    credential_id: str  # Changed to str to accept UUID
    api_key: str
    secret_key: str


@app.post("/binance/account")
async def get_binance_account(request: BinanceAccountRequest):
    """
    Get Binance account information (balance, permissions, etc)
    
    Returns account data including balances for all assets
    """
    try:
        logger.info(f"Fetching Binance account for user {request.user_id}")
        
        # Initialize temporary Binance client
        from binance_client import BinanceClient
        client = BinanceClient(
            request.user_id, 
            request.credential_id,
            request.api_key,
            request.secret_key
        )
        await client.initialize()
        
        # Get account info
        account_info = await client.get_account_info()
        
        # Cleanup
        await client.close()
        
        return BotResponse(
            success=True,
            message="Account data retrieved successfully",
            data=account_info
        )
        
    except Exception as e:
        logger.error(f"Failed to fetch Binance account: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/binance/balance")
async def get_binance_balance(request: BinanceAccountRequest):
    """
    Get Binance account balance (simplified, only non-zero balances)
    """
    try:
        logger.info(f"Fetching Binance balance for user {request.user_id}")
        
        from binance_client import BinanceClient
        client = BinanceClient(
            request.user_id,
            request.credential_id,
            request.api_key,
            request.secret_key
        )
        await client.initialize()
        
        # Get balances
        balances = await client.get_account_balance()
        
        await client.close()
        
        return BotResponse(
            success=True,
            message="Balance retrieved successfully",
            data={"balances": balances}
        )
        
    except Exception as e:
        logger.error(f"Failed to fetch Binance balance: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/binance/ticker")
async def get_binance_ticker(request: BinanceAccountRequest, symbol: str = "BTCUSDT"):
    """
    Get current price for a symbol
    """
    try:
        from binance_client import BinanceClient
        client = BinanceClient(
            request.user_id,
            request.credential_id,
            request.api_key,
            request.secret_key
        )
        await client.initialize()
        
        ticker = await client.get_ticker(symbol)
        
        await client.close()
        
        return BotResponse(
            success=True,
            message="Ticker retrieved successfully",
            data=ticker
        )
        
    except Exception as e:
        logger.error(f"Failed to fetch ticker: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host=settings.host,
        port=settings.port,
        reload=settings.debug
    )
