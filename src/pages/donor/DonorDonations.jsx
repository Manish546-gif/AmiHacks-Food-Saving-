import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { TopBar, BottomNav } from '../../components/Navigation';
import { DonationCard } from '../../components/DonationCard';

export default function DonorDonations() {
  const navigate = useNavigate();
  const { donations, user } = useApp();
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');

  const myDonations = donations.filter(d => d.donor_id === 1);

  const filtered = myDonations.filter(d => {
    const matchesFilter =
      filter === 'all' ? true :
      filter === 'active' ? ['posted', 'offered', 'matched', 'picked_up'].includes(d.status) :
      filter === 'delivered' ? d.status === 'delivered' :
      filter === 'expired' ? d.status === 'expired' : true;

    const matchesSearch = !search ||
      d.description.toLowerCase().includes(search.toLowerCase()) ||
      d.category.toLowerCase().includes(search.toLowerCase());

    return matchesFilter && matchesSearch;
  });

  const stats = {
    total: myDonations.length,
    active: myDonations.filter(d => ['posted', 'offered', 'matched', 'picked_up'].includes(d.status)).length,
    delivered: myDonations.filter(d => d.status === 'delivered').length,
    totalKg: myDonations.reduce((sum, d) => sum + (d.qty_kg || 0), 0),
  };

  return (
    <div style={{ minHeight: '100dvh', background: 'var(--surface)', display: 'flex', flexDirection: 'column' }}>
      <TopBar title="My Donations" subtitle="Surplus-to-Shelter" />

      <main style={{ flex: 1, paddingTop: 68, paddingBottom: 100, overflowY: 'auto' }}>
        {/* Summary Metric Chips */}
        <div style={{ padding: '12px 16px', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
          {[
            { label: 'All', val: stats.total, color: 'var(--on-surface)' },
            { label: 'Active', val: stats.active, color: 'var(--primary)' },
            { label: 'Rescued', val: stats.delivered, color: 'var(--tertiary)' },
            { label: 'Total kg', val: `${stats.totalKg}`, color: 'var(--secondary)' },
          ].map(s => (
            <div key={s.label} style={{
              background: 'var(--surface-container-lowest)',
              padding: '10px 8px', borderRadius: 14,
              textAlign: 'center', boxShadow: 'var(--shadow-card)',
            }}>
              <div style={{ fontSize: 18, fontWeight: 800, color: s.color, lineHeight: 1.1 }}>{s.val}</div>
              <div className="text-label-sm" style={{ color: 'var(--on-surface-variant)', marginTop: 2 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Search Bar & Action */}
        <div style={{ padding: '0 16px 12px', display: 'flex', gap: 8 }}>
          <div style={{
            flex: 1, display: 'flex', alignItems: 'center', height: 44,
            padding: '0 12px', borderRadius: 14, background: 'var(--surface-container-lowest)',
            boxShadow: 'var(--shadow-card)', gap: 8
          }}>
            <span className="material-symbols-outlined" style={{ fontSize: 20, color: 'var(--on-surface-variant)' }}>search</span>
            <input
              type="text"
              placeholder="Search past donations..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ flex: 1, border: 'none', background: 'transparent', outline: 'none', fontSize: 13, color: 'var(--on-surface)' }}
            />
          </div>
          <button
            onClick={() => navigate('/donor/post')}
            style={{
              height: 44, padding: '0 14px', borderRadius: 14, border: 'none',
              background: 'var(--primary)', color: 'white', fontWeight: 700, fontSize: 13,
              display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(252,128,25,0.3)',
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>add</span>
            <span>Post New</span>
          </button>
        </div>

        {/* Status Filter Tabs */}
        <div style={{ display: 'flex', gap: 8, padding: '0 16px 14px', overflowX: 'auto', scrollbarWidth: 'none' }}>
          {[
            { id: 'all', label: 'All Items' },
            { id: 'active', label: 'In Progress ⚡' },
            { id: 'delivered', label: 'Delivered ✓' },
            { id: 'expired', label: 'Past Safe Window' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setFilter(tab.id)}
              style={{
                padding: '6px 14px', borderRadius: 999, border: 'none', cursor: 'pointer',
                whiteSpace: 'nowrap', fontSize: 12, fontWeight: 700,
                background: filter === tab.id ? 'var(--primary)' : 'var(--surface-container)',
                color: filter === tab.id ? 'white' : 'var(--on-surface-variant)',
                transition: 'all 200ms',
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Donations List */}
        <div style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
          {filtered.length === 0 ? (
            <div style={{
              background: 'var(--surface-container-lowest)', borderRadius: 20, padding: 32,
              textAlign: 'center', boxShadow: 'var(--shadow-card)',
            }}>
              <span className="material-symbols-outlined" style={{ fontSize: 48, color: 'var(--outline-variant)' }}>inventory_2</span>
              <h3 className="text-headline-sm" style={{ margin: '12px 0 4px' }}>No donations found</h3>
              <p className="text-body-sm" style={{ color: 'var(--on-surface-variant)', margin: '0 0 16px' }}>
                {filter === 'active' ? 'You have no donations currently in rescue flight.' : 'Try adjusting your search or post new surplus food.'}
              </p>
              <button className="btn-primary" onClick={() => navigate('/donor/post')} style={{ margin: '0 auto' }}>
                + Post Surplus Food Now
              </button>
            </div>
          ) : (
            filtered.map(donation => (
              <DonationCard key={donation.id} donation={donation} />
            ))
          )}
        </div>
      </main>

      <BottomNav />
    </div>
  );
}
