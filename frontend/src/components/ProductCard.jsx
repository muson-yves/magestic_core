import { useNavigate } from 'react-router-dom';
import { useBuyer } from '../context/BuyerContext';
import { useCurrency } from '../context/CurrencyContext';
import api from '../api';
import { HeartIcon } from '@heroicons/react/24/solid';
import { HeartIcon as HeartOutlineIcon, ShoppingCartIcon } from '@heroicons/react/24/outline';

const IMG = 'http://localhost:5000/uploads/';

function Stars({ rating, count }) {
  const r = Math.round(Number(rating) * 2) / 2;
  return (
    <div className="stars">
      <span className="s">{'★'.repeat(Math.floor(r))}{'☆'.repeat(5 - Math.floor(r))}</span>
      <span className="rc">({count})</span>
    </div>
  );
}

export default function ProductCard({ product, wishlisted = false, onWishToggle }) {
  const navigate = useNavigate();
  const { buyer, refreshCart } = useBuyer();
  const { format } = useCurrency();

  const discount = product.original_price && product.original_price > product.price
    ? Math.round((1 - product.price / product.original_price) * 100)
    : null;

  const addToCart = async e => {
    e.stopPropagation();
    if (!buyer) { navigate('/auth'); return; }
    try {
      await api.post('/cart', { product_id: product.id, qty: 1 });
      await refreshCart();
    } catch {}
  };

  const toggleWish = async e => {
    e.stopPropagation();
    if (!buyer) { navigate('/auth'); return; }
    try {
      if (wishlisted) await api.delete(`/wishlist/${product.id}`);
      else await api.post('/wishlist', { product_id: product.id });
      onWishToggle && onWishToggle(product.id);
    } catch {}
  };

  return (
    <div className="product-card" onClick={() => navigate(`/product/${product.id}`)}>
      <div className="product-img-wrap">
        <img
          src={product.image ? IMG + product.image : 'https://placehold.co/400x300/161616/555?text=No+Image'}
          alt={product.name}
        />
        {product.featured === 1 && <span className="badge featured">Featured</span>}
        {product.stock === 0 && <span className="badge out">Out of Stock</span>}
        {discount && product.stock > 0 && <span className="badge sale">-{discount}%</span>}
        <button
          className={`wish-btn${wishlisted ? ' active' : ''}`}
          onClick={toggleWish}
          title={wishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
        >
          {wishlisted ? <HeartIcon style={{width:16,height:16}} /> : <HeartOutlineIcon style={{width:16,height:16}} />}
        </button>
      </div>
      <div className="product-body">
        <span className="product-cat">{product.category.replace('_', ' ')}</span>
        <p className="product-name">{product.name}</p>
        <Stars rating={product.avg_rating || 0} count={product.review_count || 0} />
        <div className="price-row">
          <span className="price">{format(product.price)}</span>
          {discount && <span className="orig-price">{format(product.original_price)}</span>}
          {discount && <span className="discount">-{discount}%</span>}
        </div>
        <button
          className="add-cart-btn"
          onClick={addToCart}
          disabled={product.stock === 0}
        >
          {product.stock === 0 ? 'Out of Stock' : <><ShoppingCartIcon style={{width:15,height:15}} /> Add to Cart</>}
        </button>
      </div>
    </div>
  );
}
