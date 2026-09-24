import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { TopBar } from '../../components/Navigation';
import { TierBadge, VerifiedBadge, ScoreBars } from '../../components/Navigation';
import { useCountdown, formatCountdownFull, getRingColor } from '../../hooks/useCountdown';
import { matchDonation, RECIPIENTS, DRIVERS } from '../../data/seed';

export default function MatchResult() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { donations, recipients, drivers, acceptOffer, expireOffer, fastForwardOfferTimer, showToast } = useApp();
  const [showWhyModal, setShowWhyModal] = useState(false);
  const [matchScoreData, setMatchScoreData] = useState(null);
  const confettiFired = useRef(false);

  const donation = donations.find(d => d.id === parseInt(id));

  // Determine current phase based on donation status
  const currentStatus = donation?.status || 'offered';
  const phase = currentStatus === 'matched' ? 'matched'
    : (currentStatus === 'escalated' || currentStatus === 'expired') ? 'escalated'
    : 'matching';

  // Calculate 1/4th of max safe time of food
  const safeHours = Number(donation?.safe_hours || 4);
  const offerWindowHours = donation?.offer_window_hours || (safeHours / 4);
  const totalWindowSeconds = Math.round(offerWindowHours * 3600);

  const offerExpiresAt = donation?.offer_expires_at || (
    donation?.created_at
      ? new Date(new Date(donation.created_at).getTime() + totalWindowSeconds * 1000).toISOString()
      : new Date(Date.now() + totalWindowSeconds * 1000).toISOString()
  );

  const countdown = useCountdown(offerExpiresAt, totalWindowSeconds);

  // Trigger auto-escalation if the 1/4th countdown expired while on this page
  useEffect(() => {
    if (phase === 'matching' && countdown.isExpired && donation && donation.status === 'offered') {
      expireOffer(donation.id, '1/4th safe time window ended with no shelter acceptance');
    }
  }, [phase, countdown.isExpired, donation, expireOffer]);

  // Fire confetti once when matched
  useEffect(() => {
    if (phase === 'matched' && !confettiFired.current) {
      confettiFired.current = true;
      import('canvas-confetti').then(m => {
        const confetti = m.default;
        confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 }, colors: ['#fc8019', '#ff9a3d', '#006e16', '#7cdc75'] });
      }).catch(() => {});
    }
  }, [phase]);

  // Compute scoring breakdown for modal
  useEffect(() => {
    if (donation) {
      const res = matchDonation(donation, Date.now());
      setMatchScoreData(res?.candidates?.[0] || null);
    }
  }, [donation]);

  if (!donation) {
    return (
      <div style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
        <span className="material-symbols-outlined" style={{ fontSize: 48, color: 'var(--on-surface-variant)' }}>error_outline</span>
        <p className="text-headline-sm">Donation not found</p>
        <button className="btn-primary" onClick={() => navigate('/donor')}>Go Home</button>
      </div>
    );
  }

  const matchedRecipient = recipients.find(r => r.id === donation.matched_recipient_id) || recipients[0] || RECIPIENTS[0];
  const assignedDriver = drivers.find(d => d.id === donation.driver_id) || drivers[0] || DRIVERS[0];
  const ringColor = getRingColor(countdown.totalSeconds, countdown.pct);

  const windowLabel = offerWindowHours >= 1 ? `${offerWindowHours}h` : `${Math.round(offerWindowHours * 60)}m`;

  return (
    <div style={{ minHeight: '100dvh', background: 'var(--surface)', display: 'flex', flexDirection: 'column' }}>
      <TopBar
        title={phase === 'matched' ? 'Match Found!' : phase === 'matching' ? 'Finding Match…' : 'Offer Escalated'}
        showBack
      />

      <main style={{ flex: 1, paddingTop: 64, paddingBottom: 40, overflowY: 'auto' }}>
        {/* === MATCHING PHASE (1/4th SAFE TIME COUNTDOWN ACTIVE) === */}
        {phase === 'matching' && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '24px 16px', gap: 20 }}>
            {/* Animated Radar Pulse */}
            <div style={{ position: 'relative', width: 110, height: 110, display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: 10 }}>
              {[1, 2, 3].map(i => (
                <div key={i} style={{
                  position: 'absolute', borderRadius: '50%',
                  border: `2px solid var(--primary-container)`,
                  width: 36 + i * 28, height: 36 + i * 28,
                  opacity: 0,
                  animation: `radar-pulse 2s ease-out ${i * 0.5}s infinite`,
                }} />
              ))}
              <div style={{
                width: 56, height: 56, borderRadius: '50%',
                background: 'linear-gradient(135deg, var(--primary-container), #ff9a3d)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: 'var(--shadow-primary-lg)', zIndex: 1
              }}>
                <span className="material-symbols-outlined" style={{ fontSize: 28, color: 'white', fontVariationSettings: "'FILL' 1" }}>radar</span>
              </div>
            </div>

            {/* Header info */}
            <div style={{ textAlign: 'center' }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 12px', borderRadius: 999, background: 'rgba(252,128,25,0.1)', color: 'var(--primary-dark)', fontSize: 12, fontWeight: 700, marginBottom: 8 }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--primary)', animation: 'pulse 1.2s infinite' }} />
                <span>Broadcasting to Verified Shelters</span>
              </div>
              <h2 className="text-headline-md" style={{ margin: '0 0 6px' }}>Searching for Match…</h2>
              <p className="text-body-sm" style={{ color: 'var(--on-surface-variant)', maxWidth: 320, margin: '0 auto' }}>
                Food rescue offer for <strong>{donation.description}</strong> is active in shelter offer feeds. Awaiting shelter confirmation.
              </p>
            </div>

            {/* Prominent 1/4th Safe Time Countdown Card */}
            <div style={{
              width: '100%', maxWidth: 360, borderRadius: 20, padding: 18,
              background: 'var(--surface-container-lowest)',
              boxShadow: 'var(--shadow-card)',
              border: '2px solid rgba(252,128,25,0.2)',
              display: 'flex', flexDirection: 'column', gap: 12
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 20, color: 'var(--primary)' }}>timelapse</span>
                  <span className="text-label-md" style={{ fontWeight: 800, color: 'var(--on-surface)' }}>
                    Match & Response Window
                  </span>
                </div>
                <span style={{
                  padding: '2px 8px', borderRadius: 999,
                  background: 'rgba(0,110,22,0.1)', color: 'var(--tertiary)',
                  fontSize: 11, fontWeight: 800
                }}>
                  1/4th of Safe Time
                </span>
              </div>

              {/* Big Digital Clock */}
              <div style={{
                textAlign: 'center', padding: '12px 10px', borderRadius: 14,
                background: 'linear-gradient(135deg, rgba(252,128,25,0.06), rgba(0,110,22,0.04))',
                border: '1px dashed rgba(252,128,25,0.3)'
              }}>
                <div style={{
                  fontSize: 34, fontWeight: 900, letterSpacing: '0.04em',
                  fontFamily: 'monospace',
                  color: countdown.pct < 20 ? 'var(--urgent)' : 'var(--primary-dark)'
                }}>
                  {formatCountdownFull(countdown.totalSeconds)}
                </div>
                <div className="text-label-sm" style={{ color: 'var(--on-surface-variant)', marginTop: 4 }}>
                  Time remaining before automatic escalation • Food safe for {safeHours}h ({windowLabel} match SLA)
                </div>
              </div>

              {/* Progress bar */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--on-surface-variant)', marginBottom: 4 }}>
                  <span>Broadcast start</span>
                  <span>{Math.round(countdown.pct)}% time left</span>
                  <span>Escalation</span>
                </div>
                <div style={{ width: '100%', height: 8, borderRadius: 999, background: 'var(--surface-container)', overflow: 'hidden' }}>
                  <div style={{
                    width: `${countdown.pct}%`, height: '100%', borderRadius: 999,
                    background: countdown.pct < 20 ? 'var(--urgent)' : 'linear-gradient(90deg, var(--primary), #006e16)',
                    transition: 'width 1s linear'
                  }} />
                </div>
              </div>

              <div style={{ fontSize: 11, color: 'var(--on-surface-variant)', lineHeight: 1.5, background: 'var(--surface-container-low)', padding: '8px 10px', borderRadius: 10 }}>
                💡 <strong>Protocol rule:</strong> To guarantee freshness, if no shelter accepts within 1/4th of safe duration, the offer is removed from shelter feeds and automatically routed to city dispatch / Tier 4 composting.
              </div>
            </div>

            {/* Listening shelters queue */}
            <div style={{ width: '100%', maxWidth: 360, display: 'flex', flexDirection: 'column', gap: 8 }}>
              <span className="text-label-md" style={{ color: 'var(--on-surface-variant)', fontWeight: 700 }}>
                Pinged Shelters in Proximity (Channel: Active):
              </span>
              {[
                { name: 'Asha Nilayam Old Age Home', tier: 1, dist: '2.1 km', status: 'Reviewing offer…', pureVeg: true },
                { name: 'Shishu Grih Child Care Home', tier: 1, dist: '3.4 km', status: 'Active intake', pureVeg: true },
                { name: 'Annapurna Rasoi - Ward 12', tier: 2, dist: '4.2 km', status: 'Capacity available', pureVeg: true },
              ].map((s, i) => (
                <div key={s.name} style={{
                  padding: '10px 14px', borderRadius: 14,
                  background: 'var(--surface-container-lowest)',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  animation: `fadeInUp 0.3s ${i * 0.15}s both`
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{
                      width: 10, height: 10, borderRadius: '50%',
                      background: i === 0 ? 'var(--primary)' : 'var(--tertiary)',
                      animation: 'pulse 1.2s infinite'
                    }} />
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span className="text-label-md" style={{ fontWeight: 700 }}>{s.name}</span>
                        <TierBadge tier={s.tier} />
                      </div>
                      <span className="text-body-sm" style={{ color: 'var(--on-surface-variant)', fontSize: 11 }}>
                        {s.dist} • {s.status}
                      </span>
                    </div>
                  </div>
                  <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 6px', borderRadius: 6, background: 'rgba(0,110,22,0.1)', color: 'var(--tertiary)' }}>
                    NOTIFIED
                  </span>
                </div>
              ))}
            </div>

            {/* Testing & Demo Action Helpers */}
            <div style={{
              width: '100%', maxWidth: 360, marginTop: 4, padding: 14, borderRadius: 16,
              background: 'rgba(252,128,25,0.06)', border: '1px dashed rgba(252,128,25,0.3)',
              display: 'flex', flexDirection: 'column', gap: 10
            }}>
              <span className="text-label-sm" style={{ fontWeight: 800, color: 'var(--primary-dark)', display: 'flex', alignItems: 'center', gap: 4 }}>
                <span className="material-symbols-outlined" style={{ fontSize: 16 }}>science</span>
                Instant Demo / Testing Controls:
              </span>

              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  onClick={() => acceptOffer(donation.id, donation.matched_recipient_id || 1)}
                  style={{
                    flex: 1, padding: '10px 8px', borderRadius: 12, border: 'none',
                    background: 'linear-gradient(135deg, var(--tertiary), #28a745)',
                    color: 'white', fontWeight: 800, fontSize: 12, cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
                    boxShadow: '0 2px 8px rgba(0,110,22,0.25)'
                  }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 16 }}>check_circle</span>
                  <span>Simulate Accept</span>
                </button>

                <button
                  onClick={() => fastForwardOfferTimer(donation.id, 5)}
                  style={{
                    flex: 1, padding: '10px 8px', borderRadius: 12, border: '1px solid var(--outline-variant)',
                    background: 'var(--surface-container-lowest)', color: 'var(--on-surface)',
                    fontWeight: 700, fontSize: 12, cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4
                  }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 16 }}>fast_forward</span>
                  <span>Fast-forward to 5s</span>
                </button>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 11, color: 'var(--on-surface-variant)' }}>
                <span>Or switch role to <strong>Recipient</strong> to accept live in Offers</span>
                <button
                  onClick={() => navigate('/recipient/offers')}
                  style={{ background: 'none', border: 'none', color: 'var(--primary-dark)', fontWeight: 700, cursor: 'pointer', padding: 0 }}
                >
                  Open Offers →
                </button>
              </div>
            </div>
          </div>
        )}

        {/* === MATCHED PHASE (ACCEPTOR ACCEPTED THE FOOD!) === */}
        {phase === 'matched' && (
          <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Success banner */}
            <div style={{
              borderRadius: 20, padding: 22, textAlign: 'center',
              background: 'linear-gradient(135deg, rgba(0,110,22,0.1), rgba(88,182,84,0.08))',
              border: '1.5px solid rgba(0,110,22,0.25)',
              boxShadow: '0 4px 16px rgba(0,110,22,0.1)'
            }} className="animate-fade-in-up">
              <div style={{
                width: 64, height: 64, borderRadius: '50%', background: 'rgba(0,110,22,0.12)',
                margin: '0 auto 12px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                animation: 'float 3s ease-in-out infinite'
              }}>
                <span className="material-symbols-outlined" style={{ fontSize: 38, color: 'var(--tertiary)', fontVariationSettings: "'FILL' 1" }}>
                  check_circle
                </span>
              </div>
              <h2 className="text-headline-md" style={{ color: 'var(--tertiary)', margin: '0 0 4px', fontWeight: 800 }}>
                Offer Accepted!
              </h2>
              <p className="text-body-sm" style={{ color: 'var(--on-surface)', margin: 0, fontWeight: 600 }}>
                <strong>{matchedRecipient.name}</strong> accepted your donation of {donation.description}!
              </p>
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                padding: '4px 12px', borderRadius: 999, background: 'white',
                color: 'var(--tertiary)', fontSize: 11, fontWeight: 800, marginTop: 10,
                boxShadow: '0 2px 6px rgba(0,0,0,0.06)'
              }}>
                <span className="material-symbols-outlined" style={{ fontSize: 14 }}>volunteer_activism</span>
                Intake verified within safe window • Volunteer rider dispatched
              </div>
            </div>

            {/* Recipient card */}
            <div className="card animate-fade-in-up delay-1" style={{ padding: 18 }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <TierBadge tier={matchedRecipient.tier} />
                    <VerifiedBadge small />
                  </div>
                  <h3 className="text-headline-sm" style={{ margin: '0 0 2px' }}>{matchedRecipient.name}</h3>
                  <p className="text-body-sm" style={{ color: 'var(--on-surface-variant)', margin: 0 }}>
                    {matchedRecipient.address} • 2.1 km away
                  </p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span className="text-headline-sm" style={{ color: 'var(--primary-dark)', fontWeight: 800, display: 'block' }}>
                    94%
                  </span>
                  <span className="text-label-sm" style={{ color: 'var(--on-surface-variant)' }}>match score</span>
                </div>
              </div>

              {/* Stats */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 12 }}>
                {[
                  { label: 'Headcount', value: `${matchedRecipient.headcount} people` },
                  { label: 'Free Capacity', value: `${matchedRecipient.capacity_kg - matchedRecipient.capacity_used_kg} kg` },
                  { label: 'Need Tonight', value: `${matchedRecipient.need_today_kg} kg` },
                ].map(s => (
                  <div key={s.label} style={{ padding: '8px', borderRadius: 12, background: 'var(--surface-container-low)', textAlign: 'center' }}>
                    <span className="text-body-sm" style={{ color: 'var(--on-surface-variant)', display: 'block', marginBottom: 2 }}>{s.label}</span>
                    <span className="text-label-md" style={{ color: 'var(--on-surface)', fontWeight: 700 }}>{s.value}</span>
                  </div>
                ))}
              </div>

              {/* Pickup OTP banner */}
              <div style={{
                background: 'linear-gradient(135deg, rgba(252,128,25,0.08), rgba(255,154,61,0.06))',
                borderRadius: 14, padding: '10px 14px', border: '1px dashed rgba(252,128,25,0.3)',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12
              }}>
                <div>
                  <span className="text-label-sm" style={{ color: 'var(--primary-dark)', fontWeight: 700, display: 'block' }}>Pickup OTP Code:</span>
                  <span className="text-headline-sm" style={{ letterSpacing: '0.15em', fontWeight: 900, color: 'var(--primary)' }}>
                    {donation.delivery_otp || '8492'}
                  </span>
                </div>
                <span className="text-body-sm" style={{ color: 'var(--on-surface-variant)', fontSize: 11, maxWidth: 140, textAlign: 'right' }}>
                  Share with rider upon pickup
                </span>
              </div>

              <button
                onClick={() => setShowWhyModal(true)}
                style={{ background: 'none', border: 'none', color: 'var(--primary-dark)', fontSize: 12, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, padding: 0 }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 14 }}>bar_chart</span>
                View full AI match breakdown
              </button>
            </div>

            {/* Driver card */}
            {assignedDriver && (
              <div className="card animate-fade-in-up delay-2" style={{ padding: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'var(--primary-fixed)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <span className="material-symbols-outlined" style={{ fontSize: 24, color: 'var(--on-primary-fixed)', fontVariationSettings: "'FILL' 1" }}>two_wheeler</span>
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <h4 className="text-label-lg" style={{ margin: 0, fontWeight: 700 }}>{assignedDriver.name}</h4>
                      <span style={{ fontSize: 10, padding: '1px 6px', borderRadius: 999, background: 'rgba(0,110,22,0.1)', color: 'var(--tertiary)', fontWeight: 700 }}>Dispatched</span>
                    </div>
                    <p className="text-body-sm" style={{ color: 'var(--on-surface-variant)', margin: '2px 0 0' }}>{assignedDriver.vehicle} • ⭐ {assignedDriver.rating}</p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span className="text-label-lg" style={{ color: 'var(--primary-dark)', fontWeight: 700 }}>~12 min</span>
                    <span className="text-body-sm" style={{ color: 'var(--on-surface-variant)', display: 'block', fontSize: 11 }}>ETA</span>
                  </div>
                </div>
              </div>
            )}

            {/* Actions */}
            <div style={{ display: 'flex', gap: 10 }} className="animate-fade-in-up delay-3">
              <button
                className="btn-primary"
                style={{ flex: 1 }}
                onClick={() => navigate(`/donor/track/${id}`)}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 18, fontVariationSettings: "'FILL' 1" }}>gps_fixed</span>
                Track Live Route
              </button>
              <button
                className="btn-secondary"
                style={{ height: 52 }}
                onClick={() => navigate('/donor')}
              >
                Done
              </button>
            </div>
          </div>
        )}

        {/* === ESCALATED PHASE (1/4th SAFE WINDOW EXPIRED WITHOUT ACCEPTANCE) === */}
        {phase === 'escalated' && (
          <div style={{ padding: '40px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20 }}>
            <div style={{ width: 76, height: 76, borderRadius: '50%', background: 'rgba(226,55,68,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span className="material-symbols-outlined" style={{ fontSize: 40, color: 'var(--urgent)', fontVariationSettings: "'FILL' 1" }}>
                alarm_off
              </span>
            </div>

            <div style={{ textAlign: 'center' }}>
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                padding: '4px 12px', borderRadius: 999, background: 'rgba(226,55,68,0.1)',
                color: 'var(--urgent)', fontSize: 11, fontWeight: 800, marginBottom: 8
              }}>
                <span>1/4th Safe Time Window Expired</span>
              </div>
              <h2 className="text-headline-md" style={{ margin: '0 0 8px', fontWeight: 800 }}>
                No Match Found — Offer Escalated
              </h2>
              <p className="text-body-sm" style={{ color: 'var(--on-surface-variant)', maxWidth: 320, margin: '0 auto', lineHeight: 1.5 }}>
                No verified shelter accepted within the <strong>{windowLabel} SLA window</strong> (1/4th of {safeHours}h safe time). The offer has been removed from active shelter feeds so it cannot be claimed late.
              </p>
            </div>

            {/* Escalation info card */}
            <div style={{
              width: '100%', maxWidth: 340, padding: 14, borderRadius: 16,
              background: 'var(--surface-container-low)', display: 'flex', flexDirection: 'column', gap: 8
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span className="material-symbols-outlined" style={{ fontSize: 18, color: 'var(--primary)' }}>sync_problem</span>
                <span className="text-label-md" style={{ fontWeight: 700 }}>Automated Waste-Prevention Protocol:</span>
              </div>
              <p className="text-body-sm" style={{ color: 'var(--on-surface-variant)', margin: 0, fontSize: 12, lineHeight: 1.5 }}>
                • Offer removed from shelter queue ✓<br />
                • Alert sent to Kota central dispatcher ✓<br />
                • Food flagged for peripheral emergency kitchens or Tier 4 biogas / composting.
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, width: '100%', maxWidth: 340 }}>
              <button
                className="btn-primary"
                onClick={() => showToast('Kota central dispatcher notified to expand manual radius', 'radar')}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 18 }}>radar</span>
                Expand Search to City Outskirts
              </button>
              <button
                className="btn-secondary"
                style={{ height: 50 }}
                onClick={() => showToast('Logged for Kota Biogas & Compost Partner', 'compost')}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 18 }}>compost</span>
                Send to Compost Partner (Tier 4)
              </button>
              <button
                className="btn-secondary"
                style={{ height: 50 }}
                onClick={() => navigate('/donor')}
              >
                Back to Feed
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Score breakdown modal */}
      {showWhyModal && matchScoreData && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(22,27,45,0.5)', display: 'flex', alignItems: 'flex-end' }} onClick={() => setShowWhyModal(false)}>
          <div style={{ width: '100%', background: 'var(--surface-container-lowest)', borderRadius: '28px 28px 0 0', padding: '20px 20px 36px', maxHeight: '80vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
            <div style={{ width: 40, height: 5, borderRadius: 999, background: 'var(--surface-container)', margin: '0 auto 20px' }} />
            <h3 className="text-headline-sm" style={{ margin: '0 0 4px' }}>Why This Match?</h3>
            <p className="text-body-sm" style={{ color: 'var(--on-surface-variant)', margin: '0 0 20px' }}>
              Total score: <strong style={{ color: 'var(--primary-dark)' }}>{Math.round(matchScoreData.score * 100)}%</strong>
            </p>
            <ScoreBars breakdown={matchScoreData.breakdown} />
            <div style={{ marginTop: 20, padding: 12, borderRadius: 14, background: 'var(--surface-container-low)', fontSize: 11, color: 'var(--on-surface-variant)', lineHeight: 1.6 }}>
              <strong style={{ color: 'var(--on-surface)' }}>Scoring formula:</strong>
              <br />0.30 × Proximity + 0.20 × Capacity Fit + 0.20 × Priority Tier + 0.15 × Time Slack + 0.10 × Need Today + 0.05 × Fairness
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
