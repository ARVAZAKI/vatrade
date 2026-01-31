import { useState, useEffect } from 'react';
import { useLanguage } from '../hooks/useLanguage';
import { useTheme } from '../hooks/useTheme';
import { useNavigate } from 'react-router-dom';
import { authApi } from '../services/auth.service';
import binanceService from '../services/binance.service';
import type { BinanceBalance, BinanceOrder, BinanceTrade } from '../services/binance.service';
import { credentialService } from '../services/credential.service';
import CredentialPage from './Credential';
import ProfilePage from './Profile';
import StrategyPage from './Strategy';
import './Dashboard.css';


const Dashboard = () => {
  const { language, setLanguage, t } = useLanguage();
  const { toggleTheme, isDark } = useTheme();
  const navigate = useNavigate();
  const [activeMenu, setActiveMenu] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth > 768);
  const [profileOpen, setProfileOpen] = useState(false);
  
  // Binance data states
  const [binanceBalance, setBinanceBalance] = useState<BinanceBalance | null>(null);
  const [loadingBalance, setLoadingBalance] = useState(false);
  const [balanceError, setBalanceError] = useState('');
  const [userCredentialId, setUserCredentialId] = useState<string | null>(null);
  const [orders, setOrders] = useState<BinanceOrder[]>([]);
  const [trades, setTrades] = useState<BinanceTrade[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);

  // Handle responsive sidebar on window resize
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 768) {
        setSidebarOpen(true);
      } else {
        setSidebarOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Load user credential and balance on mount
  useEffect(() => {
    const loadData = async () => {
      // Only load if user is authenticated
      if (!authApi.isAuthenticated()) {
        navigate('/login');
        return;
      }

      // Load credential first
      try {
        const credential = await credentialService.getCredentials();
        if (credential?.id) {
          setUserCredentialId(credential.id);
          
          // Load balance if on dashboard menu
          if (activeMenu === 'dashboard') {
            await loadBinanceBalance(credential.id);
          }
        }
      } catch (error) {
        console.log('No credential found yet');
      }
    };

    loadData();
  }, [activeMenu]);

  const loadBinanceBalance = async (credentialId?: string) => {
    const credId = credentialId || userCredentialId;
    if (!credId) return;
    
    try {
      setLoadingBalance(true);
      setBalanceError('');
      
      // Use WebSocket API for real-time balance
      const response = await binanceService.getBalanceWebSocket(credId);
      
      if (response.success && response.data?.balances) {
        setBinanceBalance(response.data.balances);
      }
      
      // Load orders and trades
      await loadOrders(credId);
    } catch (error: any) {
      console.error('Failed to load Binance data:', error);
      setBalanceError(error.response?.data?.message || 'Failed to load balance');
    } finally {
      setLoadingBalance(false);
    }
  };

  const loadOrders = async (credentialId: string) => {
    try {
      setLoadingOrders(true);
      
      // Load orders via WebSocket
      const ordersResponse = await binanceService.getOrdersWebSocket(credentialId, 'BTCUSDT', 50);
      if (ordersResponse.success) {
        setOrders(ordersResponse.data.orders);
      }
      
      // Load trades via WebSocket
      const tradesResponse = await binanceService.getTradesWebSocket(credentialId, 'BTCUSDT', 50);
      if (tradesResponse.success) {
        setTrades(tradesResponse.data.trades);
      }
    } catch (error: any) {
      console.error('Failed to load orders:', error);
    } finally {
      setLoadingOrders(false);
    }
  };

  // Calculate total balance in USDT
  const calculateTotalBalance = () => {
    if (!binanceBalance) return 0;
    
    let total = 0;
    if (binanceBalance.USDT) {
      total += binanceBalance.USDT.total;
    }
    // Add other stablecoins
    if (binanceBalance.BUSD) total += binanceBalance.BUSD.total;
    if (binanceBalance.USDC) total += binanceBalance.USDC.total;
    
    return total;
  };

  // Dummy data untuk demo
  const accountBalance = {
    total: 15234.56,
    available: 12500.00,
    inOrder: 2734.56,
  };

  const profitLoss = {
    today: 234.50,
    todayPercent: 1.87,
    week: 890.25,
    weekPercent: 6.24,
    month: 2450.80,
    monthPercent: 19.12,
  };

  const tradingLogs = [
    { id: 1, time: '2026-01-28 10:30:15', pair: 'BTC/USDT', type: 'BUY', price: 42350.50, amount: 0.05, total: 2117.53, status: 'Filled' },
    { id: 2, time: '2026-01-28 10:35:42', pair: 'BTC/USDT', type: 'SELL', price: 42450.00, amount: 0.05, total: 2122.50, status: 'Filled' },
    { id: 3, time: '2026-01-28 11:15:20', pair: 'ETH/USDT', type: 'BUY', price: 2850.25, amount: 0.5, total: 1425.13, status: 'Filled' },
    { id: 4, time: '2026-01-28 11:20:18', pair: 'ETH/USDT', type: 'SELL', price: 2865.50, amount: 0.5, total: 1432.75, status: 'Filled' },
    { id: 5, time: '2026-01-28 11:45:30', pair: 'BNB/USDT', type: 'BUY', price: 315.80, amount: 3.0, total: 947.40, status: 'Filled' },
    { id: 6, time: '2026-01-28 12:10:05', pair: 'SOL/USDT', type: 'BUY', price: 98.45, amount: 10.0, total: 984.50, status: 'Partial' },
  ];

  const summary = {
    totalTrades: 156,
    winTrades: 98,
    lossTrades: 58,
    winRate: 62.82,
    avgProfit: 12.45,
    avgLoss: -8.32,
  };

  const menuItems = [
    { id: 'dashboard', icon: '📊', label: t.dashboard?.menuDashboard || 'Dashboard' },
    { id: 'strategy', icon: '⚙️', label: t.dashboard?.menuStrategy || 'Strategy' },
    { id: 'credential', icon: '🔑', label: t.dashboard?.menuCredential || 'Credential' },
  ];

  const handleLogout = () => {
    authApi.logout();
    navigate('/');
  };

  return (
    <div className={`dashboard-page ${isDark ? 'dark-theme' : ''}`}>
      {/* Mobile Overlay */}
      {sidebarOpen && window.innerWidth <= 768 && (
        <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)}></div>
      )}

      {/* Sidebar */}
      <aside className={`sidebar ${sidebarOpen ? 'open' : 'closed'}`}>
        <div className="sidebar-header">
          <div className="logo" onClick={() => navigate('/')}>
            <span className="logo-icon">📈</span>
            {sidebarOpen && <span>VATrade</span>}
          </div>
        </div>

        <nav className="sidebar-nav">
          {menuItems.map((item) => (
            <button
              key={item.id}
              className={`nav-item ${activeMenu === item.id ? 'active' : ''}`}
              onClick={() => setActiveMenu(item.id)}
            >
              <span className="nav-icon">{item.icon}</span>
              {sidebarOpen && <span className="nav-label">{item.label}</span>}
            </button>
          ))}
          <button className="nav-item logout-btn" onClick={handleLogout}>
            <span className="nav-icon">🚪</span>
            {sidebarOpen && <span className="nav-label">{t.dashboard?.logout || 'Logout'}</span>}
          </button>
        </nav>
      </aside>

      {/* Main Content */}
      <div className="dashboard-main">
        {/* Topbar */}
        <header className="topbar">
          <div className="topbar-left">
            <button className="menu-toggle" onClick={() => setSidebarOpen(!sidebarOpen)}>
              {sidebarOpen ? '◀' : '▶'}
            </button>
            <h1>{t.dashboard?.title || 'Trading Dashboard'}</h1>
          </div>

          <div className="topbar-right">
            <button className="theme-toggle" onClick={toggleTheme}>
              {isDark ? '☀️' : '🌙'}
            </button>
            <button className="lang-toggle" onClick={() => setLanguage(language === 'id' ? 'en' : 'id')}>
              {language === 'id' ? 'EN' : 'ID'}
            </button>
            <div className="user-menu">
              <div className="user-avatar" onClick={() => setProfileOpen(!profileOpen)}></div>
              {profileOpen && (
                <div className="profile-dropdown">
                  <button className="dropdown-item" onClick={() => { setActiveMenu('account'); setProfileOpen(false); }}>
                    <span className="dropdown-icon">⚙️</span>
                    <span>{t.dashboard?.accountSettings || 'Account Settings'}</span>
                  </button>
                  <button className="dropdown-item logout" onClick={handleLogout}>
                    <span className="dropdown-icon">🚪</span>
                    <span>{t.dashboard?.logout || 'Logout'}</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Dashboard Content */}
        <main className="dashboard-content">
          {activeMenu === 'dashboard' && (
            <>
              {/* Balance Cards */}
              <div className="stats-grid">
                <div className="stat-card animate-fade-in-up">
                  <div className="stat-icon balance">💰</div>
                  <div className="stat-info">
                    <span className="stat-label">{t.dashboard?.totalBalance || 'Total Balance'}</span>
                    {loadingBalance ? (
                      <span className="stat-value">Loading...</span>
                    ) : balanceError ? (
                      <span className="stat-value error-text" style={{ fontSize: '14px', color: '#ef4444' }}>
                        {balanceError}
                      </span>
                    ) : (
                      <>
                        <span className="stat-value">
                          ${calculateTotalBalance().toLocaleString('en-US', { minimumFractionDigits: 2 })} USDT
                        </span>
                        {binanceBalance && (
                          <div className="stat-detail">
                            {Object.entries(binanceBalance).slice(0, 3).map(([asset, data]) => (
                              <span key={asset}>
                                {asset}: {data.total.toLocaleString('en-US', { maximumFractionDigits: 6 })}
                              </span>
                            ))}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>

                <div className="stat-card animate-fade-in-up delay-1">
                  <div className="stat-icon profit">📈</div>
                  <div className="stat-info">
                    <span className="stat-label">{t.dashboard?.todayPL || "Today's P&L"}</span>
                    <span className={`stat-value ${profitLoss.today >= 0 ? 'positive' : 'negative'}`}>
                      ${profitLoss.today.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </span>
                    <span className={`stat-percent ${profitLoss.todayPercent >= 0 ? 'positive' : 'negative'}`}>
                      {profitLoss.todayPercent >= 0 ? '+' : ''}{profitLoss.todayPercent}%
                    </span>
                  </div>
                </div>

                <div className="stat-card animate-fade-in-up delay-2">
                  <div className="stat-icon week">📊</div>
                  <div className="stat-info">
                    <span className="stat-label">{t.dashboard?.weekPL || 'This Week P&L'}</span>
                    <span className={`stat-value ${profitLoss.week >= 0 ? 'positive' : 'negative'}`}>
                      ${profitLoss.week.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </span>
                    <span className={`stat-percent ${profitLoss.weekPercent >= 0 ? 'positive' : 'negative'}`}>
                      {profitLoss.weekPercent >= 0 ? '+' : ''}{profitLoss.weekPercent}%
                    </span>
                  </div>
                </div>

                <div className="stat-card animate-fade-in-up delay-3">
                  <div className="stat-icon month">💹</div>
                  <div className="stat-info">
                    <span className="stat-label">{t.dashboard?.monthPL || 'This Month P&L'}</span>
                    <span className={`stat-value ${profitLoss.month >= 0 ? 'positive' : 'negative'}`}>
                      ${profitLoss.month.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </span>
                    <span className={`stat-percent ${profitLoss.monthPercent >= 0 ? 'positive' : 'negative'}`}>
                      {profitLoss.monthPercent >= 0 ? '+' : ''}{profitLoss.monthPercent}%
                    </span>
                  </div>
                </div>
              </div>

              {/* Trading Summary */}
              <div className="summary-section animate-fade-in-up delay-4">
                <h2>{t.dashboard?.tradingSummary || 'Trading Summary'}</h2>
                <div className="summary-grid">
                  <div className="summary-item">
                    <span className="summary-label">{t.dashboard?.totalTrades || 'Total Trades'}</span>
                    <span className="summary-value">{summary.totalTrades}</span>
                  </div>
                  <div className="summary-item win">
                    <span className="summary-label">{t.dashboard?.winTrades || 'Win Trades'}</span>
                    <span className="summary-value">{summary.winTrades}</span>
                  </div>
                  <div className="summary-item loss">
                    <span className="summary-label">{t.dashboard?.lossTrades || 'Loss Trades'}</span>
                    <span className="summary-value">{summary.lossTrades}</span>
                  </div>
                  <div className="summary-item">
                    <span className="summary-label">{t.dashboard?.winRate || 'Win Rate'}</span>
                    <span className="summary-value">{summary.winRate}%</span>
                  </div>
                  <div className="summary-item">
                    <span className="summary-label">{t.dashboard?.avgProfit || 'Avg Profit'}</span>
                    <span className="summary-value positive">${summary.avgProfit}</span>
                  </div>
                  <div className="summary-item">
                    <span className="summary-label">{t.dashboard?.avgLoss || 'Avg Loss'}</span>
                    <span className="summary-value negative">${summary.avgLoss}</span>
                  </div>
                </div>
              </div>

              {/* Trading Logs - Real Data from Binance */}
              <div className="logs-section animate-fade-in-up delay-5">
                <div className="section-header">
                  <h2>{loadingOrders ? 'Loading...' : (orders.length > 0 ? `Recent Orders (${orders.length})` : t.dashboard?.recentTrades || 'Recent Trades')}</h2>
                  <button className="btn btn-secondary btn-sm" onClick={() => userCredentialId && loadOrders(userCredentialId)}>
                    🔄 Refresh
                  </button>
                </div>

                {loadingOrders ? (
                  <div style={{ textAlign: 'center', padding: '40px' }}>
                    <p>Loading orders from Binance...</p>
                  </div>
                ) : orders.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '40px', color: '#888' }}>
                    <p>No orders found. Start trading to see your orders here.</p>
                  </div>
                ) : (
                  <div className="table-container">
                    <table className="trades-table">
                      <thead>
                        <tr>
                          <th>Time</th>
                          <th>Pair</th>
                          <th>Side</th>
                          <th>Type</th>
                          <th>Price</th>
                          <th>Amount</th>
                          <th>Filled</th>
                          <th>Total</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {orders.slice(0, 20).map((order) => (
                          <tr key={order.orderId} className="animate-fade-in">
                            <td className="time">
                              {new Date(order.updateTime).toLocaleString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </td>
                            <td className="pair">{order.symbol}</td>
                            <td>
                              <span className={`badge ${order.side.toLowerCase()}`}>
                                {order.side}
                              </span>
                            </td>
                            <td>{order.type}</td>
                            <td className="price">${parseFloat(order.price).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 8 })}</td>
                            <td>{parseFloat(order.origQty).toFixed(6)}</td>
                            <td>{parseFloat(order.executedQty).toFixed(6)}</td>
                            <td className="total">${parseFloat(order.cummulativeQuoteQty).toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                            <td>
                              <span className={`status ${order.status.toLowerCase().replace('_', '-')}`}>
                                {order.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Trade Executions - Real Data from Binance */}
              {trades.length > 0 && (
                <div className="logs-section animate-fade-in-up delay-6" style={{ marginTop: '20px' }}>
                  <div className="section-header">
                    <h2>Trade Executions ({trades.length})</h2>
                  </div>

                  <div className="table-container">
                    <table className="trades-table">
                      <thead>
                        <tr>
                          <th>Time</th>
                          <th>Pair</th>
                          <th>Side</th>
                          <th>Price</th>
                          <th>Quantity</th>
                          <th>Total</th>
                          <th>Fee</th>
                          <th>Role</th>
                        </tr>
                      </thead>
                      <tbody>
                        {trades.slice(0, 20).map((trade) => (
                          <tr key={trade.id} className="animate-fade-in">
                            <td className="time">
                              {new Date(trade.time).toLocaleString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                                second: '2-digit'
                              })}
                            </td>
                            <td className="pair">{trade.symbol}</td>
                            <td>
                              <span className={`badge ${trade.isBuyer ? 'buy' : 'sell'}`}>
                                {trade.isBuyer ? 'BUY' : 'SELL'}
                              </span>
                            </td>
                            <td className="price">${parseFloat(trade.price).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 8 })}</td>
                            <td>{parseFloat(trade.qty).toFixed(6)}</td>
                            <td className="total">${parseFloat(trade.quoteQty).toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                            <td>{parseFloat(trade.commission).toFixed(6)} {trade.commissionAsset}</td>
                            <td>
                              <span className={trade.isMaker ? 'maker' : 'taker'}>
                                {trade.isMaker ? 'Maker' : 'Taker'}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          )}

          {activeMenu === 'strategy' && (
            <StrategyPage />
          )}

          {activeMenu === 'credential' && (
            <CredentialPage />
          )}

          {activeMenu === 'account' && (
            <ProfilePage />
          )}
        </main>
      </div>
    </div>
  );
};

export default Dashboard;
