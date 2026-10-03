import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import CheckoutForm from '../components/CheckoutForm';
import { useBuyer } from '../context/BuyerContext';
import { useCurrency } from '../context/CurrencyContext';
import api from '../api';
import { ShoppingCartIcon } from '@heroicons/react/24/outline';

const STRIPE_KEY = import.meta.env.VITE_STRIPE_PUBLIC_KEY;
const stripePromise = STRIPE_KEY && !STRIPE_KEY.includes('REPLACE') ? loadStripe(STRIPE_KEY) : null;
const IMG = 'http://localhost:5000/uploads/';

export default function Cart() {
  const navigate = useNavigate();
  const { buyer, refreshCart } = useBuyer();
  const { format } = useCurrency();
  const [items,        setItems]        = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [address,      setAddress]      = useState('');
  const [alert,        setAlert]        = useState(null);
  const [showCheckout, setShowCheckout] = useState(false);
  const [clientSecret, setClientSecret] = useState(null);

  const showMsg = (msg, type = 'success') => { setAlert({ msg, type }); setTimeout(() => setAlert(null), 4000); };

  const fetchCart = async () => {
    try { const r = await api.get('/cart'); setItems(r.data); }
    catch { setItems([]); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    if (!buyer) { navigate('/auth'); return; }
    fetchCart();
  }, [buyer]);

  const updateQty = async (item, qty) => {
    await api.put(`/cart/${item.id}`, { qty });
    fetchCart(); refreshCart();
  };

  const remove = async (item) => {
    await api.delete(`/cart/${item.id}`);
    fetchCart(); refreshCart();
  };

  const startCheckout = async () => {
    if (!address.trim()) { showMsg('Please enter a delivery address.', 'error'); return; }
    try {
      const r = await api.post('/payment/create-intent');
      setClientSecret(r.data.clientSecret);
      setShowCheckout(true);
    } catch (err) {
      showMsg(err.response?.data?.error || 'Could not start checkout.', 'error');
    }
  };

  const handleOrderSuccess = () => {
    showMsg('Payment successful! Order placed 🎉');
    setShowCheckout(false);
    setClientSecret(null);
    fetchCart(); refreshCart();
    setTimeout(() => navigate('/orders'), 1500);
  };

  const handleCancel = () => { setShowCheckout(false); setClientSecret(null); };

  const subtotal = items.reduce((s, i) => s + i.price * i.qty, 0);
  const shipping = subtotal > 100 ? 0 : 9.99;
  const total    = subtotal + shipping;

  if (!buyer) return null;

  return (
    <>
      <Navbar />
      <div className="page">
        <div className="section-title"><h2><ShoppingCartIcon style={{width:20,height:20,display:'inline',marginRight:8}} />Your Cart</h2></div>

        {alert && <div className={`alert ${alert.type}`}>{alert.msg}</div>}

        {loading ? <div className="spinner" /> : items.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon"><ShoppingCartIcon style={{width:40,height:40}} /></div>
            <p>Your cart is empty.</p>
            <button className="btn-primary" onClick={() => navigate('/')}>Start Shopping</button>
          </div>
        ) : (
          <div className="cart-page" style={{ padding: 0 }}>
            <div className="cart-items">
              {items.map(item => (
                <div key={item.id} className="cart-item">
                  <img
                    src={item.image ? IMG + item.image : 'https://placehold.co/80x80/161616/555?text=?'}
                    alt={item.name}
                    onClick={() => navigate(`/product/${item.product_id}`)}
                    style={{ cursor: 'pointer' }}
                  />
                  <div className="cart-item-info">
                    <p className="cart-item-name" onClick={() => navigate(`/product/${item.product_id}`)} style={{ cursor: 'pointer' }}>
                      {item.name}
                    </p>
                    <p className="cart-item-price">{format(item.price)}</p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '.8rem', marginTop: '.5rem' }}>
                      <div className="qty-ctrl">
                        <button onClick={() => updateQty(item, item.qty - 1)}>−</button>
                        <span>{item.qty}</span>
                        <button onClick={() => updateQty(item, Math.min(item.stock, item.qty + 1))}>+</button>
                      </div>
                      <button className="btn-danger" onClick={() => remove(item)}>Remove</button>
                    </div>
                  </div>
                  <div style={{ fontWeight: 800, fontSize: '1rem', whiteSpace: 'nowrap' }}>
                    {format(item.price * item.qty)}
                  </div>
                </div>
              ))}
            </div>

            <div className="cart-summary">
              <h3>Order Summary</h3>
              <div className="summary-row"><span>Subtotal ({items.reduce((s,i)=>s+i.qty,0)} items)</span><span>{format(subtotal)}</span></div>
              <div className="summary-row"><span>Shipping</span><span>{shipping === 0 ? <span style={{color:'var(--green)'}}>FREE</span> : format(shipping)}</span></div>
              {shipping > 0 && <p style={{ fontSize: '.75rem', color: 'var(--fg2)', marginBottom: '.5rem' }}>Free shipping on orders over $100</p>}
              <div className="summary-row total"><span>Total</span><span>{format(total)}</span></div>

              {!showCheckout ? (
                <>
                  <div className="form-group" style={{ marginTop: '1rem' }}>
                    <label>Delivery Address</label>
                    <textarea
                      rows={3}
                      value={address}
                      onChange={e => setAddress(e.target.value)}
                      placeholder="Enter your full delivery address..."
                    />
                  </div>
                  <button
                    className="btn-primary"
                    style={{ width: '100%', justifyContent: 'center', marginTop: '.5rem' }}
                    onClick={stripePromise ? startCheckout : () => showMsg('Payment not configured. Add your Stripe keys to proceed.', 'error')}
                  >
                    Proceed to Payment
                  </button>
                  {!stripePromise && (
                    <p style={{ fontSize: '.75rem', color: 'var(--fg2)', marginTop: '.5rem', textAlign: 'center' }}>
                      ⚠️ Stripe not configured — add keys to enable checkout
                    </p>
                  )}
                </>
              ) : clientSecret && stripePromise ? (
                <Elements stripe={stripePromise} options={{ clientSecret }}>
                  <CheckoutForm address={address} onSuccess={handleOrderSuccess} onCancel={handleCancel} />
                </Elements>
              ) : (
                <div className="spinner" />
              )}
            </div>
          </div>
        )}
      </div>
      <Footer />
    </>
  );
}
