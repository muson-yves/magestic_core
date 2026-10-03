import { useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import ProductCard from '../components/ProductCard';
import api from '../api';
import { MagnifyingGlassIcon, StarIcon, ComputerDesktopIcon, TruckIcon, LockClosedIcon } from '@heroicons/react/24/outline';

const HERO_IMAGES = ['/hero1.jpg', '/hero2.jpg', '/hero3.jpg'];

export default function Home() {
  const [searchParams, setSearchParams] = useSearchParams();
  const cat  = searchParams.get('cat')  || 'all';
  const q    = searchParams.get('q')    || '';
  const sort = searchParams.get('sort') || 'newest';

  const [products,  setProducts]  = useState([]);
  const [featured,  setFeatured]  = useState([]);
  const [wishlist,  setWishlist]  = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [heroIndex, setHeroIndex] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setHeroIndex(i => (i + 1) % HERO_IMAGES.length), 5000);
    return () => clearInterval(t);
  }, []);

  const fetchWishlist = useCallback(() => {
    api.get('/wishlist').then(r => setWishlist(r.data.map(w => w.product_id))).catch(() => {});
  }, []);

  useEffect(() => {
    fetchWishlist();
    api.get('/products/featured').then(r => setFeatured(r.data)).catch(() => {});
  }, [fetchWishlist]);

  useEffect(() => {
    setLoading(true);
    const params = {};
    if (cat !== 'all') params.cat = cat;
    if (q)    params.q    = q;
    if (sort) params.sort = sort;
    api.get('/products', { params })
      .then(r => setProducts(r.data))
      .finally(() => setLoading(false));
  }, [cat, q, sort]);

  const setParam = (key, val) => {
    const p = Object.fromEntries(searchParams);
    if (val === 'all' || val === 'newest') delete p[key]; else p[key] = val;
    setSearchParams(p);
  };

  return (
    <>
      <Navbar
        activeCat={cat}
        onCat={key => setParam('cat', key)}
      />

      {/* HERO */}
      {!q && cat === 'all' && (
        <section className="hero-section" style={{ backgroundImage: `url(${HERO_IMAGES[heroIndex]})` }}>
          <div className="hero-content">
            <div className="hero-text">
              <p className="hero-tag">✦ Premium Tech Store</p>
              <h1>Shop the Best<br /><span>Tech Gear</span></h1>
              <p className="hero-sub">Cameras, headphones, gaming PCs, laptops &amp; more — all in one place.</p>
              <div className="hero-actions">
                <button className="btn-primary" onClick={() => document.getElementById('products').scrollIntoView({ behavior: 'smooth' })}>
                  Shop Now →
                </button>
                <button className="btn-secondary" onClick={() => setParam('cat', 'gaming_pc')}>
                  <ComputerDesktopIcon style={{width:16,height:16}} /> Gaming Gear
                </button>
              </div>
              <div className="hero-stats">
                <span><TruckIcon style={{width:14,height:14,display:'inline',marginRight:4}} />Free Shipping</span>
                <span><LockClosedIcon style={{width:14,height:14,display:'inline',marginRight:4}} />Secure Checkout</span>
                <span><StarIcon style={{width:14,height:14,display:'inline',marginRight:4}} />Top Rated</span>
              </div>
            </div>
          </div>
        </section>
      )}

      <div className="page">
        {/* FEATURED */}
        {!q && cat === 'all' && featured.length > 0 && (
          <section style={{ marginBottom: '2rem' }}>
            <div className="section-title">
              <h2><StarIcon style={{width:18,height:18,display:'inline',marginRight:6}} />Featured Products</h2>
            </div>
            <div className="product-grid">
              {featured.map(p => (
                <ProductCard
                  key={p.id} product={p}
                  wishlisted={wishlist.includes(p.id)}
                  onWishToggle={fetchWishlist}
                />
              ))}
            </div>
          </section>
        )}

        {/* ALL PRODUCTS */}
        <section id="products">
          <div className="section-title">
            <h2>{q ? `Results for "${q}"` : cat === 'all' ? 'All Products' : cat.replace('_', ' ')}</h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem' }}>
              <span style={{ fontSize: '.8rem', color: 'var(--fg2)' }}>{products.length} items</span>
              <select
                style={{ padding: '.3rem .6rem', background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '7px', color: 'var(--fg)', fontSize: '.8rem' }}
                value={sort}
                onChange={e => setParam('sort', e.target.value)}
              >
                <option value="newest">Newest</option>
                <option value="price_asc">Price: Low to High</option>
                <option value="price_desc">Price: High to Low</option>
                <option value="rating">Top Rated</option>
              </select>
            </div>
          </div>

          {loading ? <div className="spinner" /> : products.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon"><MagnifyingGlassIcon style={{width:40,height:40}} /></div>
              <p>No products found.</p>
              <button className="btn-primary" onClick={() => setSearchParams({})}>Browse All</button>
            </div>
          ) : (
            <div className="product-grid">
              {products.map(p => (
                <ProductCard
                  key={p.id} product={p}
                  wishlisted={wishlist.includes(p.id)}
                  onWishToggle={fetchWishlist}
                />
              ))}
            </div>
          )}
        </section>
      </div>

      <Footer />
    </>
  );
}
