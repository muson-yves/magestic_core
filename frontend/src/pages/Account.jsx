import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { useBuyer } from '../context/BuyerContext';
import api from '../api';
import { UserIcon } from '@heroicons/react/24/outline';

export default function Account() {
  const navigate = useNavigate();
  const { buyer, logout } = useBuyer();
  const [form,    setForm]    = useState({ name: '', address: '' });
  const [alert,   setAlert]   = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!buyer) { navigate('/auth'); return; }
    api.get('/buyer/me').then(r => {
      if (r.data.loggedIn) setForm({ name: r.data.name || '', address: r.data.address || '' });
    });
  }, [buyer]);

  const showMsg = (msg, type = 'success') => { setAlert({ msg, type }); setTimeout(() => setAlert(null), 3500); };

  const handleSave = async e => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.put('/buyer/profile', form);
      showMsg('Profile updated!');
    } catch { showMsg('Failed to update.', 'error'); }
    finally { setLoading(false); }
  };

  const handleLogout = async () => { await logout(); navigate('/'); };

  if (!buyer) return null;

  return (
    <>
      <Navbar />
      <div className="profile-page">
        <div className="section-title"><h2><UserIcon style={{width:20,height:20,display:'inline',marginRight:8}} />My Account</h2></div>

        <div className="profile-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem', paddingBottom: '1.2rem', borderBottom: '1px solid var(--border)' }}>
            <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', fontWeight: 900, color: '#000' }}>
              {buyer.name?.[0]?.toUpperCase()}
            </div>
            <div>
              <p style={{ fontWeight: 700, fontSize: '1rem' }}>{buyer.name}</p>
              <p style={{ fontSize: '.82rem', color: 'var(--fg2)' }}>Buyer Account</p>
            </div>
          </div>

          {alert && <div className={`alert ${alert.type}`}>{alert.msg}</div>}

          <form onSubmit={handleSave}>
            <div className="form-group">
              <label>Full Name</label>
              <input type="text" required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
            </div>
            <div className="form-group">
              <label>Default Delivery Address</label>
              <textarea rows={3} value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} placeholder="Your default delivery address..." />
            </div>
            <div style={{ display: 'flex', gap: '.8rem', marginTop: '.5rem' }}>
              <button type="submit" className="btn-primary" disabled={loading}>
                {loading ? 'Saving...' : 'Save Changes'}
              </button>
              <button type="button" className="btn-outline" onClick={() => navigate('/orders')}>My Orders</button>
              <button type="button" className="btn-danger" onClick={handleLogout}>Logout</button>
            </div>
          </form>
        </div>
      </div>
      <Footer />
    </>
  );
}
