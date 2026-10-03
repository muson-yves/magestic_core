import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { useBuyer } from '../context/BuyerContext';
import { useCurrency } from '../context/CurrencyContext';
import api from '../api';
import { ShoppingCartIcon, HeartIcon } from '@heroicons/react/24/outline';
import { HeartIcon as HeartSolid } from '@heroicons/react/24/solid';

const IMG = 'http://localhost:5000/uploads/';

function Stars({ rating }) {
  const r = Math.round(Number(rating));
  return <span style={{ color: 'var(--accent)' }}>{'★'.repeat(r)}{'☆'.repeat(5 - r)}</span>;
}

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { buyer, refreshCart } = useBuyer();
  const { format } = useCurrency();

  const [product,    setProduct]    = useState(null);
  const [reviews,    setReviews]    = useState([]);
  const [wishlisted, setWishlisted] = useState(false);
  const [qty,        setQty]        = useState(1);
  const [myRating,   setMyRating]   = useState(0);
  const [comment,    setComment]    = useState('');
  const [alert,      setAlert]      = useState(null);
  const [loading,    setLoading]    = useState(true);
  const [activeImg,  setActiveImg]  = useState(null);

  const showAlert = (msg, type = 'success') => {
    setAlert({ msg, type });
    setTimeout(() => setAlert(null), 3500);
  };

  const fetchData = async () => {
    const [pr, rv] = await Promise.all([
      api.get(`/products/${id}`),
      api.get(`/products/${id}/reviews`),
    ]);
    setProduct(pr.data);
    setReviews(rv.data);
    setActiveImg(pr.data.image || null);
    if (buyer) {
      const mine = rv.data.find(r => String(r.buyer_id) === String(buyer.id));
      if (mine) { setMyRating(mine.rating); setComment(mine.comment); }
      api.get('/wishlist')
        .then(r => setWishlisted(r.data.some(w => String(w.product_id) === String(id))))
        .catch(() => {});
    }
  };

  useEffect(() => {
    setLoading(true);
    fetchData().catch(() => navigate('/')).finally(() => setLoading(false));
  }, [id, buyer]);

  const addToCart = async () => {
    if (!buyer) { navigate('/auth'); return; }
    try {
      await api.post('/cart', { product_id: product.id, qty });
      await refreshCart();
      showAlert('Added to cart!');
    } catch (e) { showAlert(e.response?.data?.error || 'Error', 'error'); }
  };

  const toggleWish = async () => {
    if (!buyer) { navigate('/auth'); return; }
    try {
      if (wishlisted) await api.delete(`/wishlist/${product.id}`);
      else await api.post('/wishlist', { product_id: product.id });
      setWishlisted(!wishlisted);
    } catch {}
  };

  const submitReview = async e => {
    e.preventDefault();
    if (!buyer) { navigate('/auth'); return; }
    try {
      await api.post(`/products/${id}/reviews`, { rating: myRating, comment });
      showAlert('Review submitted!');
      fetchData();
    } catch (e) { showAlert(e.response?.data?.error || 'Error', 'error'); }
  };

  if (loading) return <><Navbar /><div className="spinner" /></>;
  if (!product) return null;

  const discount = product.original_price && product.original_price > product.price
    ? Math.round((1 - product.price / product.original_price) * 100) : null;

  return (
    <>
      <Navbar />
      <button className="back-btn" onClick={() => navigate(-1)}>← Back</button>

      <div className="detail-page">
        <div className="detail-gallery">
          <img
            src={activeImg ? IMG + activeImg : 'https://placehold.co/600x420/161616/555?text=No+Image'}
            alt={product.name}
            className="detail-main-img"
          />
          {product.extra_images?.length > 0 && (
            <div className="detail-thumbs">
              <button
                className={`detail-thumb ${activeImg === product.image ? 'active' : ''}`}
                onClick={() => setActiveImg(product.image)}
              >
                <img src={product.image ? IMG + product.image : 'https://placehold.co/80x80/161616/555?text=?'} alt="" />
              </button>
              {product.extra_images.map(fn => (
                <button
                  key={fn}
                  className={`detail-thumb ${activeImg === fn ? 'active' : ''}`}
                  onClick={() => setActiveImg(fn)}
                >
                  <img src={IMG + fn} alt="" />
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="detail-info">
          <span className="product-cat">{product.category.replace('_', ' ')}</span>
          <h1>{product.name}</h1>

          <div className="detail-stars">
            <Stars rating={product.avg_rating} />
            <span style={{ color: 'var(--accent)', fontWeight: 700 }}>{Number(product.avg_rating).toFixed(1)}</span>
            <span style={{ color: 'var(--fg2)' }}>({product.review_count} reviews)</span>
          </div>

          <div className="detail-price-row">
            <span className="detail-price">{format(product.price)}</span>
            {discount && <span className="detail-orig">{format(product.original_price)}</span>}
            {discount && <span className="detail-discount">Save {discount}%</span>}
          </div>

          <p className={`detail-stock ${product.stock > 0 ? 'in' : 'out'}`}>
            {product.stock > 0 ? `✓ In Stock (${product.stock} available)` : '✗ Out of Stock'}
          </p>

          <p className="detail-desc">{product.description || 'No description available.'}</p>

          {product.stock > 0 && (
            <div className="qty-row">
              <span style={{ fontSize: '.85rem', color: 'var(--fg2)' }}>Qty:</span>
              <div className="qty-ctrl">
                <button onClick={() => setQty(q => Math.max(1, q - 1))}>−</button>
                <span>{qty}</span>
                <button onClick={() => setQty(q => Math.min(product.stock, q + 1))}>+</button>
              </div>
            </div>
          )}

          {alert && <div className={`alert ${alert.type}`}>{alert.msg}</div>}

          <div className="detail-actions">
            <button className="btn-primary" onClick={addToCart} disabled={product.stock === 0}>
              <ShoppingCartIcon style={{width:16,height:16}} /> Add to Cart
            </button>
            <button
              className="btn-secondary"
              onClick={toggleWish}
              style={{ background: wishlisted ? 'var(--red)' : undefined, color: wishlisted ? '#fff' : undefined }}
            >
              {wishlisted
                ? <><HeartSolid style={{width:16,height:16}} /> Wishlisted</>
                : <><HeartIcon style={{width:16,height:16}} /> Wishlist</>}
            </button>
          </div>

          <div className="reviews-section">
            <h3>Customer Reviews</h3>

            {buyer && (
              <form className="review-form" onSubmit={submitReview}>
                <p style={{ fontSize: '.85rem', fontWeight: 600, marginBottom: '.5rem' }}>
                  {reviews.find(r => String(r.buyer_id) === String(buyer.id)) ? 'Update your review' : 'Write a review'}
                </p>
                <div className="star-select">
                  {[1,2,3,4,5].map(n => (
                    <button key={n} type="button" className={myRating >= n ? 'on' : ''} onClick={() => setMyRating(n)}>★</button>
                  ))}
                </div>
                <div className="form-group">
                  <textarea rows={2} placeholder="Share your experience..." value={comment} onChange={e => setComment(e.target.value)} />
                </div>
                <button type="submit" className="btn-primary" style={{ padding: '.5rem 1.2rem', fontSize: '.85rem' }} disabled={!myRating}>
                  Submit Review
                </button>
              </form>
            )}

            {reviews.length === 0 ? (
              <p style={{ color: 'var(--fg2)', fontSize: '.88rem' }}>No reviews yet. Be the first!</p>
            ) : reviews.map(r => (
              <div key={r.id} className="review-card">
                <div className="review-header">
                  <span className="reviewer">{r.buyer_name}</span>
                  <span className="review-date">{new Date(r.createdAt || r.created_at).toLocaleDateString()}</span>
                </div>
                <div style={{ color: 'var(--accent)', marginBottom: '.3rem' }}>{'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}</div>
                {r.comment && <p className="review-text">{r.comment}</p>}
              </div>
            ))}
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}
