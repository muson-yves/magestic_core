import { useEffect, useRef, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import { useCurrency } from '../context/CurrencyContext';
import api from '../api';
import {
  CubeIcon, UsersIcon, ClipboardDocumentListIcon, CurrencyDollarIcon,
  ExclamationTriangleIcon, ChartBarIcon, PencilSquareIcon, PlusCircleIcon,
  StarIcon, ArrowTopRightOnSquareIcon,
} from '@heroicons/react/24/outline';

const CATS = ['cameras','headphones','gaming_pc','laptops','speakers','others'];
const IMG  = 'http://localhost:5000/uploads/';
const EMPTY = { name:'', description:'', price:'', original_price:'', category:'', stock:'', featured:false };

export default function Dashboard() {
  const navigate = useNavigate();
  const { format } = useCurrency();
  const fileRef      = useRef();
  const extrasRef    = useRef();
  const [tab,            setTab]            = useState('overview');
  const [products,       setProducts]       = useState([]);
  const [stats,          setStats]          = useState({});
  const [form,           setForm]           = useState(EMPTY);
  const [editId,         setEditId]         = useState(null);
  const [preview,        setPreview]        = useState(null);
  const [extraPreviews,  setExtraPreviews]  = useState([]);
  const [existingExtras, setExistingExtras] = useState([]);
  const [deleteImages,   setDeleteImages]   = useState([]);
  const [alert,          setAlert]          = useState(null);
  const [loading,        setLoading]        = useState(false);

  const fetchAll = useCallback(() => {
    api.get('/products').then(r => setProducts(r.data)).catch(() => {});
    api.get('/admin/stats').then(r => setStats(r.data)).catch(() => {});
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const showAlert = (msg, type = 'success') => { setAlert({ msg, type }); setTimeout(() => setAlert(null), 4000); };

  const resetForm = () => {
    setForm(EMPTY); setEditId(null); setPreview(null);
    setExtraPreviews([]); setExistingExtras([]); setDeleteImages([]);
    if (fileRef.current) fileRef.current.value = '';
    if (extrasRef.current) extrasRef.current.value = '';
  };

  const handleSubmit = async e => {
    e.preventDefault(); setLoading(true);
    const fd = new FormData();
    Object.entries(form).forEach(([k, v]) => fd.append(k, k === 'featured' ? (v ? '1' : '0') : v));
    if (fileRef.current?.files[0]) fd.append('image', fileRef.current.files[0]);
    extraPreviews.forEach(ep => fd.append('images', ep.file));
    if (deleteImages.length) fd.append('delete_images', JSON.stringify(deleteImages));
    try {
      if (editId) await api.put(`/admin/products/${editId}`, fd);
      else        await api.post('/admin/products', fd);
      showAlert(editId ? 'Product updated!' : 'Product added!');
      resetForm(); fetchAll(); setTab('products');
    } catch (err) { showAlert(err.response?.data?.error || 'Error', 'error'); }
    finally { setLoading(false); }
  };

  const handleEdit = async p => {
    setEditId(p.id);
    setForm({ name:p.name, description:p.description||'', price:p.price, original_price:p.original_price||'', category:p.category, stock:p.stock, featured: !!p.featured });
    setPreview(p.image ? IMG + p.image : null);
    setExtraPreviews([]); setDeleteImages([]);
    const r = await api.get(`/products/${p.id}`);
    setExistingExtras(r.data.extra_images || []);
    setTab('add');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async id => {
    if (!window.confirm('Delete this product? Buyers who only purchased this product will also be removed.')) return;
    const r = await api.delete(`/admin/products/${id}`);
    const removed = r.data.buyersRemoved;
    showAlert(`Deleted.${removed ? ` ${removed} buyer(s) also removed.` : ''}`);
    fetchAll();
  };

  const handleExtrasChange = e => {
    const files = Array.from(e.target.files);
    const slots = 4 - existingExtras.length - extraPreviews.length;
    const allowed = files.slice(0, Math.max(0, slots));
    const newPreviews = allowed.map(f => ({ url: URL.createObjectURL(f), file: f }));
    setExtraPreviews(prev => [...prev, ...newPreviews]);
    e.target.value = '';
  };

  const removeExtraPreview  = idx => setExtraPreviews(prev => prev.filter((_, i) => i !== idx));
  const removeExistingExtra = fn  => {
    setDeleteImages(prev => [...prev, fn]);
    setExistingExtras(prev => prev.filter(f => f !== fn));
  };

  const statCards = [
    { icon: <CubeIcon style={{width:22,height:22}} />,                  label: 'Products',     value: stats.products   ?? 0, color: '#f90' },
    { icon: <UsersIcon style={{width:22,height:22}} />,                 label: 'Buyers',       value: stats.buyers     ?? 0, color: '#60a5fa' },
    { icon: <ClipboardDocumentListIcon style={{width:22,height:22}} />, label: 'Orders',       value: stats.orders     ?? 0, color: '#a78bfa' },
    { icon: <CurrencyDollarIcon style={{width:22,height:22}} />,        label: 'Revenue',      value: format(stats.revenue ?? 0), color: '#22c55e' },
    { icon: <ExclamationTriangleIcon style={{width:22,height:22}} />,   label: 'Out of Stock', value: stats.outOfStock ?? 0, color: '#ef4444' },
  ];

  const totalExtras = existingExtras.length + extraPreviews.length;

  return (
    <div className="admin-layout">
      <Sidebar />
      <main className="admin-main">

        {/* HEADER */}
        <div className="dash-header">
          <div>
            <h1 className="dash-title">Dashboard</h1>
            <p className="dash-sub">Manage your store products</p>
          </div>
          <button className="btn-store" onClick={() => navigate('/')}>View Store ↗</button>
        </div>

        {/* STAT CARDS */}
        <div className="dash-stats">
          {statCards.map(s => (
            <div className="dash-stat" key={s.label}>
              <div className="dash-stat-icon" style={{ background: s.color + '22', color: s.color }}>{s.icon}</div>
              <div>
                <div className="dash-stat-val" style={{ color: s.color }}>{s.value}</div>
                <div className="dash-stat-label">{s.label}</div>
              </div>
            </div>
          ))}
        </div>

        {/* TABS */}
        <div className="dash-tabs">
          {[['overview', <ChartBarIcon style={{width:15,height:15}} />, 'Overview'], ['add', editId ? <PencilSquareIcon style={{width:15,height:15}} /> : <PlusCircleIcon style={{width:15,height:15}} />, editId ? 'Edit Product' : 'Add Product'], ['products', <CubeIcon style={{width:15,height:15}} />, 'Products']].map(([key, icon, label]) => (
            <button key={key} className={`dash-tab${tab === key ? ' active' : ''}`} onClick={() => { setTab(key); if (key !== 'add') resetForm(); }}>
              {icon} {label}
            </button>
          ))}
        </div>

        {alert && <div className={`alert ${alert.type}`}>{alert.msg}</div>}

        {/* OVERVIEW TAB */}
        {tab === 'overview' && (
          <div className="dash-overview">
            <div className="dash-panel">
              <div className="dash-panel-head"><CubeIcon style={{width:16,height:16,display:'inline',marginRight:6}} />Recent Products</div>
              {products.slice(0, 5).map(p => (
                <div className="dash-row" key={p.id}>
                  <img src={p.image ? IMG+p.image : 'https://placehold.co/40x40/161616/555?text=?'} className="dash-row-img" alt="" />
                  <div className="dash-row-info">
                    <div className="dash-row-name">{p.name}</div>
                    <div className="dash-row-meta"><span className="cat-tag">{p.category.replace('_',' ')}</span></div>
                  </div>
                  <div className="dash-row-price">{format(p.price)}</div>
                  <div className={`dash-row-stock ${p.stock === 0 ? 'out' : ''}`}>{p.stock === 0 ? 'Out' : `${p.stock} left`}</div>
                </div>
              ))}
              {products.length === 0 && <p className="dash-empty">No products yet. <button className="link-btn" onClick={() => setTab('add')}>Add one →</button></p>}
            </div>
          </div>
        )}

        {/* ADD / EDIT TAB */}
        {tab === 'add' && (
          <div className="dash-form-card">
            <form onSubmit={handleSubmit}>
              <div className="form-row">
                <div className="form-group"><label>Product Name *</label>
                  <input type="text" required placeholder="e.g. Sony WH-1000XM5" value={form.name} onChange={e => setForm({...form, name:e.target.value})} /></div>
                <div className="form-group"><label>Category *</label>
                  <select required value={form.category} onChange={e => setForm({...form, category:e.target.value})}>
                    <option value="">Select category</option>
                    {CATS.map(c => <option key={c} value={c}>{c.replace('_',' ')}</option>)}
                  </select></div>
              </div>
              <div className="form-row">
                <div className="form-group"><label>Price ($) *</label>
                  <input type="number" step="0.01" min="0" required placeholder="0.00" value={form.price} onChange={e => setForm({...form, price:e.target.value})} /></div>
                <div className="form-group"><label>Original Price ($) <span style={{color:'var(--fg2)',fontWeight:400,fontSize:'.75rem'}}>(optional — shows discount)</span></label>
                  <input type="number" step="0.01" min="0" placeholder="0.00" value={form.original_price} onChange={e => setForm({...form, original_price:e.target.value})} /></div>
              </div>
              <div className="form-row">
                <div className="form-group"><label>Stock Quantity *</label>
                  <input type="number" min="0" required placeholder="0" value={form.stock} onChange={e => setForm({...form, stock:e.target.value})} /></div>
                <div className="form-group" style={{justifyContent:'flex-end',paddingTop:'1.6rem'}}>
                  <label className="checkbox-label">
                    <input type="checkbox" checked={form.featured} onChange={e => setForm({...form, featured:e.target.checked})} />
                    <StarIcon style={{width:15,height:15}} /> Mark as Featured
                  </label>
                </div>
              </div>
              <div className="form-group"><label>Description</label>
                <textarea rows={4} placeholder="Describe the product..." value={form.description} onChange={e => setForm({...form, description:e.target.value})} /></div>

              {/* MAIN IMAGE */}
              <div className="form-group">
                <label>Main Image {editId && <span style={{color:'var(--fg2)',fontWeight:400,fontSize:'.75rem'}}>(leave blank to keep current)</span>}</label>
                {preview && (
                  <div className="img-preview-wrap">
                    <img src={preview} className="img-preview-lg" alt="preview" />
                  </div>
                )}
                <input type="file" accept="image/jpeg,image/png,image/webp" ref={fileRef}
                  onChange={e => { const f=e.target.files[0]; if(f) setPreview(URL.createObjectURL(f)); }} />
              </div>

              {/* EXTRA IMAGES */}
              <div className="form-group">
                <label>
                  Extra Images
                  <span style={{color:'var(--fg2)',fontWeight:400,fontSize:'.75rem',marginLeft:'.5rem'}}>
                    ({totalExtras}/4 added)
                  </span>
                </label>
                <div className="extra-imgs-grid">
                  {existingExtras.map(fn => (
                    <div key={fn} className="extra-img-item">
                      <img src={IMG + fn} alt="" />
                      <button type="button" className="extra-img-del" onClick={() => removeExistingExtra(fn)}>✕</button>
                    </div>
                  ))}
                  {extraPreviews.map((ep, i) => (
                    <div key={i} className="extra-img-item new">
                      <img src={ep.url} alt="" />
                      <button type="button" className="extra-img-del" onClick={() => removeExtraPreview(i)}>✕</button>
                    </div>
                  ))}
                  {totalExtras < 4 && (
                    <label className="extra-img-add">
                      <span>+</span>
                      <input type="file" accept="image/jpeg,image/png,image/webp" multiple ref={extrasRef} onChange={handleExtrasChange} style={{display:'none'}} />
                    </label>
                  )}
                </div>
              </div>

              <div className="form-actions">
                <button type="submit" className="btn-primary" disabled={loading}>{loading ? 'Saving...' : editId ? 'Save Changes' : 'Add Product'}</button>
                {editId && <button type="button" className="btn-outline" onClick={() => { resetForm(); setTab('products'); }}>Cancel</button>}
              </div>
            </form>
          </div>
        )}

        {/* PRODUCTS TAB */}
        {tab === 'products' && (
          <div className="dash-panel">
            <div className="dash-panel-head">
              All Products <span className="dash-count">{products.length}</span>
              <button className="btn-add-inline" onClick={() => { resetForm(); setTab('add'); }}>+ Add New</button>
            </div>
            <div className="table-wrap">
              <table className="admin-table">
                <thead><tr><th>Image</th><th>Name</th><th>Category</th><th>Price</th><th>Stock</th><th>Featured</th><th>Actions</th></tr></thead>
                <tbody>
                  {products.length === 0 && <tr><td colSpan={7} style={{textAlign:'center',padding:'2rem',color:'var(--fg2)'}}>No products yet.</td></tr>}
                  {products.map(p => (
                    <tr key={p.id}>
                      <td><img className="table-thumb" src={p.image ? IMG+p.image : 'https://placehold.co/42x42/161616/555?text=?'} alt="" /></td>
                      <td><span style={{fontWeight:600}}>{p.name}</span></td>
                      <td><span className="cat-tag">{p.category.replace('_',' ')}</span></td>
                      <td style={{fontWeight:700}}>{format(p.price)}</td>
                      <td><span className={`stock-pill ${p.stock === 0 ? 'out' : p.stock < 5 ? 'low' : 'ok'}`}>{p.stock}</span></td>
                      <td>{p.featured ? <span className="feat-badge"><StarIcon style={{width:13,height:13,display:'inline'}} /> Yes</span> : <span style={{color:'var(--fg3)'}}>—</span>}</td>
                      <td><div className="actions">
                        <button className="btn-sm" onClick={() => navigate(`/product/${p.id}`)}>View</button>
                        <button className="btn-sm edit" onClick={() => handleEdit(p)}>Edit</button>
                        <button className="btn-sm del" onClick={() => handleDelete(p.id)}>Delete</button>
                      </div></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}
