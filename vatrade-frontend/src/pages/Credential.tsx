import { useState, useEffect } from 'react';
import type { FormEvent, ChangeEvent } from 'react';
import { useLanguage } from '../hooks/useLanguage';
import { credentialService } from '../services/credential.service';
import type { Credential, CreateCredentialDto } from '../services/credential.service';
import './Credential.css';

const CredentialPage = () => {
  const { t } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [hasCredential, setHasCredential] = useState(false);
  const [credential, setCredential] = useState<Credential | null>(null);
  const [formData, setFormData] = useState({
    apiKey: '',
    secretKey: '',
  });
  const [showSecretKey, setShowSecretKey] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    loadCredentials();
  }, []);

  const loadCredentials = async () => {
    try {
      const data = await credentialService.getCredentials();
      setCredential(data);
      setHasCredential(true);
      setFormData({
        apiKey: data.apiKey,
        secretKey: '',
      });
    } catch (error: any) {
      if (error.response?.status === 404) {
        setHasCredential(false);
      }
    }
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    setMessage(null);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      if (hasCredential) {
        // Update
        const updateData: any = {};
        if (formData.apiKey !== credential?.apiKey) {
          updateData.apiKey = formData.apiKey;
        }
        if (formData.secretKey) {
          updateData.secretKey = formData.secretKey;
        }

        if (Object.keys(updateData).length > 0) {
          await credentialService.updateCredentials(updateData);
          setMessage({ type: 'success', text: t.credential?.successUpdate || 'Credentials updated successfully!' });
          await loadCredentials();
          setFormData(prev => ({ ...prev, secretKey: '' }));
        } else {
          setMessage({ type: 'error', text: t.credential?.errorNoChanges || 'No changes to update' });
        }
      } else {
        // Create
        if (!formData.apiKey || !formData.secretKey) {
          setMessage({ type: 'error', text: t.credential?.errorFillAll || 'Please fill all fields' });
          setLoading(false);
          return;
        }

        await credentialService.createCredentials(formData as CreateCredentialDto);
        setMessage({ type: 'success', text: t.credential?.successCreate || 'Credentials created successfully!' });
        await loadCredentials();
        setFormData({ apiKey: '', secretKey: '' });
      }
    } catch (error: any) {
      setMessage({
        type: 'error',
        text: error.response?.data?.message || t.credential?.errorSave || 'Failed to save credentials',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm(t.credential?.deleteConfirm || 'Are you sure you want to delete your credentials?')) {
      return;
    }

    setLoading(true);
    try {
      await credentialService.deleteCredentials();
      setMessage({ type: 'success', text: t.credential?.successDelete || 'Credentials deleted successfully!' });
      setHasCredential(false);
      setCredential(null);
      setFormData({ apiKey: '', secretKey: '' });
    } catch (error: any) {
      setMessage({
        type: 'error',
        text: error.response?.data?.message || t.credential?.errorDelete || 'Failed to delete credentials',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="credential-page">
      <div className="page-header">
        <div>
          <h1>🔑 {t.credential?.title || 'API Credentials'}</h1>
          <p className="page-description">
            {t.credential?.description || 'Manage your Binance API credentials for automated trading'}
          </p>
        </div>
      </div>

      <div className="credential-info-card">
        <div className="info-icon">ℹ️</div>
        <div className="info-content">
          <h3>{t.credential?.howToTitle || 'How to get Binance API Keys'}</h3>
          <ol>
            <li>{t.credential?.step1 || 'Login to your Binance account'}</li>
            <li dangerouslySetInnerHTML={{ __html: t.credential?.step2 || 'Go to <strong>API Management</strong> in account settings' }} />
            <li dangerouslySetInnerHTML={{ __html: t.credential?.step3 || 'Create a new API key with <strong>Spot Trading</strong> permission only' }} />
            <li dangerouslySetInnerHTML={{ __html: t.credential?.step4 || '<strong>Important:</strong> Disable withdrawal permission for security' }} />
            <li>{t.credential?.step5 || 'Copy both API Key and Secret Key'}</li>
          </ol>
        </div>
      </div>

      {message && (
        <div className={`message-alert ${message.type}`}>
          {message.type === 'success' ? '✓' : '✕'} {message.text}
        </div>
      )}

      <div className="credential-form-card">
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="apiKey">
              {t.credential?.apiKeyLabel || 'API Key'} <span className="required">*</span>
            </label>
            <input
              type="text"
              id="apiKey"
              name="apiKey"
              value={formData.apiKey}
              onChange={handleChange}
              placeholder={t.credential?.apiKeyPlaceholder || 'Enter your Binance API Key'}
              required
            />
            <small className="field-hint">
              {t.credential?.apiKeyHint || 'Your API key will be securely stored and encrypted'}
            </small>
          </div>

          <div className="form-group">
            <label htmlFor="secretKey">
              {t.credential?.secretKeyLabel || 'Secret Key'} <span className="required">*</span>
              {hasCredential && <span className="optional-badge">{t.credential?.optionalUpdate || '(Optional for update)'}</span>}
            </label>
            <div className="password-input">
              <input
                type={showSecretKey ? 'text' : 'password'}
                id="secretKey"
                name="secretKey"
                value={formData.secretKey}
                onChange={handleChange}
                placeholder={hasCredential ? (t.credential?.secretKeyPlaceholderUpdate || 'Leave empty to keep current secret') : (t.credential?.secretKeyPlaceholder || 'Enter your Binance Secret Key')}
                required={!hasCredential}
              />
              <button
                type="button"
                className="toggle-password"
                onClick={() => setShowSecretKey(!showSecretKey)}
              >
                {showSecretKey ? '👁️' : '👁️‍🗨️'}
              </button>
            </div>
            <small className="field-hint">
              {t.credential?.secretKeyHint || 'Your secret key is never shown for security reasons'}
            </small>
          </div>

          <div className="form-actions">
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
            >
              {loading ? (t.credential?.saving || 'Saving...') : (hasCredential ? ('💾 ' + (t.credential?.updateButton || 'Update Credentials')) : ('➕ ' + (t.credential?.saveButton || 'Save Credentials')))}
            </button>

            {hasCredential && (
              <button
                type="button"
                className="btn btn-danger"
                onClick={handleDelete}
                disabled={loading}
              >
                🗑️ {t.credential?.deleteButton || 'Delete Credentials'}
              </button>
            )}
          </div>
        </form>
      </div>

      {hasCredential && credential && (
        <div className="credential-status-card">
          <h3>{t.credential?.statusTitle || 'Current Status'}</h3>
          <div className="status-grid">
            <div className="status-item">
              <span className="status-label">{t.credential?.statusLabel || 'Status'}</span>
              <span className="status-value active">✓ {t.credential?.statusActive || 'Active'}</span>
            </div>
            <div className="status-item">
              <span className="status-label">{t.credential?.lastUpdated || 'Last Updated'}</span>
              <span className="status-value">
                {new Date(credential.updatedAt).toLocaleString()}
              </span>
            </div>
            <div className="status-item">
              <span className="status-label">{t.credential?.createdAt || 'Created At'}</span>
              <span className="status-value">
                {new Date(credential.createdAt).toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      )}

      <div className="security-notice">
        <div className="notice-icon">🔒</div>
        <div className="notice-content">
          <h4>{t.credential?.securityTitle || 'Security Notice'}</h4>
          <p>
            {t.credential?.securityText || 'Your API credentials are encrypted and stored securely. We only use them to execute trades on your behalf. Make sure your Binance API has withdrawal disabled for maximum security.'}
          </p>
        </div>
      </div>
    </div>
  );
};

export default CredentialPage;
