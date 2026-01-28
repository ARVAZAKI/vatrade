import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../hooks/useLanguage';
import { useTheme } from '../hooks/useTheme';
import { authApi } from '../services/auth.service';
import { config } from '../config/api';
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
            <button className="social-btn google-btn" onClick={() => window.location.href = config.endpoints.googleAuth}>
              <svg width="20" height="20" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M47.532 24.5528C47.532 22.9214 47.3997 21.2811 47.1175 19.6761H24.48V28.9181H37.4434C36.9055 31.8988 35.177 34.5356 32.6461 36.2111V42.2078H40.3801C44.9217 38.0278 47.532 31.8547 47.532 24.5528Z" fill="#4285F4"/>
                <path d="M24.48 48.0016C30.9529 48.0016 36.4116 45.8764 40.3888 42.2078L32.6549 36.2111C30.5031 37.675 27.7252 38.5039 24.4888 38.5039C18.2275 38.5039 12.9187 34.2798 11.0139 28.6006H3.03296V34.7825C7.10718 42.8868 15.4056 48.0016 24.48 48.0016Z" fill="#34A853"/>
                <path d="M11.0051 28.6006C9.99973 25.6199 9.99973 22.3922 11.0051 19.4115V13.2296H3.03298C-0.371021 20.0112 -0.371021 28.0009 3.03298 34.7825L11.0051 28.6006Z" fill="#FBBC04"/>
                <path d="M24.48 9.49932C27.9016 9.44641 31.2086 10.7339 33.6866 13.0973L40.5387 6.24523C36.2 2.17101 30.4414 -0.068932 24.48 0.00161733C15.4055 0.00161733 7.10718 5.11644 3.03296 13.2296L11.005 19.4115C12.901 13.7235 18.2187 9.49932 24.48 9.49932Z" fill="#EA4335"/>
              </svg>
              {t.auth?.continueWithGoogle || 'Continue with Google'}
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
