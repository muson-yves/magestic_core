import { useState, useRef, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { useCurrency } from '../context/CurrencyContext';
import { useBuyer } from '../context/BuyerContext';
import {
  MagnifyingGlassIcon, SunIcon, MoonIcon, UserIcon, CubeIcon,
  HeartIcon, ArrowRightStartOnRectangleIcon, ShoppingCartIcon,
  Cog6ToothIcon, Squares2X2Icon, CameraIcon, MusicalNoteIcon,
  ComputerDesktopIcon, DeviceTabletIcon, SpeakerWaveIcon, EllipsisHorizontalCircleIcon,
} from '@heroicons/react/24/outline';

const CATS = [
  { key:'all',        label:'All',        icon:<Squares2X2Icon style={{width:15,height:15}} /> },
  { key:'cameras',    label:'Cameras',    icon:<CameraIcon style={{width:15,height:15}} /> },
  { key:'headphones', label:'Headphones', icon:<MusicalNoteIcon style={{width:15,height:15}} /> },
  { key:'gaming_pc',  label:'Gaming PC',  icon:<ComputerDesktopIcon style={{width:15,height:15}} /> },
  { key:'laptops',    label:'Laptops',    icon:<DeviceTabletIcon style={{width:15,height:15}} /> },
  { key:'speakers',   label:'Speakers',   icon:<SpeakerWaveIcon style={{width:15,height:15}} /> },
  { key:'others',     label:'Others',     icon:<EllipsisHorizontalCircleIcon style={{width:15,height:15}} /> },
];

export default function Navbar({ activeCat = 'all', onCat }) {
  const [q, setQ] = useState('');
  const navigate = useNavigate();
  const { theme, toggle } = useTheme();
  const { buyer, cartCount, logout } = useBuyer();
  const { currency, currencies, setCurrency } = useCurrency();
  const [showCurr, setShowCurr] = useState(false);
  const currRef = useRef(null);

  useEffect(() => {
    const handler = e => { if (currRef.current && !currRef.current.contains(e.target)) setShowCurr(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleSearch = e => {
    e.preventDefault();
    if (q.trim()) navigate(`/?q=${encodeURIComponent(q.trim())}`);
    else navigate('/');
  };

  const handleLogout = async () => { await logout(); navigate('/'); };

  return (
    <header className="topbar">
      <div className="topbar-inner">
        <Link to="/" className="nav-logo">MAJESTIC<span>CORE</span></Link>

        <form className="search-form" onSubmit={handleSearch}>
          <input
            type="text" placeholder="Search products..."
            value={q} onChange={e => setQ(e.target.value)}
          />
          <button type="submit"><MagnifyingGlassIcon style={{width:16,height:16}} /></button>
        </form>

        <div className="nav-right">
          <div className="currency-picker" ref={currRef}>
            <button className="theme-btn" onClick={() => setShowCurr(v => !v)} title="Change currency">
              {currency.code}
            </button>
            {showCurr && (
              <div className="currency-dropdown">
                {currencies.map(c => (
                  <button
                    key={c.code}
                    className={`currency-option${c.code === currency.code ? ' active' : ''}`}
                    onClick={() => { setCurrency(c.code); setShowCurr(false); }}
                  >
                    <span>{c.symbol}</span> {c.code}
                  </button>
                ))}
              </div>
            )}
          </div>

          <button className="theme-btn" onClick={toggle} title="Toggle theme">
            {theme === 'dark' ? <SunIcon style={{width:18,height:18}} /> : <MoonIcon style={{width:18,height:18}} />}
          </button>

          {buyer ? (
            <>
              <button className="nav-btn" onClick={() => navigate('/account')}>
                <span className="icon"><UserIcon style={{width:17,height:17}} /></span>
                <span>{buyer.name.split(' ')[0]}</span>
              </button>
              <button className="nav-btn" onClick={() => navigate('/orders')}>
                <span className="icon"><CubeIcon style={{width:17,height:17}} /></span>
                <span>Orders</span>
              </button>
              <button className="nav-btn" onClick={() => navigate('/wishlist')}>
                <span className="icon"><HeartIcon style={{width:17,height:17}} /></span>
                <span>Wishlist</span>
              </button>
              <button className="nav-btn" onClick={handleLogout}>
                <span className="icon"><ArrowRightStartOnRectangleIcon style={{width:17,height:17}} /></span>
                <span>Logout</span>
              </button>
            </>
          ) : (
            <button className="nav-btn" onClick={() => navigate('/auth')}>
              <span className="icon"><UserIcon style={{width:17,height:17}} /></span>
              <span>Sign In</span>
            </button>
          )}

          <button className="nav-btn cart-btn" onClick={() => navigate('/cart')}>
            <span className="icon"><ShoppingCartIcon style={{width:17,height:17}} /></span>
            <span>Cart</span>
            {cartCount > 0 && <span className="cart-count">{cartCount > 99 ? '99+' : cartCount}</span>}
          </button>

          <button className="nav-btn" onClick={() => navigate('/admin/login')}>
            <span className="icon"><Cog6ToothIcon style={{width:17,height:17}} /></span>
            <span>Admin</span>
          </button>
        </div>
      </div>

      {onCat && (
        <div className="catbar">
          <div className="catbar-inner">
            {CATS.map(c => (
              <button
                key={c.key}
                className={`cat-pill${activeCat === c.key ? ' active' : ''}`}
                onClick={() => onCat(c.key)}
              >
                <span>{c.icon}</span>{c.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </header>
  );
}
