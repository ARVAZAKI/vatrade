import asyncio
import uuid
import httpx
from typing import Dict, Optional, List
from datetime import datetime
import logging

from binance_client import BinanceClient
from strategy import StrategyFactory
from config import settings

logger = logging.getLogger(__name__)


class BotInstance:
    """Represents a running bot instance"""
    
    def __init__(self, bot_id: str, user_id: int, credential_id: int, 
                 strategy: str, symbol: str, trade_amount: float):
        self.bot_id = bot_id
        self.user_id = user_id
        self.credential_id = credential_id
        self.strategy_name = strategy
        self.symbol = symbol
        self.trade_amount = trade_amount
        self.status = "initializing"
        self.created_at = datetime.utcnow()
        self.last_update = datetime.utcnow()
        
        # Trading state
        self.total_trades = 0
        self.successful_trades = 0
        self.failed_trades = 0
        self.total_profit = 0.0
        
        # Components
        self.client: Optional[BinanceClient] = None
        self.strategy = None
        self.task: Optional[asyncio.Task] = None
        self.running = False
    
    def to_dict(self) -> Dict:
        """Convert to dictionary for API response"""
        return {
            "bot_id": self.bot_id,
            "user_id": self.user_id,
            "credential_id": self.credential_id,
            "strategy": self.strategy_name,
            "symbol": self.symbol,
            "trade_amount": self.trade_amount,
            "status": self.status,
            "created_at": self.created_at.isoformat(),
            "last_update": self.last_update.isoformat(),
            "stats": {
                "total_trades": self.total_trades,
                "successful_trades": self.successful_trades,
                "failed_trades": self.failed_trades,
                "total_profit": self.total_profit
            }
        }


