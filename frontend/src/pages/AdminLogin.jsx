import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function AdminLogin() {
  const { login } = useAuth();
  const navigate  = useNavigate();
  const [form,    setForm]    = useState({ username: '', password: '' });
  const [error,   setError]   = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async e => {
    e.preventDefault(); setError(''); setLoading(true);
    try { await login(form.username, form.password); navigate('/admin/dashboard'); }
    catch { setError('Invalid username or password.'); }
    finally { setLoading(false); }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <span style={{ fontSize: '1.4rem', fontWeight: 900, letterSpacing: '.04em' }}>
            MAJESTIC<span style={{ color: 'var(--accent)' }}>CORE</span>
          </span>
        </div>
        <h2>Admin Login</h2>
        <p>Sign in to manage your store</p>
        {error && <div className="alert error">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-group"><label>Username</label>
            <input type="text" required autoFocus value={form.username} onChange={e => setForm({...form, username:e.target.value})} /></div>
          <div className="form-group"><label>Password</label>
            <input type="password" required value={form.password} onChange={e => setForm({...form, password:e.target.value})} /></div>
          <button type="submit" className="btn-primary" style={{ width:'100%', justifyContent:'center', marginTop:'.4rem' }} disabled={loading}>
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>
      </div>
    </div>
  );
}
