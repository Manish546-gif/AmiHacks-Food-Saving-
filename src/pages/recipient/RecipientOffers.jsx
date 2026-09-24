import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { TopBar, BottomNav, TierBadge, ScoreBars } from '../../components/Navigation';
import { CountdownRing } from '../../components/CountdownRing';

export default function RecipientOffers() {
  const navigate = useNavigate();
  const { donations, acceptOffer, declineOffer, showToast } = useApp();
  const [tab, setTab] = useState('active'); // active | past
  const [expandedScore, setExpandedScore] = useState(null);

  // Active offers: donations with status === 'offered'
  const activeOffers = donations.filter(d => d.status === 'offered');
  // Past offers: donations matched, picked_up, or delivered to recipient 1
  const pastOffers = donations.filter(d => ['matched', 'picked_up', 'delivered'].includes(d.status) && (d.matched_recipient_id === 1 || !d.matched_recipient_id));

  return (
    <div style={{ minHeight: '100dvh', background: 'var(--surface)', display: 'flex', flexDirection: 'column' }}>
      <TopBar title="Rescue Offers" subtitle="Surplus-to-Shelter" />

      <main style={{ flex: 1, paddingTop: 68, paddingBottom: 100, overflowY: 'auto' }}>
        {/* Tab switch */}
        <div style={{ padding: '8px 16px 14px', display: 'flex', gap: 8 }}>
          <button
            onClick={() => setTab('active')}
            style={{
              flex: 1, padding: '10px 14px', borderRadius: 14, border: 'none', cursor: 'pointer',
              fontWeight: 800, fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              background: tab === 'active' ? 'var(--primary)' : 'var(--surface-container)',
              color: tab === 'active' ? 'white' : 'var(--on-surface-variant)',
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>volunteer_activism</span>
            <span>Live Offers ({activeOffers.length})</span>
          </button>
          <button
            onClick={() => setTab('past')}
            style={{
              flex: 1, padding: '10px 14px', borderRadius: 14, border: 'none', cursor: 'pointer',
              fontWeight: 800, fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              background: tab === 'past' ? 'var(--primary)' : 'var(--surface-container)',
              color: tab === 'past' ? 'white' : 'var(--on-surface-variant)',
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>history</span>
            <span>Accepted ({pastOffers.length})</span>
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: 14 }}>
          {tab === 'active' ? (
            activeOffers.length === 0 ? (
              <div style={{
                background: 'var(--surface-container-lowest)', borderRadius: 20, padding: 36,
                textAlign: 'center', boxShadow: 'var(--shadow-card)',
              }}>
                <div style={{
                  width: 64, height: 64, borderRadius: '50%', background: 'rgba(0,110,22,0.1)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px',
                  color: 'var(--tertiary)',
                }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 32 }}>check_circle</span>
                </div>
                <h3 className="text-headline-sm" style={{ margin: '0 0 6px' }}>All caught up!</h3>
                <p className="text-body-sm" style={{ color: 'var(--on-surface-variant)', margin: '0 0 16px' }}>
                  No pending food offers right now. As soon as a verified restaurant or mess posts surplus, it will ring here in real-time.
                </p>
                <div style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  padding: '6px 14px', borderRadius: 999, background: 'rgba(0,110,22,0.08)',
                  color: 'var(--tertiary)', fontSize: 12, fontWeight: 700
                }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--tertiary)' }} />
                  Listening for Kota surplus dispatch (Channel: Live)
                </div>
              </div>
            ) : (
              activeOffers.map(offer => {
                const isExpanded = expandedScore === offer.id;
                return (
                  <div
                    key={offer.id}
                    style={{
                      background: 'var(--surface-container-lowest)', borderRadius: 20, padding: 18,
                      boxShadow: 'var(--shadow-card)', border: '2px solid rgba(252,128,25,0.3)',
                      display: 'flex', flexDirection: 'column', gap: 12, position: 'relative', overflow: 'hidden'
                    }}
                  >
                    {/* Top urgent banner */}
                    <div style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      background: 'linear-gradient(90deg, rgba(252,128,25,0.12), rgba(255,154,61,0.06))',
                      margin: '-18px -18px 0 -18px', padding: '10px 18px',
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span className="material-symbols-outlined" style={{ fontSize: 18, color: 'var(--primary)' }}>timer</span>
                        <span className="text-label-md" style={{ color: 'var(--primary-dark)', fontWeight: 800 }}>
                          Action Window: 30s response SLA
                        </span>
                      </div>
                      <TierBadge tier={1} />
                    </div>

                    {/* Food Header */}
                    <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                      <div style={{
                        width: 52, height: 52, borderRadius: 14, background: 'var(--primary-fixed)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--on-primary-fixed)',
                        flexShrink: 0
                      }}>
                        <span className="material-symbols-outlined" style={{ fontSize: 28 }}>soup_kitchen</span>
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                          <h3 className="text-headline-sm" style={{ margin: 0 }}>{offer.description}</h3>
                          <span style={{
                            padding: '1px 8px', borderRadius: 999, background: 'rgba(0,110,22,0.1)',
                            color: 'var(--tertiary)', fontSize: 11, fontWeight: 700
                          }}>Pure Veg ✓</span>
                        </div>
                        <p className="text-body-sm" style={{ color: 'var(--on-surface-variant)', margin: '2px 0 0' }}>
                          From <strong>{offer.donor_name}</strong> • Talwandi (2.1 km away)
                        </p>
                      </div>
                    </div>

                    {/* Food Metrics */}
                    <div style={{
                      display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8,
                      background: 'var(--surface-container-low)', borderRadius: 14, padding: 10,
                    }}>
                      <div style={{ textAlign: 'center' }}>
                        <div className="text-label-sm" style={{ color: 'var(--on-surface-variant)' }}>People Fed</div>
                        <div style={{ fontWeight: 800, fontSize: 16, color: 'var(--primary)' }}>
                          <span className="material-symbols-outlined" style={{ fontSize: 14, verticalAlign: 'middle', marginRight: 2, fontVariationSettings: "'FILL' 1" }}>group</span>
                          {offer.est_meals || Math.round((offer.qty_kg || 0) * 2)}
                        </div>
                      </div>
                      <div style={{ textAlign: 'center', borderLeft: '1px solid var(--outline-variant)', borderRight: '1px solid var(--outline-variant)' }}>
                        <div className="text-label-sm" style={{ color: 'var(--on-surface-variant)' }}>Category</div>
                        <div style={{ fontWeight: 800, fontSize: 13, color: 'var(--tertiary)', textTransform: 'capitalize' }}>{offer.category || 'Cooked'}</div>
                      </div>
                      <div style={{ textAlign: 'center' }}>
                        <div className="text-label-sm" style={{ color: 'var(--on-surface-variant)' }}>Safe For</div>
                        <div style={{ fontWeight: 800, fontSize: 14, color: 'var(--secondary)' }}>
                          {offer.safe_hours || 4}h
                        </div>
                      </div>
                    </div>

                    {/* AI Match Explanation */}
                    <div style={{
                      background: 'rgba(252,128,25,0.06)', borderRadius: 12, padding: 10,
                      border: '1px dashed rgba(252,128,25,0.3)',
                    }}>
                      <div
                        onClick={() => setExpandedScore(isExpanded ? null : offer.id)}
                        style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span className="material-symbols-outlined" style={{ fontSize: 16, color: 'var(--primary)' }}>auto_awesome</span>
                          <span className="text-label-md" style={{ fontWeight: 800, color: 'var(--primary-dark)' }}>
                            Match Score: {Math.round((offer.match_score || 0.91) * 100)}% Match
                          </span>
                        </div>
                        <span className="material-symbols-outlined" style={{ fontSize: 16, color: 'var(--on-surface-variant)' }}>
                          {isExpanded ? 'expand_less' : 'expand_more'}
                        </span>
                      </div>

                      {isExpanded ? (
                        <div style={{ marginTop: 10 }}>
                          <ScoreBars breakdown={{ proximity: 0.88, capacityFit: 0.92, priorityTier: 1.0, timeSlack: 0.85, needToday: 0.90, fairness: 0.80 }} />
                        </div>
                      ) : (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 6 }}>
                          {['Tier 1 Children & Elderly', 'Pure Veg match', '2.1 km radius', 'Sufficient intake capacity'].map((c, i) => (
                            <span key={i} style={{ padding: '2px 8px', borderRadius: 999, background: 'white', fontSize: 10, fontWeight: 700, color: 'var(--on-surface-variant)' }}>
                              ✓ {c}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
                      <button
                        onClick={() => declineOffer(offer.id, 1, 'Temporary capacity limitation')}
                        style={{
                          flex: 1, height: 48, borderRadius: 14, border: '1px solid var(--outline-variant)',
                          background: 'transparent', color: 'var(--on-surface-variant)', fontWeight: 700, fontSize: 13,
                          cursor: 'pointer'
                        }}
                      >
                        Decline
                      </button>
                      <button
                        onClick={() => {
                          acceptOffer(offer.id, 1);
                          showToast('Offer accepted! Rider assigned for pickup.', 'celebration');
                        }}
                        style={{
                          flex: 2, height: 48, borderRadius: 14, border: 'none',
                          background: 'linear-gradient(135deg, var(--tertiary), #28a745)',
                          color: 'white', fontWeight: 800, fontSize: 14,
                          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                          cursor: 'pointer', boxShadow: '0 4px 14px rgba(0,110,22,0.3)',
                        }}
                      >
                        <span className="material-symbols-outlined" style={{ fontSize: 20 }}>check_circle</span>
                        <span>Accept Food Rescue</span>
                      </button>
                    </div>
                  </div>
                );
              })
            )
          ) : (
            // Past accepted offers
            pastOffers.map(donation => (
              <div
                key={donation.id}
                style={{
                  background: 'var(--surface-container-lowest)', borderRadius: 16, padding: 14,
                  boxShadow: 'var(--shadow-card)', display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span className="text-label-lg" style={{ fontWeight: 800 }}>{donation.description}</span>
                    <span style={{
                      padding: '2px 6px', borderRadius: 999,
                      background: donation.status === 'delivered' ? 'rgba(0,110,22,0.1)' : 'rgba(252,128,25,0.1)',
                      color: donation.status === 'delivered' ? 'var(--tertiary)' : 'var(--primary)',
                      fontSize: 10, fontWeight: 800, textTransform: 'uppercase'
                    }}>
                      {donation.status}
                    </span>
                  </div>
                  <div className="text-body-sm" style={{ color: 'var(--on-surface-variant)', marginTop: 2 }}>
                    From {donation.donor_name} • Feeds {donation.est_meals || Math.round((donation.qty_kg || 0) * 2)} people
                  </div>
                </div>
                <button
                  onClick={() => navigate(`/donor/track/${donation.id}`)}
                  style={{
                    padding: '6px 12px', borderRadius: 10, border: 'none',
                    background: 'var(--surface-container)', color: 'var(--primary-dark)',
                    fontWeight: 700, fontSize: 12, cursor: 'pointer'
                  }}
                >
                  Track Route
                </button>
              </div>
            ))
          )}
        </div>
      </main>

      <BottomNav />
    </div>
  );
}
