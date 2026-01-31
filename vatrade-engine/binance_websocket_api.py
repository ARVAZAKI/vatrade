import asyncio
import json
import hmac
import hashlib
import time
import uuid
import websockets
from typing import Dict, Any, Optional, Callable
import logging

logger = logging.getLogger(__name__)


class BinanceWebSocketAPI:
    """
    Binance WebSocket API Client for request-response pattern
    Endpoint: wss://ws-api.binance.com:443/ws-api/v3
    """
    
    def __init__(self, api_key: str, api_secret: str, testnet: bool = False):
        self.api_key = api_key
        self.api_secret = api_secret
        
        # WebSocket endpoints
        if testnet:
            self.ws_url = "wss://testnet.binance.vision/ws-api/v3"
        else:
            self.ws_url = "wss://ws-api.binance.com:443/ws-api/v3"
        
        self.websocket: Optional[websockets.WebSocketClientProtocol] = None
        self.pending_requests: Dict[str, asyncio.Future] = {}
        self.is_connected = False
        self._receive_task: Optional[asyncio.Task] = None
    
    def _generate_signature(self, params: Dict[str, Any]) -> str:
        """Generate HMAC SHA256 signature for request"""
        query_string = '&'.join([f"{key}={value}" for key, value in sorted(params.items())])
        signature = hmac.new(
            self.api_secret.encode('utf-8'),
            query_string.encode('utf-8'),
            hashlib.sha256
        ).hexdigest()
        return signature
    
    async def connect(self):
        """Connect to Binance WebSocket API"""
        try:
            self.websocket = await websockets.connect(self.ws_url)
            self.is_connected = True
            
            # Start receiving messages
            self._receive_task = asyncio.create_task(self._receive_messages())
            
            logger.info(f"Connected to Binance WebSocket API: {self.ws_url}")
        except Exception as e:
            logger.error(f"Failed to connect to WebSocket: {str(e)}")
            raise
    
    async def _receive_messages(self):
        """Receive and process messages from WebSocket"""
        try:
            while self.is_connected and self.websocket:
                message = await self.websocket.recv()
                data = json.loads(message)
                
                # Match response with pending request
                request_id = data.get('id')
                if request_id and request_id in self.pending_requests:
                    future = self.pending_requests.pop(request_id)
                    if not future.done():
                        future.set_result(data)
                
        except websockets.exceptions.ConnectionClosed:
            logger.info("WebSocket connection closed")
            self.is_connected = False
        except Exception as e:
            logger.error(f"Error receiving messages: {str(e)}")
            self.is_connected = False
    
    async def _send_request(self, method: str, params: Dict[str, Any] = None) -> Dict[str, Any]:
        """Send request and wait for response"""
        if not self.is_connected or not self.websocket:
            await self.connect()
        
        # Generate unique request ID
        request_id = str(uuid.uuid4())
        
        # Prepare params with signature
        if params is None:
            params = {}
        
        params['apiKey'] = self.api_key
        params['timestamp'] = int(time.time() * 1000)
        
        # Generate signature
        params['signature'] = self._generate_signature(params)
        
        # Prepare request
        request = {
            "id": request_id,
            "method": method,
            "params": params
        }
        
        # Create future for response
        future = asyncio.Future()
        self.pending_requests[request_id] = future
        
        # Send request
        await self.websocket.send(json.dumps(request))
        
        # Wait for response with timeout
        try:
            response = await asyncio.wait_for(future, timeout=10.0)
            
            # Check for errors
            if response.get('status') != 200:
                error_msg = response.get('error', {}).get('msg', 'Unknown error')
                raise Exception(f"Binance API error: {error_msg}")
            
            return response
        
        except asyncio.TimeoutError:
            self.pending_requests.pop(request_id, None)
            raise Exception("Request timeout")
    
    async def get_account_status(self, omit_zero_balances: bool = True) -> Dict[str, Any]:
        """
        Get account information including balances
        Method: account.status
        """
        params = {
            'omitZeroBalances': str(omit_zero_balances).lower()
        }
        
        response = await self._send_request('account.status', params)
        return response.get('result', {})
    
    async def get_all_orders(self, symbol: str, start_time: Optional[int] = None, 
                            end_time: Optional[int] = None, limit: int = 500) -> list:
        """
        Get all orders (history)
        Method: allOrders
        """
        params = {'symbol': symbol, 'limit': limit}
        
        if start_time:
            params['startTime'] = start_time
        if end_time:
            params['endTime'] = end_time
        
        response = await self._send_request('allOrders', params)
        return response.get('result', [])
    
    async def get_open_orders(self, symbol: Optional[str] = None) -> list:
        """
        Get current open orders
        Method: openOrders.status
        """
        params = {}
        if symbol:
            params['symbol'] = symbol
        
        response = await self._send_request('openOrders.status', params)
        return response.get('result', [])
    
    async def get_my_trades(self, symbol: str, start_time: Optional[int] = None,
                           end_time: Optional[int] = None, limit: int = 500) -> list:
        """
        Get trade history
        Method: myTrades
        """
        params = {'symbol': symbol, 'limit': limit}
        
        if start_time:
            params['startTime'] = start_time
        if end_time:
            params['endTime'] = end_time
        
        response = await self._send_request('myTrades', params)
        return response.get('result', [])
    
    async def get_order_status(self, symbol: str, order_id: int) -> Dict[str, Any]:
        """
        Query single order status
        Method: order.status
        """
        params = {
            'symbol': symbol,
            'orderId': order_id
        }
        
        response = await self._send_request('order.status', params)
        return response.get('result', {})
    
    async def close(self):
        """Close WebSocket connection"""
        self.is_connected = False
        
        if self._receive_task:
            self._receive_task.cancel()
            try:
                await self._receive_task
            except asyncio.CancelledError:
                pass
        
        if self.websocket:
            await self.websocket.close()
        
        logger.info("WebSocket API connection closed")


# Global manager for WebSocket API connections
class WebSocketAPIManager:
    """Manage WebSocket API connections for multiple users"""
    
    def __init__(self):
        self.clients: Dict[str, BinanceWebSocketAPI] = {}
    
    async def get_client(self, user_id: str, credential_id: str, 
                        api_key: str, api_secret: str, testnet: bool = False) -> BinanceWebSocketAPI:
        """Get or create WebSocket API client"""
        client_key = f"{user_id}_{credential_id}"
        
        if client_key not in self.clients:
            client = BinanceWebSocketAPI(api_key, api_secret, testnet)
            await client.connect()
            self.clients[client_key] = client
        
        return self.clients[client_key]
    
    async def remove_client(self, user_id: str, credential_id: str):
        """Remove and close WebSocket API client"""
        client_key = f"{user_id}_{credential_id}"
        
        if client_key in self.clients:
            await self.clients[client_key].close()
            del self.clients[client_key]
    
    async def close_all(self):
        """Close all WebSocket API clients"""
        for client in self.clients.values():
            await client.close()
        
        self.clients.clear()


# Global instance
ws_api_manager = WebSocketAPIManager()
