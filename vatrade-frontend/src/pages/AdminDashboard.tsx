import { useState, useEffect } from 'react';
import { useLanguage } from '../hooks/useLanguage';
import { useTheme } from '../hooks/useTheme';
import { useNavigate } from 'react-router-dom';
import { authApi } from '../services/auth.service';
import api from '../services/auth.service';
import '../pages/Dashboard.css';

interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  type: string;
  role: string;
  createdAt: string;
  updatedAt: string;
}

interface Coin {
  id: string;
  symbol: string;
  createdAt: string;
  updatedAt: string;
}

const AdminDashboard = () => {
  const { language, setLanguage, t } = useLanguage();
  const { toggleTheme, isDark } = useTheme();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth > 768);
  const [activeTab, setActiveTab] = useState<'users' | 'coins'>('users');
  const [users, setUsers] = useState<User[]>([]);
  const [coins, setCoins] = useState<Coin[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Search and pagination
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const usersPerPage = 10;
  
  // Edit user modal
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editFormData, setEditFormData] = useState({
    name: '',
    email: '',
    phone: '',
    type: '',
    role: '',
  });
  
  // Coin modal
  const [showCoinModal, setShowCoinModal] = useState(false);
  const [editingCoin, setEditingCoin] = useState<Coin | null>(null);
  const [coinFormData, setCoinFormData] = useState({
    symbol: '',
  });

  useEffect(() => {
    loadUsers();
    loadCoins();

    const handleResize = () => {
      if (window.innerWidth > 768) {
        setSidebarOpen(true);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await api.get('/users');
      setUsers(response.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const loadCoins = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await api.get('/coins');
      setCoins(response.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load coins');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await authApi.logout();
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      navigate('/login');
    } catch (error) {
      console.error('Logout failed:', error);
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      navigate('/login');
    }
  };

  const closeSidebar = () => {
    if (window.innerWidth <= 768) {
      setSidebarOpen(false);
    }
  };

  const handleEditUser = (user: User) => {
    setEditingUser(user);
    setEditFormData({
      name: user.name,
      email: user.email,
      phone: user.phone || '',
      type: user.type,
      role: user.role,
    });
  };

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    try {
      setLoading(true);
      setError('');
      await api.put(`/users/${editingUser.id}`, editFormData);
      setSuccess('User updated successfully!');
      setEditingUser(null);
      await loadUsers();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update user');
    } finally {
      setLoading(false);
    }
  };

  const handleAddCoin = () => {
    setEditingCoin(null);
    setCoinFormData({ symbol: '' });
    setShowCoinModal(true);
  };

  const handleEditCoin = (coin: Coin) => {
    setEditingCoin(coin);
    setCoinFormData({ symbol: coin.symbol });
    setShowCoinModal(true);
  };

  const handleSaveCoin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      if (editingCoin) {
        await api.put(`/coins/${editingCoin.id}`, coinFormData);
        setSuccess('Coin updated successfully!');
      } else {
        await api.post('/coins', coinFormData);
        setSuccess('Coin added successfully!');
      }
      setShowCoinModal(false);
      await loadCoins();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save coin');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCoin = async (id: string) => {
    if (!confirm('Are you sure you want to delete this coin?')) return;
    
    setLoading(true);
    setError('');
    
    try {
      await api.delete(`/coins/${id}`);
      setSuccess('Coin deleted successfully!');
      await loadCoins();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to delete coin');
    } finally {
      setLoading(false);
    }
  };

  // Filter users by search query
  const filteredUsers = users.filter(user =>
    user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (user.phone && user.phone.includes(searchQuery))
  );

  // Pagination
  const totalPages = Math.ceil(filteredUsers.length / usersPerPage);
  const indexOfLastUser = currentPage * usersPerPage;
  const indexOfFirstUser = indexOfLastUser - usersPerPage;
  const currentUsers = filteredUsers.slice(indexOfFirstUser, indexOfLastUser);

  // Reset to page 1 when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  return (
    <div className={`dashboard-page ${isDark ? 'dark-theme' : ''}`}>
      {sidebarOpen && window.innerWidth <= 768 && (
        <div className="sidebar-overlay" onClick={closeSidebar} />
      )}

      <aside className={`sidebar ${sidebarOpen ? 'open' : 'closed'}`}>
        <div className="sidebar-header">
          <div className="logo">
            <span className="logo-icon">📊</span>
            {sidebarOpen && <span className="logo-text">Admin Panel</span>}
          </div>
        </div>

        <nav className="sidebar-nav">
          <button 
            className={`nav-item ${activeTab === 'users' ? 'active' : ''}`}
            onClick={() => setActiveTab('users')}
          >
            <span className="nav-icon">👥</span>
            {sidebarOpen && <span className="nav-label">Users</span>}
          </button>
          <button 
            className={`nav-item ${activeTab === 'coins' ? 'active' : ''}`}
            onClick={() => setActiveTab('coins')}
          >
            <span className="nav-icon">💰</span>
            {sidebarOpen && <span className="nav-label">Coins</span>}
          </button>
          <button className="nav-item logout-btn" onClick={handleLogout}>
            <span className="nav-icon">🚪</span>
            {sidebarOpen && <span className="nav-label">Logout</span>}
          </button>
        </nav>
      </aside>

      <div className="dashboard-main">
        <header className="topbar">
          <div className="topbar-left">
            <button className="menu-toggle" onClick={() => setSidebarOpen(!sidebarOpen)}>
              {sidebarOpen ? '◀' : '▶'}
            </button>
            <h1>Admin Dashboard</h1>
          </div>

          <div className="topbar-right">
            <button className="theme-toggle" onClick={toggleTheme}>
              {isDark ? '☀️' : '🌙'}
            </button>
            <button className="lang-toggle" onClick={() => setLanguage(language === 'en' ? 'id' : 'en')}>
              {language === 'en' ? '🇮🇩' : '🇬🇧'}
            </button>
          </div>
        </header>

        <div className="dashboard-content">
          {error && <div className="error-message">{error}</div>}
          {success && <div className="success-message">{success}</div>}

          {activeTab === 'users' && (
            <>
              <div className="content-header">
                <h1>👥 Users Management</h1>
                <button className="btn btn-secondary btn-sm" onClick={loadUsers}>
                  🔄 Refresh
                </button>
              </div>

              <div className="card">
                <div className="card-header" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
                    <h2>All Users ({filteredUsers.length})</h2>
                  </div>
                  
                  {/* Search Input */}
                  <div style={{ width: '100%', maxWidth: '400px' }}>
                    <input
                      type="text"
                      placeholder="🔍 Search by name, email, or phone..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '10px 16px',
                        border: '1px solid var(--border-light)',
                        borderRadius: '8px',
                        fontSize: '0.95rem',
                        background: 'var(--bg-primary)',
                        color: 'var(--text-primary)',
                      }}
                    />
                  </div>
                </div>

                {loading ? (
                  <div style={{ textAlign: 'center', padding: '40px' }}>
                    <p>Loading users...</p>
                  </div>
                ) : (
                  <>
                    <div className="table-container">
                      <table className="trades-table">
                        <thead>
                          <tr>
                            <th>Name</th>
                            <th>Email</th>
                            <th>Phone</th>
                            <th>Type</th>
                            <th>Role</th>
                            <th>Created At</th>
                            <th style={{ width: '100px' }}>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {currentUsers.length === 0 ? (
                            <tr>
                              <td colSpan={7} style={{ textAlign: 'center', padding: '20px' }}>
                                {searchQuery ? 'No users found matching your search' : 'No users found'}
                              </td>
                            </tr>
                          ) : (
                            currentUsers.map((user) => (
                              <tr key={user.id}>
                                <td>{user.name}</td>
                                <td>{user.email}</td>
                                <td>{user.phone || '-'}</td>
                                <td>
                                  <span className={`badge badge-${user.type}`}>
                                    {user.type.toUpperCase()}
                                  </span>
                                </td>
                                <td>
                                  <span className={`badge badge-${user.role === 'admin' ? 'success' : 'info'}`}>
                                    {user.role.toUpperCase()}
                                  </span>
                                </td>
                                <td>
                                  {new Date(user.createdAt).toLocaleDateString('en-US', {
                                    year: 'numeric',
                                    month: 'short',
                                    day: 'numeric',
                                  })}
                                </td>
                                <td>
                                  <button
                                    className="btn btn-secondary btn-sm"
                                    onClick={() => handleEditUser(user)}
                                    style={{ fontSize: '0.8rem', padding: '6px 12px' }}
                                    title="Edit user"
                                  >
                                    ✏️
                                  </button>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                      <div style={{
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '20px',
                        borderTop: '1px solid var(--border-light)',
                      }}>
                        <button
                          className="btn btn-secondary btn-sm"
                          onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                          disabled={currentPage === 1}
                          style={{ opacity: currentPage === 1 ? 0.5 : 1 }}
                        >
                          ← Previous
                        </button>
                        
                        <span style={{ padding: '0 16px', fontSize: '0.9rem' }}>
                          Page {currentPage} of {totalPages}
                        </span>
                    
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                      disabled={currentPage === totalPages}
                      style={{ opacity: currentPage === totalPages ? 0.5 : 1 }}
                    >
                      Next →
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
          </>
          )}

          {activeTab === 'coins' && (
            <>
              <div className="content-header">
                <h1>💰 Coins Management</h1>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button className="btn btn-secondary btn-sm" onClick={loadCoins}>
                    🔄
                  </button>
                  <button className="btn btn-primary btn-sm" onClick={handleAddCoin}>
                    ➕ Add Coin
                  </button>
                </div>
              </div>

              <div className="card">
                <div className="card-header">
                  <h2>All Coins ({coins.length})</h2>
                </div>

                {loading ? (
                  <div style={{ textAlign: 'center', padding: '40px' }}>
                    <p>Loading coins...</p>
                  </div>
                ) : (
                  <div className="table-container">
                    <table className="trades-table">
                      <thead>
                        <tr>
                          <th>Symbol</th>
                          <th>Created At</th>
                          <th>Updated At</th>
                          <th style={{ width: '150px' }}>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {coins.length === 0 ? (
                          <tr>
                            <td colSpan={4} style={{ textAlign: 'center', padding: '20px' }}>
                              No coins found. Click "Add Coin" to create one.
                            </td>
                          </tr>
                        ) : (
                          coins.map((coin) => (
                            <tr key={coin.id}>
                              <td>
                                <strong>{coin.symbol}</strong>
                              </td>
                              <td>
                                {new Date(coin.createdAt).toLocaleDateString('en-US', {
                                  year: 'numeric',
                                  month: 'short',
                                  day: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </td>
                              <td>
                                {new Date(coin.updatedAt).toLocaleDateString('en-US', {
                                  year: 'numeric',
                                  month: 'short',
                                  day: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </td>
                              <td>
                                <div style={{ display: 'flex', gap: '4px', justifyContent: 'flex-start' }}>
                                  <button
                                    className="btn btn-secondary btn-sm"
                                    onClick={() => handleEditCoin(coin)}
                                    style={{ fontSize: '0.8rem', padding: '6px 12px' }}
                                    title="Edit coin"
                                  >
                                    ✏️
                                  </button>
                                  <button
                                    className="btn btn-danger btn-sm"
                                    onClick={() => handleDeleteCoin(coin.id)}
                                    style={{ fontSize: '0.8rem', padding: '6px 12px' }}
                                    title="Delete coin"
                                  >
                                    🗑️
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </>
          )}

          {/* Edit User Modal */}
          {editingUser && (
            <div style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(0, 0, 0, 0.5)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1000,
            }} onClick={() => setEditingUser(null)}>
              <div style={{
                background: 'var(--bg-card)',
                borderRadius: '12px',
                padding: '24px',
                width: '90%',
                maxWidth: '500px',
                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
              }} onClick={(e) => e.stopPropagation()}>
                <h2 style={{ marginBottom: '20px' }}>✏️ Edit User</h2>
                
                <form onSubmit={handleUpdateUser}>
                  <div style={{ marginBottom: '16px' }}>
                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem' }}>Name</label>
                    <input
                      type="text"
                      value={editFormData.name}
                      onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                      required
                      style={{
                        width: '100%',
                        padding: '10px',
                        border: '1px solid var(--border-light)',
                        borderRadius: '8px',
                        background: 'var(--bg-primary)',
                        color: 'var(--text-primary)',
                      }}
                    />
                  </div>

                  <div style={{ marginBottom: '16px' }}>
                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem' }}>Email</label>
                    <input
                      type="email"
                      value={editFormData.email}
                      onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                      required
                      style={{
                        width: '100%',
                        padding: '10px',
                        border: '1px solid var(--border-light)',
                        borderRadius: '8px',
                        background: 'var(--bg-primary)',
                        color: 'var(--text-primary)',
                      }}
                    />
                  </div>

                  <div style={{ marginBottom: '16px' }}>
                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem' }}>Phone</label>
                    <input
                      type="text"
                      value={editFormData.phone}
                      onChange={(e) => setEditFormData({ ...editFormData, phone: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '10px',
                        border: '1px solid var(--border-light)',
                        borderRadius: '8px',
                        background: 'var(--bg-primary)',
                        color: 'var(--text-primary)',
                      }}
                    />
                  </div>

                  <div style={{ marginBottom: '16px' }}>
                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem' }}>Type</label>
                    <select
                      value={editFormData.type}
                      onChange={(e) => setEditFormData({ ...editFormData, type: e.target.value })}
                      required
                      style={{
                        width: '100%',
                        padding: '10px',
                        border: '1px solid var(--border-light)',
                        borderRadius: '8px',
                        background: 'var(--bg-primary)',
                        color: 'var(--text-primary)',
                      }}
                    >
                      <option value="free">Free</option>
                      <option value="premium">Premium</option>
                    </select>
                  </div>

                  <div style={{ marginBottom: '20px' }}>
                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem' }}>Role</label>
                    <select
                      value={editFormData.role}
                      onChange={(e) => setEditFormData({ ...editFormData, role: e.target.value })}
                      required
                      style={{
                        width: '100%',
                        padding: '10px',
                        border: '1px solid var(--border-light)',
                        borderRadius: '8px',
                        background: 'var(--bg-primary)',
                        color: 'var(--text-primary)',
                      }}
                    >
                      <option value="user">User</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>

                  <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={() => setEditingUser(null)}
                      style={{ padding: '10px 20px' }}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="btn btn-primary"
                      disabled={loading}
                      style={{ padding: '10px 20px' }}
                    >
                      {loading ? 'Saving...' : 'Save Changes'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Coin Modal (Add/Edit) */}
          {showCoinModal && (
            <div style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(0, 0, 0, 0.5)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1000,
            }} onClick={() => setShowCoinModal(false)}>
              <div style={{
                background: 'var(--bg-card)',
                borderRadius: '12px',
                padding: '24px',
                width: '90%',
                maxWidth: '400px',
                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
              }} onClick={(e) => e.stopPropagation()}>
                <h2 style={{ marginBottom: '20px' }}>
                  {editingCoin ? '✏️ Edit Coin' : '➕ Add Coin'}
                </h2>
                
                <form onSubmit={handleSaveCoin}>
                  <div style={{ marginBottom: '20px' }}>
                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem' }}>
                      Symbol *
                    </label>
                    <input
                      type="text"
                      value={coinFormData.symbol}
                      onChange={(e) => setCoinFormData({ symbol: e.target.value.toUpperCase() })}
                      placeholder="e.g., BTCUSDT"
                      required
                      maxLength={20}
                      style={{
                        width: '100%',
                        padding: '10px',
                        border: '1px solid var(--border-light)',
                        borderRadius: '8px',
                        background: 'var(--bg-primary)',
                        color: 'var(--text-primary)',
                        fontSize: '1rem',
                      }}
                    />
                    <small style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
                      Max 20 characters, will be converted to uppercase
                    </small>
                  </div>

                  <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={() => setShowCoinModal(false)}
                      style={{ padding: '10px 20px' }}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="btn btn-primary"
                      disabled={loading}
                      style={{ padding: '10px 20px' }}
                    >
                      {loading ? 'Saving...' : (editingCoin ? 'Update' : 'Add')}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
