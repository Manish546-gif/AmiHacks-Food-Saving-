import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { TopBar, BottomNav } from '../../components/Navigation';
import { DonationCard } from '../../components/DonationCard';

const FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'active', label: 'Active' },
  { id: 'matched', label: 'Matched' },
  { id: 'delivered', label: 'Delivered' },
  { id: 'expired', label: 'Expired' },
];

export default function DonorHome() {
  const navigate = useNavigate();
  const { donations, recipients, drivers, user, impactStats } = useApp();
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');

  const myDonations = donations.filter(d => d.donor_id === (user?.id ?? 1));

  const filteredDonations = myDonations.filter(d => {
    const statusMatch = filter === 'all' ? true
      : filter === 'active' ? ['posted', 'offered'].includes(d.status)
      : d.status === filter;
    const searchMatch = !search || d.description.toLowerCase().includes(search.toLowerCase());
    return statusMatch && searchMatch;
  });

  const lastDonation = myDonations[0];

  return (
    <div style={{ minHeight: '100dvh', background: 'var(--surface)', display: 'flex', flexDirection: 'column' }}>
      <TopBar title="Surplus Feed" subtitle="Surplus-to-Shelter" />

      <main style={{ flex: 1, paddingTop: 64, paddingBottom: 96, overflowY: 'auto' }}>
        {/* Location bar */}
        <div style={{ padding: '12px 16px 8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
            <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--primary-fixed)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span className="material-symbols-outlined" style={{ fontSize: 18, color: 'var(--on-primary-fixed)', fontVariationSettings: "'FILL' 1" }}>storefront</span>
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <span className="text-headline-sm">{user?.name ?? 'Royal Spice Kitchen'}</span>
                <span className="material-symbols-outlined" style={{ fontSize: 16, color: 'var(--on-surface-variant)' }}>expand_more</span>
              </div>
              <span className="text-body-sm" style={{ color: 'var(--on-surface-variant)' }}>Talwandi, Kota • Floor 1</span>
            </div>
          </div>
          <button style={{ width: 44, height: 44, borderRadius: '50%', background: 'var(--surface-container-low)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}
            onClick={() => navigate('/notifications')} aria-label="Notifications">
            <span className="material-symbols-outlined" style={{ fontSize: 22 }}>notifications</span>
          </button>
        </div>

        {/* Search */}
        <div style={{ padding: '0 16px 16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', height: 48, padding: '0 14px', borderRadius: 20, background: 'var(--surface-container-lowest)', boxShadow: '0 4px 20px rgba(40,44,63,0.06)', gap: 10 }}>
            <span className="material-symbols-outlined" style={{ fontSize: 20, color: 'var(--primary-dark)' }}>search</span>
            <input
              type="text"
              placeholder="Search donations, food types, shelters..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ flex: 1, border: 'none', background: 'transparent', outline: 'none', fontSize: 14, fontFamily: 'var(--font-family)', color: 'var(--on-surface)' }}
            />
            <button aria-label="Filter" style={{ width: 32, height: 32, borderRadius: 10, border: 'none', background: 'var(--surface-container-low)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span className="material-symbols-outlined" style={{ fontSize: 16 }}>tune</span>
            </button>
          </div>
        </div>

        {/* Hero milestone card */}
        <div style={{ padding: '0 16px 20px' }}>
          <div style={{
            position: 'relative', overflow: 'hidden', borderRadius: 20, padding: 16,
            background: 'linear-gradient(135deg, var(--primary-container) 0%, #ff9a3d 100%)',
            boxShadow: '0 8px 24px rgba(252,128,25,0.28)',
          }}>
            <div style={{ position: 'absolute', right: -32, bottom: -32, width: 144, height: 144, borderRadius: '50%', background: 'rgba(255,255,255,0.1)', filter: 'blur(32px)', pointerEvents: 'none' }} />

            <div style={{ position: 'relative', zIndex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 10px', borderRadius: 999, background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(8px)' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 13, color: 'white', fontVariationSettings: "'FILL' 1" }}>workspace_premium</span>
                  <span className="text-label-sm" style={{ color: 'white', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Monthly Milestone</span>
                </div>
                <span className="text-label-sm" style={{ background: 'rgba(0,0,0,0.15)', color: 'white', padding: '2px 8px', borderRadius: 999 }}>Level 3 Donor</span>
              </div>

              <h2 className="text-headline-md" style={{ color: 'white', margin: '0 0 4px' }}>
                You've rescued 320 meals this month
              </h2>
              <p className="text-body-sm" style={{ color: 'rgba(255,255,255,0.9)', margin: '0 0 12px' }}>
                40 meals away from the <strong style={{ color: 'white' }}>Gold Zero-Waste Badge</strong> (360 target)
              </p>

              {/* Progress bar */}
              <div style={{ marginBottom: 8 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span className="text-label-sm" style={{ color: 'rgba(255,255,255,0.8)' }}>Progress: 88%</span>
                  <span className="text-label-sm" style={{ color: 'white', fontWeight: 700 }}>320 / 360 meals</span>
                </div>
                <div style={{ height: 10, borderRadius: 999, background: 'rgba(0,0,0,0.2)', overflow: 'hidden', padding: 2 }}>
                  <div style={{ height: '100%', borderRadius: 999, width: '88%', background: 'white', boxShadow: '0 0 8px rgba(255,255,255,0.6)', transition: 'width 700ms cubic-bezier(0.16,1,0.3,1)' }} />
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 10px', borderRadius: 8, background: 'rgba(0,0,0,0.2)', fontSize: 11, color: 'white', fontWeight: 600 }}>
                  🌱 768 kg CO₂ prevented
                </div>
                <button onClick={() => navigate('/impact')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.9)', fontSize: 11, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 2 }}>
                  Impact summary <span className="material-symbols-outlined" style={{ fontSize: 14 }}>chevron_right</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Quick actions */}
        <div style={{ padding: '0 16px 20px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
            <a
              onClick={() => navigate('/donor/post')}
              style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center',
                padding: 12, borderRadius: 20,
                background: 'linear-gradient(135deg, var(--primary-container), #ff9a3d)',
                boxShadow: 'var(--shadow-primary)', cursor: 'pointer', textDecoration: 'none',
                transition: 'transform 160ms', userSelect: 'none',
              }}
              onMouseDown={e => e.currentTarget.style.transform = 'scale(0.96)'}
              onMouseUp={e => e.currentTarget.style.transform = ''}
              onTouchStart={e => e.currentTarget.style.transform = 'scale(0.96)'}
              onTouchEnd={e => e.currentTarget.style.transform = ''}
            >
              <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 6 }}>
                <span className="material-symbols-outlined" style={{ fontSize: 22, color: 'white' }}>add</span>
              </div>
              <span className="text-label-lg" style={{ color: 'white', fontWeight: 700, lineHeight: 1.2 }}>Post Surplus</span>
              <span className="text-label-sm" style={{ color: 'rgba(255,255,255,0.8)', marginTop: 2 }}>Takes 30s</span>
            </a>

            <button
              onClick={() => navigate('/donor/post', { state: { repeat: lastDonation } })}
              style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', padding: 12, borderRadius: 20, background: 'var(--surface-container-lowest)', boxShadow: 'var(--shadow-card)', border: 'none', cursor: 'pointer', transition: 'transform 160ms' }}
              onMouseDown={e => e.currentTarget.style.transform = 'scale(0.96)'}
              onMouseUp={e => e.currentTarget.style.transform = ''}
            >
              <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--surface-container)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 6, color: 'var(--primary-dark)' }}>
                <span className="material-symbols-outlined" style={{ fontSize: 20 }}>replay</span>
              </div>
              <span className="text-label-lg" style={{ fontWeight: 700, lineHeight: 1.2 }}>Repeat Last</span>
              <span className="text-label-sm" style={{ color: 'var(--on-surface-variant)', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '100%' }}>
                {lastDonation?.description?.slice(0, 12) ?? 'Previous'}
              </span>
            </button>

            <button
              style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', padding: 12, borderRadius: 20, background: 'var(--surface-container-lowest)', boxShadow: 'var(--shadow-card)', border: 'none', cursor: 'pointer', transition: 'transform 160ms' }}
              onMouseDown={e => e.currentTarget.style.transform = 'scale(0.96)'}
              onMouseUp={e => e.currentTarget.style.transform = ''}
            >
              <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--tertiary-fixed)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 6 }}>
                <span className="material-symbols-outlined" style={{ fontSize: 20, color: 'var(--on-tertiary-fixed)' }}>center_focus_strong</span>
              </div>
              <span className="text-label-lg" style={{ fontWeight: 700, lineHeight: 1.2 }}>Scan Food</span>
              <span className="text-label-sm" style={{ color: 'var(--on-surface-variant)', marginTop: 2 }}>AI detect</span>
            </button>
          </div>
        </div>

        {/* Filter chips */}
        <div style={{ overflowX: 'auto', padding: '0 16px 16px', display: 'flex', gap: 8 }}>
          {FILTERS.map(f => {
            const count = f.id === 'all' ? myDonations.length
              : f.id === 'active' ? myDonations.filter(d => ['posted','offered'].includes(d.status)).length
              : myDonations.filter(d => d.status === f.id).length;
            return (
              <button
                key={f.id}
                onClick={() => setFilter(f.id)}
                className={`chip ${filter === f.id ? 'chip-active' : 'chip-inactive'}`}
                style={{ flexShrink: 0 }}
              >
                {f.id === 'all' && filter === f.id && <span className="material-symbols-outlined" style={{ fontSize: 12 }}>check</span>}
                {f.label} ({count})
              </button>
            );
          })}
        </div>

        {/* Donation feed */}
        <div style={{ padding: '0 16px 8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ width: 10, height: 10, borderRadius: '50%', background: 'var(--primary-container)', animation: 'pulse 2s ease-in-out infinite', display: 'block' }} />
            <h3 className="text-headline-sm">Active Surplus Batches</h3>
          </div>
          <span className="text-label-sm" style={{ color: 'var(--on-surface-variant)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Auto-refreshing</span>
        </div>

        <div style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: 14 }}>
          {filteredDonations.length === 0 ? (
            <EmptyState onPost={() => navigate('/donor/post')} />
          ) : (
            filteredDonations.map((d, i) => (
              <div key={d.id} className={`animate-fade-in-up delay-${Math.min(i, 4)}`}>
                <DonationCard donation={d} recipients={recipients} drivers={drivers} />
              </div>
            ))
          )}
        </div>

        {/* Warm feedback banner */}
        <div style={{ padding: '20px 16px' }}>
          <div style={{ padding: 16, borderRadius: 20, background: 'var(--surface-container-low)', display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'rgba(252,128,25,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <span className="material-symbols-outlined" style={{ fontSize: 22, color: 'var(--primary-dark)', fontVariationSettings: "'FILL' 1" }}>favorite</span>
            </div>
            <div>
              <span className="text-label-lg" style={{ display: 'block', fontWeight: 600 }}>"Every meal feeds hope"</span>
              <span className="text-body-sm" style={{ color: 'var(--on-surface-variant)' }}>Yesterday your surplus fed 64 kids at Shishu Grih.</span>
            </div>
          </div>
        </div>
      </main>

      {/* FAB */}
      <button className="fab" onClick={() => navigate('/donor/post')} aria-label="Post surplus food">
        <span className="material-symbols-outlined" style={{ fontSize: 28 }}>add</span>
      </button>

      <BottomNav />
    </div>
  );
}

function EmptyState({ onPost }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '40px 24px', textAlign: 'center', gap: 16 }}>
      <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'var(--surface-container)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span className="material-symbols-outlined" style={{ fontSize: 40, color: 'var(--on-surface-variant)', fontVariationSettings: "'FILL' 1" }}>restaurant</span>
      </div>
      <div>
        <p className="text-headline-sm" style={{ margin: '0 0 4px' }}>No donations yet</p>
        <p className="text-body-sm" style={{ color: 'var(--on-surface-variant)', margin: 0 }}>Post surplus food to help those in need tonight</p>
      </div>
      <button className="btn-primary" onClick={onPost}>Post First Donation</button>
    </div>
  );
}
