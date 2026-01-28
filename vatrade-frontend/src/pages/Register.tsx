import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../hooks/useLanguage';
import { useTheme } from '../hooks/useTheme';
import { authApi } from '../services/auth.service';
import './Auth.css';

const Register = () => {
  const { t } = useLanguage();
  const { isDark } = useTheme();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match!');
      return;
    }
    if (!agreedToTerms) {
      setError('Please agree to Terms & Conditions');
      return;
    }

    setLoading(true);

    try {
      const response = await authApi.register({
        name: formData.fullName,
        email: formData.email,
        password: formData.password,
      });
      authApi.setAuth(response.accessToken, response.user);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
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
            <h1>{t.auth?.registerTitle || 'Create Account'}</h1>
            <p>{t.auth?.registerSubtitle || 'Start your automated trading journey'}</p>
          </div>

          <form onSubmit={handleSubmit} className="auth-form">
            {error && (
              <div className="error-message">
                {error}
              </div>
            )}

            <div className="form-group">
              <label htmlFor="fullName">
                {t.auth?.fullName || 'Full Name'}
              </label>
              <input
                type="text"
                id="fullName"
                name="fullName"
                value={formData.fullName}
                onChange={handleChange}
                placeholder={t.auth?.fullNamePlaceholder || 'John Doe'}
                required
              />
            </div>

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
                  minLength={8}
                />
                <button
                  type="button"
                  className="toggle-password"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? '👁️' : '👁️‍🗨️'}
                </button>
              </div>
              <small className="field-hint">
                {t.auth?.passwordHint || 'Minimum 8 characters'}
              </small>
            </div>

            <div className="form-group">
              <label htmlFor="confirmPassword">
                {t.auth?.confirmPassword || 'Confirm Password'}
              </label>
              <div className="password-input">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  id="confirmPassword"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="••••••••"
                  required
                  minLength={8}
                />
                <button
                  type="button"
                  className="toggle-password"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? '👁️' : '👁️‍🗨️'}
                </button>
              </div>
            </div>

            <div className="form-options">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={agreedToTerms}
                  onChange={(e) => setAgreedToTerms(e.target.checked)}
                />
                <span>
                  {t.auth?.agreeToTerms || 'I agree to the'}{' '}
                  <a href="#" className="auth-link">
                    {t.auth?.termsAndConditions || 'Terms & Conditions'}
                  </a>
                </span>
              </label>
            </div>

            <button type="submit" className="btn btn-primary btn-large btn-full" disabled={loading}>
              {loading ? 'Loading...' : (t.auth?.registerButton || 'Create Account')}
            </button>
          </form>

          <div className="auth-footer">
            <p>
              {t.auth?.haveAccount || 'Already have an account?'}{' '}
              <a href="/login" className="auth-link">
                {t.auth?.loginLink || 'Login'}
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

export default Register;
