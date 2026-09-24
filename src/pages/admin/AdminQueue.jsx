import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { TopBar, BottomNav, TierBadge } from '../../components/Navigation';

export default function AdminQueue() {
  const navigate = useNavigate();
  const { donations, recipients, drivers, acceptOffer, declineOffer, showToast } = useApp();
  const [filter, setFilter] = useState('all');
  const [selectedDonation, setSelectedDonation] = useState(null);
  const [overrideRecipientId, setOverrideRecipientId] = useState(1);
  const [overrideDriverId, setOverrideDriverId] = useState(1);

  const filtered = donations.filter(d => {
    if (filter === 'all') return true;
    if (filter === 'active') return ['posted', 'offered', 'matched', 'picked_up'].includes(d.status);
    if (filter === 'escalated') return d.status === 'escalated' || d.status === 'posted';
    if (filter === 'delivered') return d.status === 'delivered';
    return d.status === filter;
  });

  const handleManualDispatch = () => {
    if (!selectedDonation) return;
    acceptOffer(selectedDonation.id, Number(overrideRecipientId));
    showToast(`Manual Dispatch: Routed #${selectedDonation.id} to shelter #${overrideRecipientId}`, 'alt_route');
    setSelectedDonation(null);
  };

  return (
    <div style={{ minHeight: '100dvh', background: 'var(--surface)', display: 'flex', flexDirection: 'column' }}>
      <TopBar title="Operations Queue" subtitle="Surplus-to-Shelter" />

      <main style={{ flex: 1, paddingTop: 68, paddingBottom: 100, overflowY: 'auto' }}>
        {/* Urgent Operations Bar */}
        <div style={{ padding: '0 16px 12px' }}>
          <div style={{
            background: 'linear-gradient(135deg, #161b2d, #2b2f43)',
            color: 'white', borderRadius: 18, padding: 16,
            display: 'flex', justifyContent: 'space-between', alignItems: 'center'
          }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span className="material-symbols-outlined" style={{ color: '#ffb689' }}>emergency</span>
                <span className="text-label-md" style={{ fontWeight: 800, color: '#ffb689', textTransform: 'uppercase' }}>
                  Live Dispatch SLA
                </span>
              </div>
              <div className="text-headline-sm" style={{ margin: '4px 0 0', color: 'white' }}>
                {donations.filter(d => ['posted', 'offered'].includes(d.status)).length} Pending Dispatch
              </div>
            </div>

            <button
              onClick={() => showToast('Emergency SMS broadcast sent to 4 active Kota riders!', 'campaign')}
              style={{
                padding: '8px 14px', borderRadius: 12, border: 'none',
                background: 'var(--primary)', color: 'white', fontWeight: 800, fontSize: 12,
                cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
                boxShadow: '0 4px 12px rgba(252,128,25,0.4)'
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 16 }}>campaign</span>
              <span>Broadcast SOS</span>
            </button>
          </div>
        </div>

        {/* Filter Pills */}
        <div style={{ display: 'flex', gap: 8, padding: '0 16px 14px', overflowX: 'auto', scrollbarWidth: 'none' }}>
          {[
            { id: 'all', label: 'All Flights' },
            { id: 'active', label: 'Active Pipeline ⚡' },
            { id: 'escalated', label: 'Needs Override ⚠️' },
            { id: 'delivered', label: 'Delivered Log' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setFilter(tab.id)}
              style={{
                padding: '6px 14px', borderRadius: 999, border: 'none', cursor: 'pointer',
                whiteSpace: 'nowrap', fontSize: 12, fontWeight: 700,
                background: filter === tab.id ? 'var(--primary)' : 'var(--surface-container)',
                color: filter === tab.id ? 'white' : 'var(--on-surface-variant)',
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Donations Pipeline List */}
        <div style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
          {filtered.map(d => {
            const isEscalated = d.status === 'escalated' || d.status === 'posted';
            return (
              <div
                key={d.id}
                style={{
                  background: 'var(--surface-container-lowest)', borderRadius: 18, padding: 16,
                  boxShadow: 'var(--shadow-card)',
                  border: isEscalated ? '2px solid rgba(226,55,68,0.3)' : '1px solid var(--surface-container)',
                  display: 'flex', flexDirection: 'column', gap: 10
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span className="text-label-lg" style={{ fontWeight: 800 }}>#{d.id} • {d.description}</span>
                      <span style={{
                        padding: '2px 8px', borderRadius: 999,
                        background: d.status === 'delivered' ? 'rgba(0,110,22,0.1)' : isEscalated ? 'rgba(226,55,68,0.1)' : 'rgba(252,128,25,0.1)',
                        color: d.status === 'delivered' ? 'var(--tertiary)' : isEscalated ? 'var(--secondary)' : 'var(--primary)',
                        fontSize: 10, fontWeight: 800, textTransform: 'uppercase'
                      }}>
                        {d.status}
                      </span>
                    </div>
                    <div className="text-body-sm" style={{ color: 'var(--on-surface-variant)', marginTop: 2 }}>
                      From <strong>{d.donor_name}</strong> • Feeds {d.est_meals || Math.round((d.qty_kg || 0) * 2)} people
                    </div>
                  </div>

                  <span className="text-label-sm" style={{ color: 'var(--secondary)', fontWeight: 800 }}>
                    Safe: 21:45 PM
                  </span>
                </div>

                {/* Progress bar */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, height: 6, background: 'var(--surface-container)', borderRadius: 999, overflow: 'hidden' }}>
                  <div style={{
                    height: '100%',
                    width: d.status === 'delivered' ? '100%' : d.status === 'picked_up' ? '75%' : d.status === 'matched' ? '50%' : '20%',
                    background: d.status === 'delivered' ? 'var(--tertiary)' : 'var(--primary)',
                    borderRadius: 999, transition: 'width 300ms'
                  }} />
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 4 }}>
                  <span className="text-body-sm" style={{ color: 'var(--on-surface-variant)' }}>
                    Target: {recipients.find(r => r.id === d.matched_recipient_id)?.name || 'Algorithmic Queue'}
                  </span>

                  <div style={{ display: 'flex', gap: 6 }}>
                    <button
                      onClick={() => navigate(`/donor/track/${d.id}`)}
                      style={{ padding: '6px 12px', borderRadius: 10, border: '1px solid var(--outline-variant)', background: 'transparent', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}
                    >
                      Radar View
                    </button>
                    <button
                      onClick={() => setSelectedDonation(d)}
                      style={{ padding: '6px 12px', borderRadius: 10, border: 'none', background: 'var(--primary)', color: 'white', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}
                    >
                      Override
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Manual Override Dispatch Modal */}
        {selectedDonation && (
          <div style={{
            position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(0,0,0,0.5)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20
          }}>
            <div style={{
              background: 'white', borderRadius: 24, padding: 24, maxWidth: 400, width: '100%',
              display: 'flex', flexDirection: 'column', gap: 16, boxShadow: 'var(--shadow-elevated)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 className="text-headline-sm" style={{ margin: 0 }}>Manual Dispatcher Override</h3>
                <button onClick={() => setSelectedDonation(null)} style={{ border: 'none', background: 'none', cursor: 'pointer' }}>
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>

              <div style={{ background: 'var(--surface-container-low)', padding: 12, borderRadius: 12 }}>
                <div className="text-label-md" style={{ fontWeight: 800 }}>Donation #{selectedDonation.id}: {selectedDonation.description}</div>
                <div className="text-body-sm" style={{ color: 'var(--on-surface-variant)' }}>Feeds {selectedDonation.est_meals || Math.round((selectedDonation.qty_kg || 0) * 2)} people • From {selectedDonation.donor_name}</div>
              </div>

              <div>
                <label className="text-label-md" style={{ display: 'block', marginBottom: 4 }}>Assign Target Shelter</label>
                <select
                  value={overrideRecipientId}
                  onChange={e => setOverrideRecipientId(e.target.value)}
                  style={{ width: '100%', height: 44, padding: '0 12px', borderRadius: 12, border: '1px solid var(--outline-variant)', background: 'white', fontSize: 14 }}
                >
                  {recipients.map(r => (
                    <option key={r.id} value={r.id}>
                      {r.name} (Tier {r.tier} • {r.capacity_kg - r.capacity_used_kg} kg free)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-label-md" style={{ display: 'block', marginBottom: 4 }}>Assign Volunteer Rider</label>
                <select
                  value={overrideDriverId}
                  onChange={e => setOverrideDriverId(e.target.value)}
                  style={{ width: '100%', height: 44, padding: '0 12px', borderRadius: 12, border: '1px solid var(--outline-variant)', background: 'white', fontSize: 14 }}
                >
                  {drivers.map(dr => (
                    <option key={dr.id} value={dr.id}>
                      {dr.name} ({dr.available ? '🟢 Online' : '⚪ Offline'} • {dr.vehicle})
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
                <button
                  onClick={() => setSelectedDonation(null)}
                  style={{ flex: 1, height: 46, borderRadius: 12, border: '1px solid var(--outline-variant)', background: 'transparent', fontWeight: 700 }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleManualDispatch}
                  className="btn-primary"
                  style={{ flex: 1.5, height: 46 }}
                >
                  Apply Override
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  );
}
