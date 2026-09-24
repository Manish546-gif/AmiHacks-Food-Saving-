import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { TopBar, BottomNav, TierBadge, ScoreBars } from '../../components/Navigation';
import { useCountdown, formatCountdownFull, getRingColor } from '../../hooks/useCountdown';

function ActiveOfferCard({ offer, isExpanded, onToggleExpand, onAccept, onDecline, onExpire }) {
  const safeHours = Number(offer.safe_hours || 4);
  const offerWindowHours = offer.offer_window_hours || (safeHours / 4);
  const totalWindowSeconds = Math.round(offerWindowHours * 3600);

  const offerExpiresAt = offer.offer_expires_at || (
    offer.created_at
      ? new Date(new Date(offer.created_at).getTime() + totalWindowSeconds * 1000).toISOString()
      : new Date(Date.now() + totalWindowSeconds * 1000).toISOString()
  );

  const countdown = useCountdown(offerExpiresAt, totalWindowSeconds);

  // Auto-expire when countdown reaches 0
  useEffect(() => {
    if (countdown.isExpired) {
      onExpire(offer.id);
    }
  }, [countdown.isExpired, offer.id, onExpire]);

  if (countdown.isExpired) return null;

  const isUrgent = countdown.pct <= 25;
  const windowLabel = offerWindowHours >= 1 ? `${offerWindowHours}h` : `${Math.round(offerWindowHours * 60)}m`;

  return (
    <div
      style={{
        background: 'var(--surface-container-lowest)', borderRadius: 20, padding: 18,
        boxShadow: 'var(--shadow-card)',
        border: isUrgent ? '2px solid rgba(226,55,68,0.5)' : '2px solid rgba(252,128,25,0.3)',
        display: 'flex', flexDirection: 'column', gap: 12, position: 'relative', overflow: 'hidden'
      }}
    >
      {/* Top 1/4th safe window timer banner */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        background: isUrgent
          ? 'linear-gradient(90deg, rgba(226,55,68,0.15), rgba(252,128,25,0.08))'
          : 'linear-gradient(90deg, rgba(252,128,25,0.12), rgba(255,154,61,0.06))',
        margin: '-18px -18px 0 -18px', padding: '10px 18px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span
            className="material-symbols-outlined"
            style={{
              fontSize: 18,
              color: isUrgent ? 'var(--urgent)' : 'var(--primary)',
              animation: isUrgent ? 'pulse 1s infinite' : 'none'
            }}
          >
            timer
          </span>
          <div>
            <span className="text-label-md" style={{ color: isUrgent ? 'var(--urgent)' : 'var(--primary-dark)', fontWeight: 800 }}>
              1/4th Safe Time SLA: {formatCountdownFull(countdown.totalSeconds)} remaining
            </span>
            <span style={{ fontSize: 10, color: 'var(--on-surface-variant)', display: 'block' }}>
              Window set to 1/4th of {safeHours}h safe time ({windowLabel} window)
            </span>
          </div>
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
          <div className="text-label-sm" style={{ color: 'var(--on-surface-variant)' }}>Safe Window</div>
          <div style={{ fontWeight: 800, fontSize: 13, color: 'var(--secondary)' }}>{safeHours}h safe</div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div className="text-label-sm" style={{ color: 'var(--on-surface-variant)' }}>Action SLA</div>
          <div style={{ fontWeight: 800, fontSize: 13, color: isUrgent ? 'var(--urgent)' : 'var(--tertiary)' }}>
            {formatCountdownFull(countdown.totalSeconds)}
          </div>
        </div>
      </div>

      {/* AI Match Explanation */}
      <div style={{
        background: 'rgba(252,128,25,0.06)', borderRadius: 12, padding: 10,
        border: '1px dashed rgba(252,128,25,0.3)',
      }}>
        <div
          onClick={onToggleExpand}
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span className="material-symbols-outlined" style={{ fontSize: 16, color: 'var(--primary)' }}>auto_awesome</span>
            <span className="text-label-md" style={{ fontWeight: 800, color: 'var(--primary-dark)' }}>
              Match Score: {Math.round((offer.match_score || 0.94) * 100)}% Match
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
          onClick={() => onDecline(offer.id)}
          style={{
            flex: 1, height: 48, borderRadius: 14, border: '1px solid var(--outline-variant)',
            background: 'transparent', color: 'var(--on-surface-variant)', fontWeight: 700, fontSize: 13,
            cursor: 'pointer'
          }}
        >
          Decline
        </button>
        <button
          onClick={() => onAccept(offer.id)}
          disabled={countdown.isExpired}
          style={{
            flex: 2, height: 48, borderRadius: 14, border: 'none',
            background: countdown.isExpired
              ? 'var(--surface-container-high)'
              : 'linear-gradient(135deg, var(--tertiary), #28a745)',
            color: 'white', fontWeight: 800, fontSize: 14,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            cursor: countdown.isExpired ? 'not-allowed' : 'pointer',
            boxShadow: countdown.isExpired ? 'none' : '0 4px 14px rgba(0,110,22,0.3)',
          }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: 20 }}>check_circle</span>
          <span>{countdown.isExpired ? 'Offer Expired' : 'Accept Food Rescue'}</span>
        </button>
      </div>
    </div>
  );
}

