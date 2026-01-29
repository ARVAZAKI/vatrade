import { useState, useEffect } from 'react';
import { useLanguage } from '../hooks/useLanguage';
import { useTheme } from '../hooks/useTheme';
import { useNavigate } from 'react-router-dom';
import { authApi } from '../services/auth.service';
import CredentialPage from './Credential';
import './Dashboard.css';


const Dashboard = () => {
  const { language, setLanguage, t } = useLanguage();
  const { toggleTheme, isDark } = useTheme();
  const navigate = useNavigate();
  const [activeMenu, setActiveMenu] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth > 768);
  const [profileOpen, setProfileOpen] = useState(false);

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
        </nav>

        <div className="sidebar-footer">
          <button className="nav-item logout-btn" onClick={handleLogout}>
            <span className="nav-icon">🚪</span>
            {sidebarOpen && <span className="nav-label">{t.dashboard?.logout || 'Logout'}</span>}
          </button>
        </div>
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
              <div className="user-avatar" onClick={() => setProfileOpen(!profileOpen)}>JD</div>
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
                    <span className="stat-value">${accountBalance.total.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                    <div className="stat-detail">
                      <span>{t.dashboard?.available || 'Available'}: ${accountBalance.available.toLocaleString()}</span>
                      <span>{t.dashboard?.inOrder || 'In Order'}: ${accountBalance.inOrder.toLocaleString()}</span>
                    </div>
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

              {/* Trading Logs */}
              <div className="logs-section animate-fade-in-up delay-5">
                <div className="section-header">
                  <h2>{t.dashboard?.recentTrades || 'Recent Trades'}</h2>
                  <button className="btn btn-secondary btn-sm">
                    {t.dashboard?.viewAll || 'View All'}
                  </button>
                </div>

                <div className="table-container">
                  <table className="trades-table">
                    <thead>
                      <tr>
                        <th>{t.dashboard?.time || 'Time'}</th>
                        <th>{t.dashboard?.pair || 'Pair'}</th>
                        <th>{t.dashboard?.type || 'Type'}</th>
                        <th>{t.dashboard?.price || 'Price'}</th>
                        <th>{t.dashboard?.amount || 'Amount'}</th>
                        <th>{t.dashboard?.total || 'Total'}</th>
                        <th>{t.dashboard?.status || 'Status'}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {tradingLogs.map((log) => (
                        <tr key={log.id} className="animate-fade-in">
                          <td className="time">{log.time}</td>
                          <td className="pair">{log.pair}</td>
                          <td>
                            <span className={`badge ${log.type.toLowerCase()}`}>
                              {log.type}
                            </span>
                          </td>
                          <td className="price">${log.price.toLocaleString()}</td>
                          <td>{log.amount}</td>
                          <td className="total">${log.total.toLocaleString()}</td>
                          <td>
                            <span className={`status ${log.status.toLowerCase()}`}>
                              {log.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}

          {activeMenu === 'strategy' && (
            <div className="placeholder-content animate-fade-in-up">
              <div className="placeholder-icon">⚙️</div>
              <h2>{t.dashboard?.strategyTitle || 'Strategy Management'}</h2>
              <p>{t.dashboard?.comingSoon || 'Coming soon...'}</p>
            </div>
          )}

          {activeMenu === 'credential' && (
            <CredentialPage />
          )}

          {activeMenu === 'account' && (
            <div className="placeholder-content animate-fade-in-up">
              <div className="placeholder-icon">⚙️</div>
              <h2>{t.dashboard?.accountSettings || 'Account Settings'}</h2>
              <p>{t.dashboard?.comingSoon || 'Coming soon...'}</p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default Dashboard;