class BotManager:
    """Manages all bot instances"""
    
    def __init__(self):
        self.bots: Dict[str, BotInstance] = {}
        self.user_bots: Dict[int, List[str]] = {}  # user_id -> [bot_ids]
    
    async def start_bot(self, user_id: int, credential_id: int, api_key: str,
                       secret_key: str, strategy: str, symbol: str, 
                       trade_amount: float) -> str:
        """Start a new bot instance"""
        
        # Generate unique bot ID
        bot_id = f"bot_{user_id}_{uuid.uuid4().hex[:8]}"
        
        # Create bot instance
        bot = BotInstance(
            bot_id=bot_id,
            user_id=user_id,
            credential_id=credential_id,
            strategy=strategy,
            symbol=symbol,
            trade_amount=trade_amount
        )
        
        try:
            # Initialize Binance client with credentials from backend
            bot.client = BinanceClient(user_id, credential_id, api_key, secret_key)
            await bot.client.initialize()
            
            # Initialize strategy
            bot.strategy = StrategyFactory.create(strategy, bot.client, symbol, trade_amount)
            
            # Start bot task
            bot.task = asyncio.create_task(self._run_bot(bot))
            bot.status = "running"
            bot.running = True
            
            # Register bot
            self.bots[bot_id] = bot
            if user_id not in self.user_bots:
                self.user_bots[user_id] = []
            self.user_bots[user_id].append(bot_id)
            
            logger.info(f"Bot {bot_id} started successfully for user {user_id}")
            return bot_id
            
        except Exception as e:
            bot.status = "failed"
            logger.error(f"Failed to start bot {bot_id}: {str(e)}")
            raise
    
    async def _run_bot(self, bot: BotInstance):
        """Main bot loop"""
        logger.info(f"Bot {bot.bot_id} loop started")
        
        try:
            while bot.running:
                try:
                    # Execute strategy
                    signal = await bot.strategy.analyze()
                    
                    if signal:
                        # Execute trade based on signal
                        result = await self._execute_trade(bot, signal)
                        
                        if result:
                            bot.successful_trades += 1
                            bot.total_profit += result.get('profit', 0)
                        else:
                            bot.failed_trades += 1
                        
                        bot.total_trades += 1
                    
                    # Update timestamp
                    bot.last_update = datetime.utcnow()
                    
                    # Wait before next iteration (adjust based on strategy)
                    await asyncio.sleep(bot.strategy.get_interval())
                    
                except Exception as e:
                    logger.error(f"Error in bot {bot.bot_id} loop: {str(e)}")
                    bot.failed_trades += 1
                    await asyncio.sleep(5)  # Wait before retry
                    
        except asyncio.CancelledError:
            logger.info(f"Bot {bot.bot_id} task cancelled")
        except Exception as e:
            logger.error(f"Fatal error in bot {bot.bot_id}: {str(e)}")
            bot.status = "error"
        finally:
            bot.running = False
            logger.info(f"Bot {bot.bot_id} loop ended")
    
    async def _execute_trade(self, bot: BotInstance, signal: Dict) -> Optional[Dict]:
        """Execute a trade based on signal"""
        try:
            order_type = signal.get('type')  # 'buy' or 'sell'
            price = signal.get('price')
            amount = signal.get('amount', bot.trade_amount)
            
            logger.info(
                f"🔔 Bot {bot.bot_id} SIGNAL DETECTED: "
                f"{order_type.upper()} {bot.symbol} at {price:.2f} USDT, "
                f"Amount: {amount:.6f}"
            )
            
            # Place order through Binance client
            # If price is None → Market order
            # If price is set → Limit order
            order = await bot.client.place_order(
                symbol=bot.symbol,
                side=order_type.upper(),
                amount=amount,
                price=price  # None for market, price for limit
            )
            
            logger.info(
                f"✅ ORDER EXECUTED - Bot {bot.bot_id}: "
                f"OrderID={order.get('orderId')}, "
                f"Status={order.get('status')}, "
                f"ExecutedQty={order.get('executedQty', 0)}"
            )
            
            # Log trade to backend database
            await self._log_trade_to_backend(bot, signal, order)
            
            return {
                'success': True,
                'order_id': order.get('orderId'),
                'status': order.get('status'),
                'executed_qty': float(order.get('executedQty', 0)),
                'executed_price': float(order.get('price', 0)) if order.get('price') else None,
                'profit': 0  # Calculate based on entry/exit
            }
            
        except Exception as e:
            logger.error(f"❌ FAILED to execute trade for bot {bot.bot_id}: {str(e)}")
            return None
    
    async def _log_trade_to_backend(self, bot: BotInstance, signal: Dict, order: Dict):
        """Log executed trade to backend database"""
        try:
            backend_url = getattr(settings, 'backend_url', 'http://backend:3000')
            
            # Prepare trade data matching CreateTradeHistoryDto
            trade_data = {
                'symbol': bot.symbol,
                'action': signal.get('type', 'buy').lower(),  # 'buy' or 'sell'
                'price': float(order.get('price', signal.get('price', 0))),
                'quantity': float(order.get('executedQty', signal.get('amount', 0))),
                'allocationAmount': float(bot.trade_amount)
            }
            
            # POST to backend bot endpoint with userId in header
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f"{backend_url}/trade-history/bot",
                    json=trade_data,
                    headers={
                        'Content-Type': 'application/json',
                        'X-Bot-User-Id': str(bot.user_id)
                    },
                    timeout=10.0
                )
                
                if response.status_code in [200, 201]:
                    logger.info(
                        f"📊 Trade logged to backend for user {bot.user_id}: "
                        f"{trade_data['action'].upper()} {trade_data['symbol']} @ {trade_data['price']}"
                    )
                else:
                    logger.warning(f"⚠️ Failed to log trade to backend: {response.status_code} - {response.text}")
                    
        except Exception as e:
            logger.error(f"❌ Error logging trade to backend: {str(e)}")
            # Don't raise - logging failure shouldn't stop bot
    
    async def stop_bot(self, user_id: int, bot_id: str) -> bool:
        """Stop a running bot"""
        if bot_id not in self.bots:
            return False
        
        bot = self.bots[bot_id]
        
        # Verify ownership
        if bot.user_id != user_id:
            raise PermissionError("Bot does not belong to this user")
        
        # Stop bot
        bot.running = False
        bot.status = "stopped"
        
        if bot.task and not bot.task.done():
            bot.task.cancel()
            try:
                await bot.task
            except asyncio.CancelledError:
                pass
        
        # Cleanup
        if bot.client:
            await bot.client.close()
        
        # Remove from registry
        if user_id in self.user_bots:
            self.user_bots[user_id].remove(bot_id)
        
        logger.info(f"Bot {bot_id} stopped")
        return True
    
    async def get_bot_status(self, user_id: int, bot_id: str) -> Optional[Dict]:
        """Get status of a specific bot"""
        if bot_id not in self.bots:
            return None
        
        bot = self.bots[bot_id]
        
        # Verify ownership
        if bot.user_id != user_id:
            return None
        
        return bot.to_dict()
    
    async def get_all_user_bots(self, user_id: int) -> Dict:
        """Get all bots for a user"""
        user_bot_ids = self.user_bots.get(user_id, [])
        bots_data = []
        
        for bot_id in user_bot_ids:
            if bot_id in self.bots:
                bots_data.append(self.bots[bot_id].to_dict())
        
        return {
            "user_id": user_id,
            "total_bots": len(bots_data),
            "bots": bots_data
        }
    
    async def get_all_active_bots(self) -> List[Dict]:
        """Get all active bots (admin)"""
        active_bots = []
        for bot in self.bots.values():
            if bot.status == "running":
                active_bots.append(bot.to_dict())
        return active_bots
    
    def get_active_count(self) -> int:
        """Get count of active bots"""
        return sum(1 for bot in self.bots.values() if bot.status == "running")