export default function RecipientOffers() {
  const navigate = useNavigate();
  const { donations, acceptOffer, declineOffer, expireOffer, showToast, refreshData, dbStatus } = useApp();
  const [tab, setTab] = useState('active'); // active | past
  const [expandedScore, setExpandedScore] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  // Active offers: status === 'offered' and 1/4th safe window has not passed
  const activeOffers = donations.filter(d => {
    if (d.status !== 'offered') return false;
    const safeH = Number(d.safe_hours || 4);
    const winH = d.offer_window_hours || (safeH / 4);
    const expiresAt = d.offer_expires_at || (d.created_at ? new Date(new Date(d.created_at).getTime() + winH * 3600000).toISOString() : null);
    if (expiresAt && new Date(expiresAt).getTime() <= Date.now()) return false;
    return true;
  });

  // Past offers: matched, picked_up, or delivered
  const pastOffers = donations.filter(d => ['matched', 'picked_up', 'delivered'].includes(d.status) && (d.matched_recipient_id === 1 || !d.matched_recipient_id));

  const handleManualRefresh = async () => {
    setRefreshing(true);
    if (refreshData) await refreshData();
    showToast('Updated live offers from network', 'cloud_done');
    setTimeout(() => setRefreshing(false), 500);
  };

  const handleAccept = (offerId) => {
    const success = acceptOffer(offerId, 1);
    if (success) {
      showToast('Offer accepted! Opening live tracking...', 'two_wheeler');
      navigate(`/recipient/track/${offerId}`);
    }
  };

  const handleDecline = (offerId) => {
    declineOffer(offerId, 1, 'Temporary capacity limitation');
  };

  const handleExpire = (offerId) => {
    expireOffer(offerId, '1/4th safe window expired with no shelter acceptance');
  };

  return (
    <div style={{ minHeight: '100dvh', background: 'var(--surface)', display: 'flex', flexDirection: 'column' }}>
      <TopBar
        title="Rescue Offers"
        subtitle="Surplus-to-Shelter"
        rightSlot={
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <button
              onClick={handleManualRefresh}
              aria-label="Refresh offers"
              title="Refresh live offers"
              style={{
                width: 36, height: 36, borderRadius: '50%', border: 'none',
                background: 'var(--surface-container)', color: 'var(--on-surface)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer'
              }}
            >
              <span
                className="material-symbols-outlined"
                style={{
                  fontSize: 20,
                  transition: 'transform 0.5s ease',
                  transform: refreshing ? 'rotate(360deg)' : 'none'
                }}
              >
                refresh
              </span>
            </button>
            <div
              style={{
                display: 'flex', alignItems: 'center', gap: 4,
                padding: '4px 8px', borderRadius: 999,
                background: dbStatus?.connected ? 'rgba(0,110,22,0.1)' : 'rgba(252,128,25,0.1)',
                color: dbStatus?.connected ? 'var(--tertiary)' : 'var(--primary)',
                fontSize: 10, fontWeight: 800
              }}
            >
              <span style={{
                width: 6, height: 6, borderRadius: '50%',
                background: dbStatus?.connected ? 'var(--tertiary)' : 'var(--primary)',
                animation: 'pulse 1.5s infinite'
              }} />
              <span>{dbStatus?.connected ? 'LIVE' : 'SYNCING'}</span>
            </div>
          </div>
        }
      />

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
                  No pending food offers right now. As soon as a verified restaurant or mess posts surplus, it will ring here in real-time with an active 1/4th safe window response SLA.
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
              activeOffers.map(offer => (
                <ActiveOfferCard
                  key={offer.id}
                  offer={offer}
                  isExpanded={expandedScore === offer.id}
                  onToggleExpand={() => setExpandedScore(expandedScore === offer.id ? null : offer.id)}
                  onAccept={handleAccept}
                  onDecline={handleDecline}
                  onExpire={handleExpire}
                />
              ))
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
                  onClick={() => navigate(`/recipient/track/${donation.id}`)}
                  style={{
                    padding: '8px 14px', borderRadius: 12, border: 'none',
                    background: donation.status === 'delivered' ? 'var(--surface-container)' : 'var(--primary)',
                    color: donation.status === 'delivered' ? 'var(--on-surface-variant)' : 'white',
                    fontWeight: 800, fontSize: 12, cursor: 'pointer',
                    display: 'flex', alignItems: 'center', gap: 4
                  }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
                    {donation.status === 'delivered' ? 'receipt_long' : 'two_wheeler'}
                  </span>
                  <span>{donation.status === 'delivered' ? 'Intake Log' : 'Track Delivery'}</span>
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
