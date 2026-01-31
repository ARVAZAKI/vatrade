import { useState, useEffect } from 'react';
import { strategyService, type StrategyCoin, type CreateCoinDto } from '../services/strategy.service';
import { useTheme } from '../hooks/useTheme';
import './Strategy.css';

const StrategyPage = () => {
  const { isDark } = useTheme();
  const [coins, setCoins] = useState<StrategyCoin[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Form state
  const [formData, setFormData] = useState({
    symbol: '',
    allocationAmount: '',
    isActive: true,
  });
  
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    loadCoins();
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
    setEditingId(null);
    setError('');
  };

  const totalAllocation = coins.reduce((sum, coin) => sum + (coin.allocationAmount || 0), 0);

  return (
    <div className={`strategy-page ${isDark ? 'dark-theme' : ''}`}>
      <div className="strategy-header">
        <h1>⚙️ Trading Coins Management</h1>
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
              <input
                type="text"
                value={formData.symbol}
                onChange={(e) => setFormData({ ...formData, symbol: e.target.value.toUpperCase() })}
                placeholder="e.g., BTCUSDT"
                required
              />
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
