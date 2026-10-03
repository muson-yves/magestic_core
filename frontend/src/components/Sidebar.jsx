import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { CubeIcon, ClipboardDocumentListIcon, UsersIcon, ArrowRightStartOnRectangleIcon } from '@heroicons/react/24/outline';

export default function Sidebar() {
  const { logout } = useAuth();
  const navigate   = useNavigate();
  const location   = useLocation();
  const p          = location.pathname;

  const handleLogout = async () => { await logout(); navigate('/admin/login'); };

  return (
    <aside className="sidebar">
      <Link to="/" style={{ fontSize: '1.1rem', fontWeight: 900, letterSpacing: '.04em', color: 'var(--fg)' }}>
        MAJESTIC<span style={{ color: 'var(--accent)' }}>CORE</span>
      </Link>
      <nav className="side-nav">
        <Link to="/admin/dashboard" className={p === '/admin/dashboard' ? 'active' : ''}><CubeIcon style={{width:16,height:16}} /> Products</Link>
        <Link to="/admin/orders"    className={p === '/admin/orders'    ? 'active' : ''}><ClipboardDocumentListIcon style={{width:16,height:16}} /> Orders</Link>
        <Link to="/admin/buyers"    className={p === '/admin/buyers'    ? 'active' : ''}><UsersIcon style={{width:16,height:16}} /> Buyers</Link>
        <button onClick={handleLogout}><ArrowRightStartOnRectangleIcon style={{width:16,height:16}} /> Logout</button>
      </nav>
    </aside>
  );
}
