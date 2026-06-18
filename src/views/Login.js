import React, { useState, useEffect, useRef } from 'react';
import { withRouter } from 'react-router-dom';
import ReCAPTCHA from 'react-google-recaptcha';
import authService from '../services/authService';
import GlassIcon from '../components/ui/GlassIcon';

const RECAPTCHA_KEY = process.env.REACT_APP_RECAPTCHA_SITE_KEY || '6LeCKm0sAAAAADP5DsXbpHPEudiw790rZBgGT-vz';
const MAX_ATTEMPTS = 5;
const LOCKOUT_MS = 15 * 60 * 1000;

const Login = ({ login, history }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [shaking, setShaking] = useState(false);
  const [capsOn, setCapsOn] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [captchaToken, setCaptchaToken] = useState(null);
  const [captchaUnavailable, setCaptchaUnavailable] = useState(false);
  const [lockoutSecs, setLockoutSecs] = useState(0);
  const [sessionBanner, setSessionBanner] = useState('');
  const [online, setOnline] = useState(navigator.onLine);
  const [successFlash, setSuccessFlash] = useState(false);
  const [exiting, setExiting] = useState(false);
  const [lastLogin, setLastLogin] = useState(localStorage.getItem('lc_last_login') || null);
  const [bookOpened, setBookOpened] = useState(false);

  const lockoutRef = useRef(null);
  const captchaRef = useRef(null);

  // ── On mount ──
  useEffect(() => {
    const reason = history.location?.state?.reason || sessionStorage.getItem('auth_logout_reason');
    if (reason === 'session_expired') setSessionBanner('Your session has expired. Please log in again.');
    else if (reason === 'idle') setSessionBanner('You were logged out due to inactivity.');
    sessionStorage.removeItem('auth_logout_reason');

    const timer = setTimeout(() => setBookOpened(true), 1300);

    const handleOnline = () => setOnline(true);
    const handleOffline = () => setOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      clearTimeout(timer);
      clearInterval(lockoutRef.current);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [history.location]);

  // ── CapsLock detection ──
  const handleKeyDown = (e) => {
    setCapsOn(e.getModifierState && e.getModifierState('CapsLock'));
  };

  // ── Validation (bypass: captcha skipped) ──
  const validate = () => {
    const errors = {};
    if (!username.trim()) errors.username = 'Username is required.';
    // password and captcha skipped in bypass mode
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // ── Lockout helpers ──
  const getAttempts = (user) => parseInt(localStorage.getItem(`login_attempts_${user}`) || '0', 10);
  const setAttempts = (user, n) => localStorage.setItem(`login_attempts_${user}`, n);
  const getLockoutTime = (user) => parseInt(localStorage.getItem(`lockout_${user}`) || '0', 10);
  const setLockoutTime = (user, ts) => localStorage.setItem(`lockout_${user}`, ts);

  const startLockoutCountdown = (remaining) => {
    setLockoutSecs(Math.ceil(remaining / 1000));
    clearInterval(lockoutRef.current);
    lockoutRef.current = setInterval(() => {
      setLockoutSecs((s) => {
        if (s <= 1) { clearInterval(lockoutRef.current); return 0; }
        return s - 1;
      });
    }, 1000);
  };

  const checkLockout = (user) => {
    const lockoutAt = getLockoutTime(user);
    if (!lockoutAt) return false;
    const remaining = lockoutAt + LOCKOUT_MS - Date.now();
    if (remaining > 0) {
      startLockoutCountdown(remaining);
      setErrorMsg(`Account locked. Try again in ${Math.ceil(remaining / 1000)} seconds.`);
      return true;
    }
    localStorage.removeItem(`lockout_${user}`);
    setAttempts(user, 0);
    return false;
  };

  const handleLoginFailure = (user, errMsg) => {
    const attempts = getAttempts(user) + 1;
    setAttempts(user, attempts);

    if (attempts >= MAX_ATTEMPTS || errMsg?.toLowerCase().includes('account is disabled')) {
      setLockoutTime(user, Date.now());
      startLockoutCountdown(LOCKOUT_MS);
      setErrorMsg('Too many failed attempts. Account locked for 15 minutes.');
    } else {
      setErrorMsg(errMsg || 'Login failed. Please try again.');
    }

    setShaking(true);
    setTimeout(() => setShaking(false), 600);
    captchaRef.current?.reset();
    setCaptchaToken(null);
  };

  // ── Submit ──
  const handleLogin = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    if (checkLockout(username)) return;

    setLoading(true);
    setErrorMsg('');

    try {
      await authService.login(username, password);
      localStorage.setItem('lc_last_login', new Date().toLocaleString());
      setLastLogin(new Date().toLocaleString());
      setAttempts(username, 0);
      localStorage.removeItem(`lockout_${username}`);
      setSuccessFlash(true);
      setTimeout(() => {
        setExiting(true);
        setTimeout(() => {
          login();
          const roles = JSON.parse(atob(localStorage.getItem('token').split('.')[1]))?.realm_access?.roles || [];
          if (roles.includes('admin')) history.push('/admin');
          else history.push('/dashboard');
        }, 400);
      }, 600);
    } catch (err) {
      handleLoginFailure(username, err.message);
    } finally {
      setLoading(false);
    }
  };

  const containerStyle = {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '20px',
    transition: 'opacity 0.4s ease',
    opacity: exiting ? 0 : 1,
    position: 'relative',
  };

  const cardStyle = {
    transform: shaking ? 'translateX(0)' : undefined,
    animation: shaking ? 'shake 0.5s ease' : bookOpened ? 'fadeInUp 0.5s ease' : 'none',
  };

  return (
    <div className="login-page" style={containerStyle}>
      <div className="glass-bg" aria-hidden="true">
        <div className="glass-bg__orb glass-bg__orb--lavender" />
        <div className="glass-bg__orb glass-bg__orb--sky" />
        <div className="glass-bg__orb glass-bg__orb--mint" />
        <div className="glass-bg__orb glass-bg__orb--pink" />
      </div>
      <style>{`
        @keyframes shake {
          0%,100%{transform:translateX(0)}
          20%{transform:translateX(-8px)}
          40%{transform:translateX(8px)}
          60%{transform:translateX(-6px)}
          80%{transform:translateX(6px)}
        }
        @keyframes fadeInUp {
          from{opacity:0;transform:translateY(20px)}
          to{opacity:1;transform:translateY(0)}
        }
        .login-input:focus { border-color: rgba(111, 168, 255, 0.5) !important; box-shadow: 0 0 0 3px rgba(111, 168, 255, 0.15) !important; }
      `}</style>

      <div className="glass-card login-card" style={cardStyle}>
        <div className="login-card__logo">
          <GlassIcon variant="lavender">🛡️</GlassIcon>
          <h1 className="login-card__title">Life Claims</h1>
          <p className="login-card__subtitle">Your protection concierge portal</p>
        </div>

        {/* Session / offline banners */}
        {!online && (
          <div className="login-alert login-alert--warning">⚠️ You appear to be offline.</div>
        )}
        {sessionBanner && (
          <div className="login-alert login-alert--info">{sessionBanner}</div>
        )}
        {successFlash && (
          <div className="login-alert login-alert--success">✅ Login successful! Redirecting...</div>
        )}
        {errorMsg && (
          <div className="login-alert login-alert--danger">
            {errorMsg}
            {lockoutSecs > 0 && <div style={{ marginTop: 4, fontWeight: 700 }}>Retry in: {lockoutSecs}s</div>}
          </div>
        )}

        <form onSubmit={handleLogin} noValidate>
          {/* Username */}
          <div className="login-field">
            <label className="login-label">Username</label>
            <input
              type="text"
              className={`login-input ${fieldErrors.username ? 'is-invalid' : ''}`}
              value={username}
              onChange={(e) => { setUsername(e.target.value); setFieldErrors((f) => ({ ...f, username: '' })); }}
              onKeyDown={handleKeyDown}
              placeholder="Enter your username"
              autoComplete="username"
              disabled={loading || lockoutSecs > 0}
            />
            {fieldErrors.username && <div className="invalid-feedback">{fieldErrors.username}</div>}
          </div>

          {/* Password */}
          <div className="login-field">
            <label className="login-label">Password</label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPassword ? 'text' : 'password'}
                className={`login-input ${fieldErrors.password ? 'is-invalid' : ''}`}
                value={password}
                onChange={(e) => { setPassword(e.target.value); setFieldErrors((f) => ({ ...f, password: '' })); }}
                onKeyDown={handleKeyDown}
                placeholder="Enter your password"
                autoComplete="current-password"
                disabled={loading || lockoutSecs > 0}
                style={{ paddingRight: '40px' }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)',
                  background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)',
                }}
              >
                {showPassword ? '🙈' : '👁️'}
              </button>
            </div>
            {fieldErrors.password && <div className="invalid-feedback" style={{ display: 'block' }}>{fieldErrors.password}</div>}
            {capsOn && <small style={{ fontSize: 11, color: '#B45309', fontFamily: 'var(--font-family)' }}>⚠️ Caps Lock is on</small>}
          </div>

          {/* reCAPTCHA */}
          <div className="login-field">
            <ReCAPTCHA
              ref={captchaRef}
              sitekey={RECAPTCHA_KEY}
              onChange={(token) => { setCaptchaToken(token); setFieldErrors((f) => ({ ...f, captcha: '' })); }}
              onExpired={() => setCaptchaToken(null)}
              onErrored={() => setCaptchaUnavailable(true)}
            />
            {fieldErrors.captcha && <div className="invalid-feedback" style={{ display: 'block' }}>{fieldErrors.captcha}</div>}
          </div>

          <button
            type="submit"
            className="glass-btn glass-btn--primary"
            style={{ width: '100%', padding: '12px' }}
            disabled={loading || lockoutSecs > 0}
          >
            {loading ? (
              <>
                <span style={{
                  display: 'inline-block', width: 14, height: 14, verticalAlign: 'middle',
                  border: '2px solid rgba(255,255,255,0.35)', borderTopColor: '#fff',
                  borderRadius: '50%', animation: 'spin 0.8s linear infinite', marginRight: 8,
                }} />
                Signing in...
              </>
            ) : 'Sign In'}
          </button>
        </form>

        {lastLogin && (
          <p style={{ textAlign: 'center', marginTop: 16, fontSize: 11, color: 'var(--text-muted)' }}>
            Last login: {lastLogin}
          </p>
        )}

        <hr style={{ margin: '20px 0', borderColor: 'rgba(255,255,255,0.4)' }} />
        <div style={{ textAlign: 'center', fontSize: 12, color: 'var(--text-muted)' }}>
          Need help? Contact support:<br />
          <a href="mailto:claimssupport@dhdigital.co.in" style={{ color: 'var(--glow-lavender)' }}>claimssupport@dhdigital.co.in</a>
          {' · '}
          <a href="tel:+919892394104" style={{ color: 'var(--glow-lavender)' }}>+91 98923 94104</a>
        </div>
      </div>
    </div>
  );
};

export default withRouter(Login);
