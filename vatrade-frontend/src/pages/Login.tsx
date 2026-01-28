import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../hooks/useLanguage';
import { useTheme } from '../hooks/useTheme';
import { authApi } from '../services/auth.service';
import './Auth.css';

const Login = () => {
  const { t } = useLanguage();
  const { isDark } = useTheme();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await authApi.login(formData);
      authApi.setAuth(response.accessToken, response.user);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Invalid credentials. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  return (
    <div className={`auth-page ${isDark ? 'dark-theme' : ''}`}>
      <div className="auth-container">
        <div className="auth-card animate-fade-in-up">
          <div className="auth-header">
            <div className="logo">
              <span className="logo-icon">📈</span>
              VATrade
            </div>
            <h1>{t.auth?.loginTitle || 'Welcome Back'}</h1>
            <p>{t.auth?.loginSubtitle || 'Login to your account to continue'}</p>
          </div>

          <form onSubmit={handleSubmit} className="auth-form">
            {error && (
              <div className="error-message">
                {error}
              </div>
            )}

            <div className="form-group">
              <label htmlFor="email">
                {t.auth?.email || 'Email'}
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder={t.auth?.emailPlaceholder || 'your@email.com'}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="password">
                {t.auth?.password || 'Password'}
              </label>
              <div className="password-input">
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  className="toggle-password"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? '👁️' : '👁️‍🗨️'}
                </button>
              </div>
            </div>

            <div className="form-options">
              <label className="checkbox-label">
                <input type="checkbox" />
                <span>{t.auth?.rememberMe || 'Remember me'}</span>
              </label>
              <a href="#" className="forgot-password">
                {t.auth?.forgotPassword || 'Forgot password?'}
              </a>
            </div>

            <button type="submit" className="btn btn-primary btn-large btn-full" disabled={loading}>
              {loading ? 'Loading...' : (t.auth?.loginButton || 'Login')}
            </button>
          </form>

          <div className="auth-footer">
            <p>
              {t.auth?.noAccount || "Don't have an account?"}{' '}
              <a href="/register" className="auth-link">
                {t.auth?.registerLink || 'Register'}
              </a>
            </p>
          </div>

          <div className="auth-divider">
            <span>{t.auth?.orContinueWith || 'Or continue with'}</span>
          </div>

          <div className="social-login">
            <button className="social-btn">
              <span>🔍</span> Google
            </button>
            <button className="social-btn">
              <span>📘</span> Facebook
            </button>
          </div>

          <a href="/" className="back-home">
            ← {t.auth?.backToHome || 'Back to Home'}
          </a>
        </div>
      </div>
    </div>
  );
};

export default Login;
