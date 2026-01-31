import { useState, useEffect, useRef } from 'react';
import { strategyService, type StrategyCoin, type CreateCoinDto } from '../services/strategy.service';
import { useTheme } from '../hooks/useTheme';
import axios from 'axios';
import './Strategy.css';

interface MasterCoin {
  id: string;
  symbol: string;
  createdAt: string;
  updatedAt: string;
}

const StrategyPage = () => {
  const { isDark } = useTheme();
  const [coins, setCoins] = useState<StrategyCoin[]>([]);
  const [masterCoins, setMasterCoins] = useState<MasterCoin[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  // Form state
  const [formData, setFormData] = useState({
    symbol: '',
    allocationAmount: '',
    isActive: true,
  });
  
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchSymbol, setSearchSymbol] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);

  useEffect(() => {
    loadCoins();
    loadMasterCoins();
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const loadCoins = async () => {
    try {
      setLoading(true);
      const data = await strategyService.getCoins();
      setCoins(data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load coins');
    } finally {
      setLoading(false);
    }
  };

  const loadMasterCoins = async () => {
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
      const response = await axios.get<MasterCoin[]>(`${API_URL}/coins`);
      setMasterCoins(response.data);
    } catch (err: any) {
      console.error('Failed to load master coins:', err);
    }
  };

  const filteredMasterCoins = masterCoins.filter(coin =>
    coin.symbol.toLowerCase().includes(searchSymbol.toLowerCase())
  );

  const handleSelectCoin = (symbol: string) => {
    setFormData({ ...formData, symbol });
    setSearchSymbol(symbol);
    setShowDropdown(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Validation
    if (!formData.symbol.trim()) {
      setError('Symbol is required');
      return;
    }

    if (!formData.allocationAmount || parseFloat(formData.allocationAmount) <= 0) {
      setError('Allocation amount must be greater than 0');
      return;
    }

    try {
      setLoading(true);
      
      const coinData: CreateCoinDto = {
        symbol: formData.symbol.toUpperCase(),
        allocationAmount: parseFloat(formData.allocationAmount),
        isActive: formData.isActive,
      };

      if (editingId) {
        await strategyService.updateCoin(editingId, coinData);
        setSuccess('Coin updated successfully!');
      } else {
        await strategyService.createCoin(coinData);
        setSuccess('Coin added successfully!');
      }

      // Reset form
      setFormData({ symbol: '', allocationAmount: '', isActive: true });
      setEditingId(null);
      
      // Reload coins
      await loadCoins();
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save coin');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (coin: StrategyCoin) => {
    setFormData({
      symbol: coin.symbol,
      allocationAmount: coin.allocationAmount.toString(),
      isActive: coin.isActive,
    });
    setSearchSymbol(coin.symbol);
    setEditingId(coin.id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this coin?')) {
      return;
    }

    try {
      setLoading(true);
      await strategyService.deleteCoin(id);
      setSuccess('Coin deleted successfully!');
      await loadCoins();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to delete coin');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setFormData({ symbol: '', allocationAmount: '', isActive: true });
    setSearchSymbol('');
    setEditingId(null);
    setError('');
  };

  const totalAllocation = coins.reduce((sum, coin) => sum + (coin.allocationAmount || 0), 0);

  return (
    <div className={`strategy-page ${isDark ? 'dark-theme' : ''}`}>
      <div className="strategy-header">
        <h1>⚙️ Trading Coins Management</h1>
        <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginTop: '8px' }}>
          Manage your automated trading strategy coins
        </p>
      </div>

      {/* Info Alert */}
      <div style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        padding: '20px 24px',
        borderRadius: '12px',
        marginBottom: '24px',
        boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)',
      }}>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'start' }}>
          <span style={{ fontSize: '1.5rem' }}>💡</span>
          <div>
            <h3 style={{ margin: '0 0 12px 0', fontSize: '1.1rem', fontWeight: '600' }}>Important Trading Guidelines</h3>
            
            <div style={{ marginBottom: '12px' }}>
              <strong style={{ display: 'block', marginBottom: '4px' }}>📊 Coin Selection:</strong>
              <p style={{ margin: 0, fontSize: '0.9rem', lineHeight: '1.6', opacity: 0.95 }}>
                Choose <strong>liquid and stable coins</strong> with high trading volume. Avoid highly volatile or risky assets such as memecoins. 
                Recommended: major pairs like BTCUSDT, ETHUSDT, BNBUSDT for better execution and reduced risk.
              </p>
            </div>

            <div>
              <strong style={{ display: 'block', marginBottom: '4px' }}>🤖 Automated Trading:</strong>
              <p style={{ margin: 0, fontSize: '0.9rem', lineHeight: '1.6', opacity: 0.95 }}>
                Coins will be <strong>automatically purchased</strong> when they meet the bot's trading logic criteria. 
                If conditions are not met, the coin will remain on standby until the bot confirms a valid buy signal. 
                This ensures all trades follow strategic parameters for optimal entry points.
              </p>
            </div>
          </div>
        </div>
      </div>

      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">{success}</div>}

      <div className="strategy-content">
        {/* Coin Form */}
        <div className="strategy-form-card">
          <h2>{editingId ? '✏️ Edit Coin' : '➕ Add New Coin'}</h2>
          
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Symbol *</label>
              <div style={{ position: 'relative' }} ref={dropdownRef}>
                <input
                  type="text"
                  value={searchSymbol || formData.symbol}
                  onChange={(e) => {
                    setSearchSymbol(e.target.value.toUpperCase());
                    setFormData({ ...formData, symbol: e.target.value.toUpperCase() });
                    setShowDropdown(true);
                  }}
                  onFocus={() => setShowDropdown(true)}
                  placeholder="Search coin symbol..."
                  required
                  autoComplete="off"
                />
                {showDropdown && filteredMasterCoins.length > 0 && (
                  <div style={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    right: 0,
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border-light)',
                    borderRadius: '8px',
                    marginTop: '4px',
                    maxHeight: '200px',
                    overflowY: 'auto',
                    zIndex: 1000,
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                  }}>
                    {filteredMasterCoins.map((coin) => (
                      <div
                        key={coin.id}
                        onClick={() => handleSelectCoin(coin.symbol)}
                        style={{
                          padding: '12px 16px',
                          cursor: 'pointer',
                          borderBottom: '1px solid var(--border-light)',
                          transition: 'background 0.2s',
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-secondary)'}
                        onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                      >
                        <strong>{coin.symbol}</strong>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <small style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                Type to search from available coins
              </small>
            </div>

            <div className="form-group">
              <label>Allocation Amount (USDT) *</label>
              <input
                type="number"
                step="0.01"
                value={formData.allocationAmount}
                onChange={(e) => setFormData({ ...formData, allocationAmount: e.target.value })}
                placeholder="e.g., 100"
                required
              />
            </div>

            <div className="form-group">
              <div className="checkbox-group">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                />
                <label htmlFor="isActive">Active for Trading</label>
              </div>
            </div>

            <div className="form-actions">
              <button type="submit" className="btn-primary" disabled={loading}>
                {loading ? 'Saving...' : (editingId ? '💾 Update Coin' : '💾 Add Coin')}
              </button>
              {editingId && (
                <button type="button" className="btn-secondary" onClick={handleCancel}>
                  ❌ Cancel
                </button>
              )}
            </div>
          </form>
        </div>

        {/* Coins List */}
        <div className="strategies-list-card">
          <h2>💰 Your Trading Coins ({coins.length})</h2>
          {loading && coins.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">⏳</div>
              <p>Loading coins...</p>
            </div>
          ) : coins.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">📝</div>
              <p>No coins yet. Add your first trading coin!</p>
            </div>
          ) : (
            coins.map((coin) => (
              <div key={coin.id} className="strategy-item">
                <div className="strategy-item-header">
                  <div className="strategy-item-title">
                    <h3>{coin.symbol}</h3>
                    <span className={`strategy-status ${coin.isActive ? 'active' : 'inactive'}`}>
                      {coin.isActive ? '🟢 Active' : '🔴 Inactive'}
                    </span>
                  </div>
                  <div className="strategy-item-actions">
                    <button className="btn-icon btn-edit" onClick={() => handleEdit(coin)}>
                      ✏️ Edit
                    </button>
                    <button className="btn-icon btn-delete" onClick={() => handleDelete(coin.id)}>
                      🗑️ Delete
                    </button>
                  </div>
                </div>

                <div className="strategy-item-info">
                  <div className="info-item">
                    <span className="info-label">Allocation</span>
                    <span className="info-value">${coin.allocationAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USDT</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Added</span>
                    <span className="info-value">
                      {new Date(coin.createdAt).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default StrategyPage;
