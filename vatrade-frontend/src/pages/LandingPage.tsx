import './LandingPage.css';
import { useLanguage } from '../hooks/useLanguage';
import { useTheme } from '../hooks/useTheme';
import { useNavigate } from 'react-router-dom';

const LandingPage = () => {
  const { language, setLanguage, t } = useLanguage();
  const { theme, toggleTheme, isDark } = useTheme();
  const navigate = useNavigate();

  return (
    <div className={`landing-page ${isDark ? 'dark-theme' : ''}`}>
      {/* Navbar */}
      <nav className="navbar">
        <div className="container nav-container">
          <div className="logo animate-fade-in">
            <span className="logo-icon">📈</span>
            VATrade
          </div>
          <div className="nav-links">
            <a href="#features">{t.nav.features}</a>
            <a href="#how-it-works">{t.nav.howItWorks}</a>
            <a href="#disclaimer">{t.nav.disclaimer}</a>
          </div>
          <div className="nav-actions">
            <button 
              className="theme-toggle" 
              onClick={toggleTheme}
              aria-label="Toggle theme"
            >
              {isDark ? '☀️' : '🌙'}
            </button>
            <button 
              className="lang-toggle" 
              onClick={() => setLanguage(language === 'id' ? 'en' : 'id')}
            >
              {language === 'id' ? 'EN' : 'ID'}
            </button>
            <button className="btn btn-primary btn-nav" onClick={() => navigate('/register')}>
              {t.nav.getStarted}
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="hero">
        <div className="container">
          <div className="hero-content">
            <div className="hero-text">
              <span className="hero-badge animate-fade-in-up">
                <span className="badge-dot"></span>
                {t.hero.badge}
              </span>
              
              <h1 className="hero-title animate-fade-in-up delay-1">
                {t.hero.title1}
                <span className="highlight">{t.hero.titleHighlight}</span>
                <br />{t.hero.title2}
              </h1>
              
              <p className="hero-description animate-fade-in-up delay-2">
                {t.hero.description}
              </p>
              
              <div className="hero-cta animate-fade-in-up delay-3">
                <button className="btn btn-primary btn-large" onClick={() => navigate('/register')}>
                  {t.hero.cta1}
                  <span className="btn-arrow">→</span>
                </button>
                <button className="btn btn-secondary btn-large" onClick={() => navigate('/login')}>
                  {t.hero.cta2}
                </button>
              </div>
              
              <div className="hero-trust animate-fade-in-up delay-4">
                <div className="trust-item">
                  <span className="trust-icon">🔒</span>
                  <span>{t.hero.trust1}</span>
                </div>
                <div className="trust-item">
                  <span className="trust-icon">⚡</span>
                  <span>{t.hero.trust2}</span>
                </div>
                <div className="trust-item">
                  <span className="trust-icon">🛡️</span>
                  <span>{t.hero.trust3}</span>
                </div>
              </div>
            </div>
            
            <div className="hero-visual animate-float">
              <div className="trading-card animate-fade-in-right">
                <div className="card-header">
                  <span className="card-title">{t.hero.cardTitle}</span>
                  <span className="status-badge">● {t.hero.cardStatus}</span>
                </div>
                <div className="card-stats">
                  <div className="stat">
                    <span className="stat-label">{t.hero.profitToday}</span>
                    <span className="stat-value positive">+12.45%</span>
                  </div>
                  <div className="stat">
                    <span className="stat-label">{t.hero.totalTrades}</span>
                    <span className="stat-value">4</span>
                  </div>
                </div>
                <div className="chart-placeholder">
                  <div className="chart-line"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="hero-decoration"></div>
      </section>

      {/* Features Section */}
      <section id="features" className="features">
        <div className="container">
          <div className="section-header animate-on-scroll">
            <span className="section-badge">{t.features.badge}</span>
          </div>
          
          <div className="features-grid">
            <div className="feature-card animate-on-scroll">
              <div className="feature-icon icon-green">🤖</div>
              <h3>{t.features.feature1Title}</h3>
              <p>{t.features.feature1Desc}</p>
            </div>
            
            <div className="feature-card animate-on-scroll delay-1">
              <div className="feature-icon icon-yellow">🔐</div>
              <h3>{t.features.feature2Title}</h3>
              <p>{t.features.feature2Desc}</p>
            </div>
            
            <div className="feature-card animate-on-scroll delay-2">
              <div className="feature-icon icon-green">📊</div>
              <h3>{t.features.feature3Title}</h3>
              <p>{t.features.feature3Desc}</p>
            </div>
            
            <div className="feature-card animate-on-scroll delay-3">
              <div className="feature-icon icon-yellow">⚙️</div>
              <h3>{t.features.feature4Title}</h3>
              <p>{t.features.feature4Desc}</p>
            </div>
            
            <div className="feature-card animate-on-scroll delay-4">
              <div className="feature-icon icon-green">📈</div>
              <h3>{t.features.feature5Title}</h3>
              <p>{t.features.feature5Desc}</p>
            </div>
            
            <div className="feature-card animate-on-scroll delay-5">
              <div className="feature-icon icon-yellow">🔔</div>
              <h3>{t.features.feature6Title}</h3>
              <p>{t.features.feature6Desc}</p>
            </div>
            
            <div className="feature-card animate-on-scroll delay-6">
              <div className="feature-icon icon-green">🎯</div>
              <h3>{t.features.feature7Title}</h3>
              <p>{t.features.feature7Desc}</p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="how-it-works">
        <div className="container">
          <div className="section-header animate-on-scroll">
            <span className="section-badge">{t.howItWorks.badge}</span>
          </div>
          
          <div className="steps-container">
            <div className="step animate-on-scroll">
              <div className="step-number">1</div>
              <div className="step-content">
                <h3>{t.howItWorks.step1Title}</h3>
                <p>{t.howItWorks.step1Desc}</p>
              </div>
            </div>
            
            <div className="step-connector"></div>
            
            <div className="step animate-on-scroll delay-1">
              <div className="step-number">2</div>
              <div className="step-content">
                <h3>{t.howItWorks.step2Title}</h3>
                <p>{t.howItWorks.step2Desc}</p>
              </div>
            </div>
            
            <div className="step-connector"></div>
            
            <div className="step animate-on-scroll delay-2">
              <div className="step-number">3</div>
              <div className="step-content">
                <h3>{t.howItWorks.step3Title}</h3>
                <p>{t.howItWorks.step3Desc}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Exchange Partner */}
      <section className="exchange-section">
        <div className="container">
          <div className="exchange-card animate-on-scroll">
            <div className="exchange-content">
              <div className="exchange-icon animate-pulse-slow">
                <img src="https://cryptologos.cc/logos/binance-coin-bnb-logo.svg?v=029" alt="Binance" />
              </div>
              <div className="exchange-text">
                <h3>{t.exchange.title}</h3>
                <p>{t.exchange.description}</p>
              </div>
            </div>
            <div className="exchange-features">
              <div className="ex-feature">✓ {t.exchange.feature1}</div>
              <div className="ex-feature">✓ {t.exchange.feature2}</div>
              <div className="ex-feature">✓ {t.exchange.feature3}</div>
              <div className="ex-feature">✓ {t.exchange.feature4}</div>
            </div>
          </div>
        </div>
      </section>

      {/* Disclaimer Section */}
      <section id="disclaimer" className="disclaimer">
        <div className="container">
          <div className="disclaimer-card animate-on-scroll">
            <div className="disclaimer-header">
              <span className="disclaimer-icon animate-shake">⚠️</span>
              <h2>{t.disclaimer.title}</h2>
            </div>
            
            <div className="disclaimer-grid">
              <div className="disclaimer-item animate-on-scroll">
                <div className="disclaimer-item-icon">🔒</div>
                <div className="disclaimer-item-content">
                  <h4>{t.disclaimer.item1Title}</h4>
                  <p>{t.disclaimer.item1Desc}</p>
                </div>
              </div>
              
              <div className="disclaimer-item animate-on-scroll delay-1">
                <div className="disclaimer-item-icon">🔑</div>
                <div className="disclaimer-item-content">
                  <h4>{t.disclaimer.item2Title}</h4>
                  <p>{t.disclaimer.item2Desc}</p>
                </div>
              </div>
              
              <div className="disclaimer-item animate-on-scroll delay-2">
                <div className="disclaimer-item-icon">📉</div>
                <div className="disclaimer-item-content">
                  <h4>{t.disclaimer.item3Title}</h4>
                  <p>{t.disclaimer.item3Desc}</p>
                </div>
              </div>
              
              <div className="disclaimer-item animate-on-scroll delay-3">
                <div className="disclaimer-item-icon">📋</div>
                <div className="disclaimer-item-content">
                  <h4>{t.disclaimer.item4Title}</h4>
                  <p>{t.disclaimer.item4Desc}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section">
        <div className="container">
          <div className="cta-content animate-on-scroll">
            <h2>{t.cta.title}</h2>
            <p>{t.cta.description}</p>
            <button className="btn btn-white btn-large animate-bounce-subtle" onClick={() => navigate('/register')}>
              {t.cta.button}
              <span className="btn-arrow">→</span>
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="container">
          <div className="footer-content">
            <div className="footer-brand">
              <div className="logo">
                <span className="logo-icon">📈</span>
                VATrade
              </div>
              <p>{t.footer.tagline}</p>
            </div>
          </div>
          
          <div className="footer-bottom">
            <p>{t.footer.copyright}</p>
            <p className="footer-warning">{t.footer.warning}</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
