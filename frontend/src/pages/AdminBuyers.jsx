import { useEffect, useState } from 'react';
import Sidebar from '../components/Sidebar';
import api from '../api';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';

export default function AdminBuyers() {
  const [buyers,  setBuyers]  = useState([]);
  const [loading, setLoading] = useState(true);
  const [search,  setSearch]  = useState('');

  useEffect(() => { api.get('/admin/buyers').then(r => setBuyers(r.data)).finally(() => setLoading(false)); }, []);

  const filtered = buyers.filter(b =>
    b.name.toLowerCase().includes(search.toLowerCase()) ||
    b.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="admin-layout">
      <Sidebar />
      <main className="admin-main">
        <div className="dash-header">
          <div>
            <h1 className="dash-title">Buyers</h1>
            <p className="dash-sub">All registered customer accounts</p>
          </div>
          <div className="buyer-count-badge">{buyers.length} total</div>
        </div>

        <div className="buyer-search-wrap">
          <span className="buyer-search-icon"><MagnifyingGlassIcon style={{width:16,height:16}} /></span>
          <input className="buyer-search" placeholder="Search by name or email..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>

        {loading ? <div className="spinner" /> : (
          <div className="dash-panel">
            <div className="table-wrap">
              <table className="admin-table">
                <thead>
                  <tr><th>#</th><th>Name</th><th>Email</th><th>Address</th><th>Joined</th></tr>
                </thead>
                <tbody>
                  {filtered.length === 0 && <tr><td colSpan={5} style={{textAlign:'center',padding:'2rem',color:'var(--fg2)'}}>No buyers found.</td></tr>}
                  {filtered.map((b, i) => (
                    <tr key={b.id}>
                      <td style={{color:'var(--fg2)',fontSize:'.8rem'}}>{i + 1}</td>
                      <td>
                        <div className="buyer-row">
                          <div className="buyer-avatar">{b.name.charAt(0).toUpperCase()}</div>
                          <span style={{fontWeight:600}}>{b.name}</span>
                        </div>
                      </td>
                      <td style={{color:'var(--fg2)',fontSize:'.85rem'}}>{b.email}</td>
                      <td style={{color:'var(--fg2)',fontSize:'.82rem',maxWidth:200}}>{b.address || <span style={{color:'var(--fg3)'}}>—</span>}</td>
                      <td style={{color:'var(--fg2)',fontSize:'.8rem'}}>{new Date(b.created_at).toLocaleDateString('en-US',{year:'numeric',month:'short',day:'numeric'})}</td>
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
