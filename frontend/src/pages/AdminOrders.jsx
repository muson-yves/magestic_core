import { useEffect, useState } from 'react';
import Sidebar from '../components/Sidebar';
import api from '../api';

const IMG = 'http://localhost:5000/uploads/';
const STATUSES = ['pending','processing','shipped','delivered','cancelled'];
const STATUS_COLORS = { pending:'#f90', processing:'#60a5fa', shipped:'#a78bfa', delivered:'#22c55e', cancelled:'#ef4444' };

export default function AdminOrders() {
  const [orders,  setOrders]  = useState([]);
  const [loading, setLoading] = useState(true);
  const [alert,   setAlert]   = useState(null);
  const [filter,  setFilter]  = useState('all');

  const showMsg = (msg, type='success') => { setAlert({msg,type}); setTimeout(()=>setAlert(null),3500); };
  const fetchOrders = () => { api.get('/admin/orders').then(r => setOrders(r.data)).finally(() => setLoading(false)); };
  useEffect(() => { fetchOrders(); }, []);

  const updateStatus = async (id, status) => {
    try { await api.put(`/admin/orders/${id}`, { status }); showMsg('Status updated!'); fetchOrders(); }
    catch { showMsg('Failed to update.', 'error'); }
  };

  const filtered = filter === 'all' ? orders : orders.filter(o => o.status === filter);

  return (
    <div className="admin-layout">
      <Sidebar />
      <main className="admin-main">
        <div className="dash-header">
          <div>
            <h1 className="dash-title">Orders</h1>
            <p className="dash-sub">Track and manage customer orders</p>
          </div>
        </div>

        {/* STATUS FILTER */}
        <div className="order-filters">
          {['all', ...STATUSES].map(s => (
            <button key={s} className={`order-filter-btn${filter === s ? ' active' : ''}`}
              style={filter === s && s !== 'all' ? { borderColor: STATUS_COLORS[s], color: STATUS_COLORS[s] } : {}}
              onClick={() => setFilter(s)}>
              {s === 'all' ? 'All Orders' : s.charAt(0).toUpperCase() + s.slice(1)}
              <span className="filter-count">{s === 'all' ? orders.length : orders.filter(o => o.status === s).length}</span>
            </button>
          ))}
        </div>

        {alert && <div className={`alert ${alert.type}`}>{alert.msg}</div>}

        {loading ? <div className="spinner" /> : (
          <div className="orders-list">
            {filtered.length === 0 && (
              <div className="dash-empty-full">No {filter !== 'all' ? filter : ''} orders found.</div>
            )}
            {filtered.map(o => (
              <div className="order-card-new" key={o.id}>
                <div className="ocn-header">
                  <div className="ocn-id">Order #{o.id}</div>
                  <div className="ocn-date">{new Date(o.createdAt || o.created_at).toLocaleDateString('en-US',{year:'numeric',month:'short',day:'numeric'})}</div>
                  <span className="status-badge" style={{ background: STATUS_COLORS[o.status]+'22', color: STATUS_COLORS[o.status] }}>{o.status}</span>
                  <select value={o.status} onChange={e => updateStatus(o.id, e.target.value)} className="status-select">
                    {STATUSES.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase()+s.slice(1)}</option>)}
                  </select>
                </div>
                <div className="ocn-body">
                  <div className="ocn-buyer">
                    <div className="ocn-avatar">{(o.buyer_name || '?').charAt(0).toUpperCase()}</div>
                    <div>
                      <div className="ocn-buyer-name">{o.buyer_name || 'Deleted User'}</div>
                      <div className="ocn-buyer-email">{o.buyer_email || '—'}</div>
                    </div>
                  </div>
                  <div className="ocn-items">
                    {o.items.map((i, idx) => (
                      <div className="ocn-item" key={i._id || idx}>
                        <img src={i.image ? IMG+i.image : 'https://placehold.co/40x40/161616/555?text=?'} alt={i.name} />
                        <div>
                          <div className="ocn-item-name">{i.name}</div>
                          <div className="ocn-item-meta">×{i.qty} · ${Number(i.price).toFixed(2)}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="ocn-total">
                    <div className="ocn-total-label">Total</div>
                    <div className="ocn-total-val">${Number(o.total).toFixed(2)}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
