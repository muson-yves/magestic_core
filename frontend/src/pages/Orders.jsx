import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { useBuyer } from '../context/BuyerContext';
import api from '../api';
import { useCurrency } from '../context/CurrencyContext';
import { CubeIcon, MapPinIcon } from '@heroicons/react/24/outline';

const IMG = 'http://localhost:5000/uploads/';

export default function Orders() {
  const navigate = useNavigate();
  const { buyer } = useBuyer();
  const { format } = useCurrency();
  const [orders,  setOrders]  = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!buyer) { navigate('/auth'); return; }
    api.get('/orders').then(r => setOrders(r.data)).finally(() => setLoading(false));
  }, [buyer]);

  if (!buyer) return null;

  return (
    <>
      <Navbar />
      <div className="page">
        <div className="section-title"><h2><CubeIcon style={{width:20,height:20,display:'inline',marginRight:8}} />My Orders</h2></div>

        {loading ? <div className="spinner" /> : orders.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon"><CubeIcon style={{width:40,height:40}} /></div>
            <p>You haven't placed any orders yet.</p>
            <button className="btn-primary" onClick={() => navigate('/')}>Start Shopping</button>
          </div>
        ) : orders.map(o => (
          <div key={o.id} className="order-card">
            <div className="order-header">
              <div>
                <span className="order-id">Order #{o.id}</span>
                <span className="order-date" style={{ marginLeft: '.8rem' }}>
                  {new Date(o.createdAt || o.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '.8rem' }}>
                <span className={`status-badge ${o.status}`}>{o.status}</span>
                <span style={{ fontWeight: 800 }}>{format(o.total)}</span>
              </div>
            </div>

            <div className="order-items-list">
              {o.items.map((item, idx) => (
                <div key={item._id || idx} className="order-item-row">
                  <img
                    src={item.image ? IMG + item.image : 'https://placehold.co/44x44/161616/555?text=?'}
                    alt={item.name}
                  />
                  <span style={{ flex: 1 }}>{item.name}</span>
                  <span style={{ color: 'var(--fg2)' }}>×{item.qty}</span>
                  <span style={{ fontWeight: 700 }}>{format(item.price * item.qty)}</span>
                </div>
              ))}
            </div>

            <div style={{ marginTop: '.8rem', fontSize: '.8rem', color: 'var(--fg2)', display:'flex', alignItems:'center', gap:4 }}>
              <MapPinIcon style={{width:13,height:13}} /> {o.address}
            </div>
          </div>
        ))}
      </div>
      <Footer />
    </>
  );
}
