import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Send, Eye, EyeOff, AlertCircle } from 'lucide-react';
import api from '../api';

export default function Login() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '', remember: false });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [branding, setBranding] = useState({
    businessName: localStorage.getItem('businessName') || 'Paper Plane',
    invoiceSubtitle: localStorage.getItem('invoiceSubtitle') || 'Inventory Management System'
  });

  React.useEffect(() => {
    async function fetchPublicConfig() {
      try {
        const { data } = await api.get('/settings/config');
        if (data && data.businessName) {
          localStorage.setItem('businessName', data.businessName);
          localStorage.setItem('invoiceSubtitle', data.invoiceSubtitle);
          setBranding({
            businessName: data.businessName,
            invoiceSubtitle: data.invoiceSubtitle || 'Inventory Management System'
          });
        }
      } catch (err) {
        // ignore
      }
    }
    fetchPublicConfig();
  }, []);

  function handleChange(e) {
    const { name, value, type, checked } = e.target;
    setForm(f => ({ ...f, [name]: type === 'checkbox' ? checked : value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    if (!form.email || !form.password) {
      setError('Please enter your email and password.');
      return;
    }
    setLoading(true);
    try {
      const { data } = await api.post('/auth/login', {
        email: form.email,
        password: form.password,
      });
      localStorage.setItem('token', data.token);
      localStorage.setItem('adminName', data.user?.username || 'Admin');
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.error || 'Invalid credentials. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 40%, #0f172a 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Background decorative circles */}
      <div style={{
        position: 'absolute', top: '-120px', right: '-120px',
        width: '400px', height: '400px',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(245,158,11,0.12) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute', bottom: '-100px', left: '-100px',
        width: '350px', height: '350px',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(59,130,246,0.08) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />

      <div style={{
        width: '100%',
        maxWidth: '440px',
        animation: 'fadeIn 0.5s ease-out',
      }}>
        {/* Card */}
        <div style={{
          background: 'rgba(255,255,255,0.05)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderRadius: '24px',
          border: '1px solid rgba(255,255,255,0.1)',
          padding: '48px 40px',
          boxShadow: '0 32px 64px rgba(0,0,0,0.4)',
        }}>
          {/* Logo */}
          <div style={{ textAlign: 'center', marginBottom: '36px' }}>
            <div style={{
              width: '72px', height: '72px',
              background: 'linear-gradient(135deg, #f59e0b, #d97706)',
              borderRadius: '20px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#0f172a',
              margin: '0 auto 16px',
              boxShadow: '0 8px 24px rgba(245,158,11,0.4)',
            }}>
              <Send size={36} style={{ transform: 'rotate(-45deg)', marginLeft: '4px', marginTop: '-4px' }} />
            </div>
            <h1 style={{ color: 'white', fontSize: '1.8rem', fontWeight: '800', letterSpacing: '-0.5px', marginBottom: '6px' }}>
              {branding.businessName}
            </h1>
            <p style={{ color: '#94a3b8', fontSize: '0.875rem', letterSpacing: '1px', textTransform: 'uppercase' }}>
              {branding.invoiceSubtitle}
            </p>
          </div>

          {/* Error message */}
          {error && (
            <div className="alert alert-danger" style={{ marginBottom: '20px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit}>
            <div className="form-group" style={{ marginBottom: '20px' }}>
              <label style={{ color: '#cbd5e1', fontSize: '0.85rem', fontWeight: '500', marginBottom: '8px', display: 'block' }}>
                Email Address
              </label>
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                placeholder="admin@paperplane.com"
                autoComplete="email"
                style={{
                  width: '100%',
                  padding: '13px 16px',
                  background: 'rgba(255,255,255,0.08)',
                  border: '1.5px solid rgba(255,255,255,0.12)',
                  borderRadius: '12px',
                  color: 'white',
                  fontSize: '0.9rem',
                  outline: 'none',
                  transition: 'all 0.25s',
                  boxSizing: 'border-box',
                }}
                onFocus={e => { e.target.style.borderColor = '#f59e0b'; e.target.style.boxShadow = '0 0 0 3px rgba(245,158,11,0.2)' }}
                onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.12)'; e.target.style.boxShadow = 'none' }}
              />
            </div>

            <div className="form-group" style={{ marginBottom: '24px' }}>
              <label style={{ color: '#cbd5e1', fontSize: '0.85rem', fontWeight: '500', marginBottom: '8px', display: 'block' }}>
                Password
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  style={{
                    width: '100%',
                    padding: '13px 48px 13px 16px',
                    background: 'rgba(255,255,255,0.08)',
                    border: '1.5px solid rgba(255,255,255,0.12)',
                    borderRadius: '12px',
                    color: 'white',
                    fontSize: '0.9rem',
                    outline: 'none',
                    transition: 'all 0.25s',
                    boxSizing: 'border-box',
                  }}
                  onFocus={e => { e.target.style.borderColor = '#f59e0b'; e.target.style.boxShadow = '0 0 0 3px rgba(245,158,11,0.2)' }}
                  onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.12)'; e.target.style.boxShadow = 'none' }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)',
                    background: 'none', border: 'none', cursor: 'pointer',
                    color: '#94a3b8', display: 'flex', alignItems: 'center', justifyContent: 'center'
                  }}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '28px' }}>
              <input
                type="checkbox"
                id="remember"
                name="remember"
                checked={form.remember}
                onChange={handleChange}
                style={{ width: '16px', height: '16px', accentColor: '#f59e0b' }}
              />
              <label htmlFor="remember" style={{ color: '#94a3b8', fontSize: '0.85rem', cursor: 'pointer' }}>
                Remember me
              </label>
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                padding: '14px',
                background: loading ? '#d97706' : 'linear-gradient(135deg, #f59e0b, #d97706)',
                border: 'none',
                borderRadius: '12px',
                color: '#0f172a',
                fontSize: '1rem',
                fontWeight: '700',
                cursor: loading ? 'not-allowed' : 'pointer',
                transition: 'all 0.25s',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '10px',
                boxShadow: loading ? 'none' : '0 8px 24px rgba(245,158,11,0.4)',
              }}
            >
              {loading ? (
                <>
                  <span className="spinner-sm" style={{ borderColor: 'rgba(15,23,42,0.3)', borderTopColor: '#0f172a' }} />
                  Signing in...
                </>
              ) : (
                <>
                  <Send size={18} style={{ transform: 'rotate(-45deg)' }} />
                  Sign In
                </>
              )}
            </button>
          </form>

          {/* Default credentials hint */}
          <div style={{
            marginTop: '24px',
            padding: '14px',
            background: 'rgba(245,158,11,0.08)',
            borderRadius: '10px',
            border: '1px solid rgba(245,158,11,0.15)',
            textAlign: 'center',
          }}>
            <p style={{ color: '#94a3b8', fontSize: '0.75rem', marginBottom: '4px' }}>Default credentials</p>
            <p style={{ color: '#f59e0b', fontSize: '0.82rem', fontWeight: '600' }}>
              admin@paperplane.com &nbsp;/&nbsp; admin123
            </p>
          </div>
        </div>

        <p style={{ textAlign: 'center', color: '#475569', fontSize: '0.78rem', marginTop: '20px' }}>
          © 2026 Paper Plane. All rights reserved.
        </p>
      </div>
    </div>
  );
}
