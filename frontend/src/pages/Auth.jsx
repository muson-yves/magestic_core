import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useBuyer } from '../context/BuyerContext';

export default function Auth() {
  const [tab, setTab]     = useState('login');
  const [form, setForm]   = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, register } = useBuyer();
  const navigate = useNavigate();

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async e => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      if (tab === 'login') await login(form.email, form.password);
      else await register(form.name, form.email, form.password);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.error || 'Something went wrong.');
    } finally { setLoading(false); }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <span style={{ fontSize: '1.4rem', fontWeight: 900, letterSpacing: '.04em' }}>
            MAJESTIC<span style={{ color: 'var(--accent)' }}>CORE</span>
          </span>
        </div>

        <div style={{ display: 'flex', gap: '.5rem', marginBottom: '1.5rem' }}>
          {['login', 'register'].map(t => (
            <button
              key={t}
              onClick={() => { setTab(t); setError(''); }}
              style={{
                flex: 1, padding: '.55rem', border: '1px solid var(--border)',
                borderRadius: '8px', background: tab === t ? 'var(--accent)' : 'transparent',
                color: tab === t ? '#000' : 'var(--fg2)', fontWeight: 700,
                fontSize: '.88rem', cursor: 'pointer', transition: 'all .2s',
              }}
            >
              {t === 'login' ? 'Sign In' : 'Create Account'}
            </button>
          ))}
        </div>

        <h2>{tab === 'login' ? 'Welcome back' : 'Join Majestic Core'}</h2>
        <p>{tab === 'login' ? 'Sign in to your buyer account' : 'Create your free buyer account'}</p>

        {error && <div className="alert error">{error}</div>}

        <form onSubmit={handleSubmit}>
          {tab === 'register' && (
            <div className="form-group">
              <label>Full Name</label>
              <input type="text" required value={form.name} onChange={set('name')} placeholder="John Doe" />
            </div>
          )}
          <div className="form-group">
            <label>Email Address</label>
            <input type="email" required value={form.email} onChange={set('email')} placeholder="you@example.com" />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input type="password" required value={form.password} onChange={set('password')} placeholder="••••••••" />
          </div>
          <button type="submit" className="btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: '.4rem' }} disabled={loading}>
            {loading ? 'Please wait...' : tab === 'login' ? 'Sign In' : 'Create Account'}
          </button>
        </form>
      </div>
    </div>
  );
}
