import React, { useState } from 'react';

export default function Login({ onLogin, error: apiError }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [localError, setLocalError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLocalError('');
    
    if (!email.trim() || !password) {
      setLocalError('Please enter both email and password.');
      return;
    }

    setLoading(true);
    try {
      await onLogin(email.trim(), password);
    } catch (err) {
      // Errors should be handled by App.jsx passing an error prop,
      // but just in case, catch any local exceptions.
      setLocalError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const activeError = apiError || localError;

  return (
    <div className="login-wrapper">
      <div className="login-card">
        <div className="login-logo">
          <span className="login-logo-icon">📋</span>
          <h1 className="login-title">KanbanFlow</h1>
          <p className="login-subtitle">Sign in to manage your tasks</p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {activeError && (
            <div 
              style={{ 
                color: 'var(--priority-high-text)', 
                backgroundColor: 'var(--priority-high-bg)',
                padding: '0.65rem 0.85rem',
                borderRadius: 'var(--border-radius-md)',
                fontSize: '0.85rem',
                fontWeight: '500',
                border: '1px solid rgba(239, 68, 68, 0.2)'
              }}
            >
              ⚠️ {activeError}
            </div>
          )}

          <div className="form-group">
            <label htmlFor="login-email">Email Address</label>
            <input
              id="login-email"
              type="email"
              className="form-input"
              placeholder="e.g. yourname@domain.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
              autoFocus
            />
          </div>

          <div className="form-group">
            <label htmlFor="login-password">Password</label>
            <input
              id="login-password"
              type="password"
              className="form-input"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
            />
          </div>

          <button 
            type="submit" 
            className="btn btn-primary" 
            style={{ width: '100%', padding: '0.75rem', marginTop: '0.5rem' }}
            disabled={loading}
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div style={{ textAlign: 'center', fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
          Homeserver Default Seed: <br />
          <code style={{ background: 'var(--bg-primary)', padding: '0.1rem 0.3rem', borderRadius: '4px' }}>admin@kanban.local</code> / <code style={{ background: 'var(--bg-primary)', padding: '0.1rem 0.3rem', borderRadius: '4px' }}>admin</code>
        </div>
      </div>
    </div>
  );
}
