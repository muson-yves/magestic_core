import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import ProductCard from '../components/ProductCard';
import { useBuyer } from '../context/BuyerContext';
import api from '../api';
import { HeartIcon } from '@heroicons/react/24/outline';

export default function Wishlist() {
  const navigate = useNavigate();
  const { buyer } = useBuyer();
  const [items,   setItems]   = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchWishlist = () => {
    api.get('/wishlist').then(r => setItems(r.data)).finally(() => setLoading(false));
  };

  useEffect(() => {
    if (!buyer) { navigate('/auth'); return; }
    fetchWishlist();
  }, [buyer]);

  if (!buyer) return null;

  return (
    <>
      <Navbar />
      <div className="page">
        <div className="section-title"><h2><HeartIcon style={{width:20,height:20,display:'inline',marginRight:8}} />My Wishlist</h2></div>

        {loading ? <div className="spinner" /> : items.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon"><HeartIcon style={{width:40,height:40}} /></div>
            <p>Your wishlist is empty.</p>
            <button className="btn-primary" onClick={() => navigate('/')}>Discover Products</button>
          </div>
        ) : (
          <div className="product-grid">
            {items.map(item => (
              <ProductCard
                key={item.id}
                product={{ ...item, id: item.product_id, avg_rating: item.avg_rating, review_count: 0 }}
                wishlisted={true}
                onWishToggle={fetchWishlist}
              />
            ))}
          </div>
        )}
      </div>
      <Footer />
    </>
  );
}
