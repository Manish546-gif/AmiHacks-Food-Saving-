import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { BottomNav } from '../../components/Navigation';
import { DONATIONS, RECIPIENTS, DRIVERS, DONORS, matchDonation } from '../../data/seed';
import { TierBadge, VerifiedBadge, ScoreBars } from '../../components/Navigation';
import { CountdownBadge } from '../../components/CountdownRing';

const QUICK_STATS = [
  { label: 'Active Donations', value: '4', icon: 'inventory_2', color: 'var(--primary-dark)', delta: '+2 today' },
  { label: 'Avg Match Time', value: '3.2 min', icon: 'timer', color: 'var(--tertiary)', delta: '↓ 0.4 min' },
  { label: 'Shelters Online', value: '8/8', icon: 'volunteer_activism', color: '#2F80ED', delta: 'All active' },
  { label: 'Riders Online', value: '3/4', icon: 'two_wheeler', color: 'var(--secondary)', delta: '1 offline' },
];

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { donations, showToast } = useApp();
  const [selectedDonation, setSelectedDonation] = useState(null);
  const [matchResult, setMatchResult] = useState(null);
  const [override, setOverride] = useState(null);

  const handleRunMatch = (donation) => {
    const result = matchDonation(donation, Date.now());
    setSelectedDonation(donation);
    setMatchResult(result);
  };

  const handleOverride = (recipientId) => {
    setOverride(recipientId);
    showToast(`Override: assigned to recipient #${recipientId}`, 'admin_panel_settings');
    setSelectedDonation(null);
    setMatchResult(null);
  };

  const activeDonations = donations.filter(d => !['delivered', 'expired'].includes(d.status));

  return (
    <div style={{ minHeight: '100dvh', background: 'var(--background)', display: 'flex', flexDirection: 'column' }}>
      {/* Control room header */}
      <header style={{
        position: 'sticky', top: 0, zIndex: 50,
        background: 'linear-gradient(135deg, var(--inverse-surface) 0%, #1e2235 100%)',
        padding: '14px 16px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span className="material-symbols-outlined" style={{ fontSize: 20, color: 'var(--primary-fixed-dim)', fontVariationSettings: "'FILL' 1" }}>admin_panel_settings</span>
            <h1 className="text-headline-sm" style={{ margin: 0, color: 'white' }}>Control Room</h1>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--tertiary)', animation: 'pulse 2s ease-in-out infinite', display: 'block' }} />
            <span className="text-label-sm" style={{ color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Live — Kota Pilot</span>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button style={{ padding: '6px 12px', borderRadius: 10, background: 'rgba(255,255,255,0.1)', border: 'none', cursor: 'pointer', fontSize: 11, color: 'white', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
            <span className="material-symbols-outlined" style={{ fontSize: 14 }}>notifications</span>
            Alerts (2)
          </button>
        </div>
      </header>

      <main style={{ flex: 1, paddingBottom: 96, overflowY: 'auto' }}>
        {/* Quick stats */}
        <div style={{ padding: '12px 16px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          {QUICK_STATS.map((s, i) => (
            <div key={s.label} className={`card animate-fade-in-up delay-${i}`} style={{ padding: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <span className="material-symbols-outlined" style={{ fontSize: 16, color: s.color, fontVariationSettings: "'FILL' 1" }}>{s.icon}</span>
                <span className="text-label-sm" style={{ color: 'var(--on-surface-variant)', textTransform: 'uppercase', letterSpacing: '0.04em', fontSize: 9 }}>{s.label}</span>
              </div>
              <div className="text-headline-sm" style={{ fontWeight: 700, color: 'var(--on-surface)', lineHeight: 1 }}>{s.value}</div>
              <div className="text-label-sm" style={{ color: s.color, marginTop: 2 }}>{s.delta}</div>
            </div>
          ))}
        </div>

        {/* Live queue */}
        <div style={{ padding: '8px 16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <h2 className="text-headline-sm">Live Donation Queue</h2>
            <span className="text-label-sm" style={{ color: 'var(--on-surface-variant)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{activeDonations.length} active</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {activeDonations.map((donation, i) => {
              const donor = DONORS.find(d => d.id === donation.donor_id);
              const recipient = RECIPIENTS.find(r => r.id === donation.matched_recipient_id);
              const driver = DRIVERS.find(d => d.id === donation.driver_id);
              const STATUS_COLORS = {
                posted: { bg: 'var(--surface-container)', text: 'var(--on-surface-variant)' },
                offered: { bg: 'rgba(0,110,22,0.08)', text: 'var(--tertiary)' },
                matched: { bg: 'rgba(252,128,25,0.1)', text: 'var(--primary-dark)' },
                escalated: { bg: 'rgba(226,55,68,0.1)', text: 'var(--urgent)' },
              };
              const sc = STATUS_COLORS[donation.status] ?? STATUS_COLORS.posted;

              return (
                <div key={donation.id} className={`card animate-fade-in-up delay-${i}`} style={{ padding: 14 }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 8 }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                        <span style={{ padding: '2px 7px', borderRadius: 999, background: sc.bg, color: sc.text, fontSize: 9, fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                          {donation.status}
                        </span>
                        {donation.dietary_tags.includes('non_veg') ? (
                          <span style={{ padding: '1px 6px', borderRadius: 4, background: 'rgba(183,18,42,0.08)', color: 'var(--secondary)', fontSize: 9, fontWeight: 700 }}>Non-Veg</span>
                        ) : (
                          <span style={{ padding: '1px 6px', borderRadius: 4, background: 'rgba(0,110,22,0.08)', color: 'var(--tertiary)', fontSize: 9, fontWeight: 700 }}>Veg</span>
                        )}
                      </div>
                      <h4 className="text-label-lg" style={{ fontWeight: 700, margin: 0 }}>{donation.description}</h4>
                      <p className="text-body-sm" style={{ color: 'var(--on-surface-variant)', margin: '1px 0 0' }}>
                        {donation.qty_kg} kg • {donor?.name ?? 'Donor'}
                      </p>
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <CountdownBadge expiresAt={donation.expires_at} />
                    </div>
                  </div>

                  {/* Route */}
                  {recipient && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 10px', borderRadius: 10, background: 'var(--surface-container-low)', marginBottom: 8 }}>
                      <span className="material-symbols-outlined" style={{ fontSize: 13, color: 'var(--primary-dark)', fontVariationSettings: "'FILL' 1" }}>storefront</span>
                      <span className="text-body-sm" style={{ flex: 1, color: 'var(--on-surface)' }}>{donor?.name}</span>
                      <span className="material-symbols-outlined" style={{ fontSize: 14, color: 'var(--outline)' }}>arrow_forward</span>
                      <span className="material-symbols-outlined" style={{ fontSize: 13, color: 'var(--tertiary)', fontVariationSettings: "'FILL' 1" }}>volunteer_activism</span>
                      <span className="text-body-sm" style={{ flex: 1, color: 'var(--on-surface)' }}>{recipient.name}</span>
                    </div>
                  )}

                  {/* Actions */}
                  <div style={{ display: 'flex', gap: 6 }}>
                    {donation.status === 'posted' && (
                      <button
                        onClick={() => handleRunMatch(donation)}
                        style={{ flex: 1, height: 36, borderRadius: 10, background: 'var(--primary-dark)', color: 'white', border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}
                      >
                        <span className="material-symbols-outlined" style={{ fontSize: 14 }}>radar</span>
                        Run Match
                      </button>
                    )}
                    {donation.status === 'escalated' && (
                      <button
                        onClick={() => handleRunMatch(donation)}
                        style={{ flex: 1, height: 36, borderRadius: 10, background: 'var(--urgent)', color: 'white', border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}
                      >
                        <span className="material-symbols-outlined" style={{ fontSize: 14 }}>warning</span>
                        Escalated — Override
                      </button>
                    )}
                    <button
                      onClick={() => showToast('Donor contacted via WhatsApp', 'chat')}
                      style={{ height: 36, padding: '0 12px', borderRadius: 10, background: 'var(--surface-container)', border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: 14, color: '#25D366' }}>chat</span>
                      WhatsApp
                    </button>
                    <button
                      onClick={() => navigate(`/donor/track/${donation.id}`)}
                      style={{ height: 36, padding: '0 12px', borderRadius: 10, background: 'var(--surface-container)', border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: 14, color: 'var(--primary-dark)' }}>gps_fixed</span>
                      Track
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Recipient availability grid */}
        <div style={{ padding: '16px 16px 0' }}>
          <h2 className="text-headline-sm" style={{ marginBottom: 10 }}>Shelter Availability</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {RECIPIENTS.slice(0, 5).map(r => {
              const freeKg = r.capacity_kg - r.capacity_used_kg;
              const pct = (r.capacity_used_kg / r.capacity_kg) * 100;
              return (
                <div key={r.id} style={{ padding: '10px 14px', borderRadius: 14, background: 'var(--surface-container-lowest)', boxShadow: 'var(--shadow-card)', display: 'flex', alignItems: 'center', gap: 10 }}>
                  <TierBadge tier={r.tier} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <span className="text-label-md" style={{ fontWeight: 700, display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.name}</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
                      <div style={{ flex: 1, height: 5, borderRadius: 999, background: 'var(--surface-container)', overflow: 'hidden' }}>
                        <div style={{ height: '100%', borderRadius: 999, width: `${pct}%`, background: pct > 80 ? 'var(--urgent)' : 'var(--primary-container)', transition: 'width 600ms' }} />
                      </div>
                      <span className="text-label-sm" style={{ color: 'var(--on-surface-variant)', flexShrink: 0 }}>{freeKg} kg free</span>
                    </div>
                  </div>
                  <span style={{ width: 10, height: 10, borderRadius: '50%', background: r.accepting ? 'var(--tertiary)' : 'var(--outline)', flexShrink: 0 }} title={r.accepting ? 'Accepting' : 'Not accepting'} />
                </div>
              );
            })}
          </div>
        </div>
      </main>

      {/* Match override modal */}
      {selectedDonation && matchResult && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(22,27,45,0.5)', display: 'flex', alignItems: 'flex-end' }} onClick={() => { setSelectedDonation(null); setMatchResult(null); }}>
          <div style={{ width: '100%', background: 'var(--surface-container-lowest)', borderRadius: '28px 28px 0 0', padding: '20px 20px 36px', maxHeight: '80vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
            <div style={{ width: 40, height: 5, borderRadius: 999, background: 'var(--surface-container)', margin: '0 auto 16px' }} />
            <h3 className="text-headline-sm" style={{ marginBottom: 4 }}>
              Match Results — {selectedDonation.description}
            </h3>
            <p className="text-body-sm" style={{ color: 'var(--on-surface-variant)', marginBottom: 16 }}>
              {matchResult.status === 'ok' ? `${matchResult.candidates.length} eligible shelters found` : 'No matches — override required'}
            </p>

            {matchResult.status === 'ok' ? (
              matchResult.candidates.slice(0, 5).map((c, i) => (
                <div key={c.recipient.id} style={{ padding: '10px 14px', borderRadius: 14, background: i === 0 ? 'rgba(252,128,25,0.06)' : 'var(--surface-container-low)', marginBottom: 8, border: i === 0 ? '1.5px solid var(--primary-container)' : '1px solid var(--outline-variant)', display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ width: 24, height: 24, borderRadius: '50%', background: i === 0 ? 'var(--primary-container)' : 'var(--surface-container)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: i === 0 ? 'white' : 'var(--on-surface-variant)', flexShrink: 0 }}>
                    {i + 1}
                  </span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <span className="text-label-md" style={{ fontWeight: 700, display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.recipient.name}</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <TierBadge tier={c.recipient.tier} />
                      <span className="text-body-sm" style={{ color: 'var(--on-surface-variant)' }}>{c.distanceKm?.toFixed(1)} km</span>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <span className="text-headline-sm" style={{ color: 'var(--primary-dark)', fontWeight: 700, display: 'block' }}>{Math.round(c.score * 100)}%</span>
                    <button
                      onClick={() => handleOverride(c.recipient.id)}
                      style={{ marginTop: 4, padding: '4px 10px', borderRadius: 8, background: i === 0 ? 'var(--primary-dark)' : 'var(--surface-container)', color: i === 0 ? 'white' : 'var(--on-surface)', border: 'none', cursor: 'pointer', fontSize: 10, fontWeight: 700 }}
                    >
                      {i === 0 ? 'Auto-select' : 'Override'}
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div style={{ textAlign: 'center', padding: '20px 0' }}>
                <span className="material-symbols-outlined" style={{ fontSize: 40, color: 'var(--urgent)', fontVariationSettings: "'FILL' 1" }}>warning</span>
                <p className="text-body-sm" style={{ color: 'var(--on-surface-variant)', marginTop: 8 }}>No shelters passed all hard filters. Expand radius or route to Tier 4 compost.</p>
                <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
                  <button className="btn-primary" onClick={() => showToast('Compost partner notified', 'compost')} style={{ flex: 1 }}>
                    <span className="material-symbols-outlined" style={{ fontSize: 18 }}>compost</span>
                    Compost (Tier 4)
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <BottomNav />
    </div>
  );
}
