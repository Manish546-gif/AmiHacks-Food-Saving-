import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { useVerification, approveCaseInstantDemo } from '../../hooks/useVerification';
import { TopBar, BottomNav, VerifiedBadge, TierBadge, CapacityGauge } from '../../components/Navigation';
import { CountdownRing } from '../../components/CountdownRing';
import MapView from '../../components/MapView';
import { DONORS } from '../../data/seed';

// No static fake data — all offers come from MongoDB via AppContext
export default function RecipientHome() {
  const navigate = useNavigate();
  const { recipients, donors, donations, acceptOffer, declineOffer, showToast, isRecipientVerified } = useApp();
  const [accepting, setAccepting] = useState(true);
  const [showUnverifiedModal, setShowUnverifiedModal] = useState(false);
  
  const myRecipient = recipients[0]; // Asha Nilayam (demo)
  const donorDirectory = donors?.length ? donors : DONORS;

  const { verCase, state: verState, canReceive, refresh: refreshVerification } = useVerification(myRecipient?.id ? `r-${myRecipient.id}` : 'r-1', 'recipient');

  const isVerified = (verState === 'verified' || canReceive) || (isRecipientVerified ? isRecipientVerified(myRecipient?.id) : false) || (myRecipient?.verified === true && myRecipient?.verification_status !== 'under_review' && myRecipient?.verification_status !== 'submitted' && myRecipient?.verification_status !== 'needs_changes');

  // Find live offer from AppContext (status === 'offered' and 1/4th safe window active)
  const liveDonationOffer = donations.find(d => {
    if (d.status !== 'offered') return false;
    const safeH = Number(d.safe_hours || 4);
    const winH = d.offer_window_hours || (safeH / 4);
    const expiresAt = d.offer_expires_at || (d.created_at ? new Date(new Date(d.created_at).getTime() + winH * 3600000).toISOString() : null);
    if (expiresAt && new Date(expiresAt).getTime() <= Date.now()) return false;
    return true;
  });

  const currentOffer = liveDonationOffer ? {
    id: liveDonationOffer.id,
    donation_id: liveDonationOffer.id,
    donation: liveDonationOffer,
    score: liveDonationOffer.match_score || 0.91,
    breakdown: { proximity: 0.88, capacityFit: 0.92, priorityTier: 1.0, timeSlack: 0.85, needToday: 0.90, fairness: 0.80 },
    explanation: liveDonationOffer.match_explanation || ['Tier 1 priority', 'Pure Veg ✓ match', '2.1 km away', 'Capacity: 28 kg free'],
    expires_at: liveDonationOffer.offer_expires_at || liveDonationOffer.expires_at || new Date(Date.now() + 28000).toISOString(),
  } : null;

  const [offer, setOffer] = useState(currentOffer);
  const [offerResponse, setOfferResponse] = useState(null); // 'accepted' | 'declined' | null
  const [needKg, setNeedKg] = useState('');
  const [lang, setLang] = useState('hi');

  useEffect(() => {
    if (liveDonationOffer) {
      setOffer({
        id: liveDonationOffer.id,
        donation_id: liveDonationOffer.id,
        donation: liveDonationOffer,
        score: liveDonationOffer.match_score || 0.91,
        breakdown: { proximity: 0.88, capacityFit: 0.92, priorityTier: 1.0, timeSlack: 0.85, needToday: 0.90, fairness: 0.80 },
        explanation: liveDonationOffer.match_explanation || ['Tier 1 priority', 'Pure Veg ✓ match', '2.1 km away', 'Capacity: 28 kg free'],
        expires_at: liveDonationOffer.offer_expires_at || liveDonationOffer.expires_at || new Date(Date.now() + 28000).toISOString(),
      });
      setOfferResponse(null);
    } else {
      setOffer(null);
    }
  }, [liveDonationOffer]);

  const activeIntake = donations.find(d =>
    ['shelter_accepted', 'matched', 'picked_up'].includes(d.status) &&
    (d.matched_recipient_id === myRecipient?.id || !d.matched_recipient_id)
  );
  const activeIntakeDonor = donorDirectory.find(d => d.id === activeIntake?.donor_id) || donorDirectory[0];

  const handleAccept = () => {
    const targetId = offer?.donation_id || liveDonationOffer?.id || 1;
    if (!isVerified) {
      setShowUnverifiedModal(true);
      showToast('Institutional verification approval required before accepting surplus food', 'warning');
      return;
    }
    const success = acceptOffer(targetId, myRecipient.id);
    if (success !== false) {
      setOfferResponse('accepted');
      setOffer(null);
      showToast('Accepted! Opening live intake tracking...', 'two_wheeler');
      navigate(`/recipient/track/${targetId}`);
    }
  };

  const handleInstantApproveDemo = () => {
    approveCaseInstantDemo('vc-001');
    showToast('Simulation: Verified by District Operations Desk! Unlocking food intake...', 'verified');
    setShowUnverifiedModal(false);
    refreshVerification();
    setTimeout(() => {
      const targetId = offer?.donation_id || liveDonationOffer?.id || 1;
      acceptOffer(targetId, myRecipient.id);
      setOfferResponse('accepted');
      setOffer(null);
      navigate(`/recipient/track/${targetId}`);
    }, 400);
  };

  const handleDecline = () => {
    const targetId = offer?.donation_id || 2;
    declineOffer(targetId, myRecipient.id);
    setOfferResponse('declined');
    setOffer(null);
    showToast('Declined — offer cascaded to next shelter', 'arrow_forward');
  };

  const hi = lang === 'hi';

  return (
    <div style={{ minHeight: '100dvh', background: 'var(--surface)', display: 'flex', flexDirection: 'column' }}>
      <TopBar
        title={hi ? 'आशा निलयम' : 'Asha Nilayam'}
        subtitle
        rightSlot={
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ display: 'flex', background: 'var(--surface-container)', borderRadius: 999, padding: 2 }}>
              {['EN', 'हि'].map((l, i) => (
                <button key={l} onClick={() => setLang(i === 0 ? 'en' : 'hi')}
                  style={{ padding: '3px 10px', borderRadius: 999, border: 'none', cursor: 'pointer', fontSize: 11, fontWeight: 700, background: (lang === 'en') === (i === 0) ? 'var(--primary-dark)' : 'transparent', color: (lang === 'en') === (i === 0) ? 'white' : 'var(--on-surface-variant)', transition: 'all 200ms' }}>
                  {l}
                </button>
              ))}
            </div>
          </div>
        }
      />

      <main style={{ flex: 1, paddingTop: 64, paddingBottom: 96, overflowY: 'auto' }}>
        {/* Verification Compliance Gating Banner */}
        {!isVerified && (
          <div style={{
            margin: '12px 16px 4px', padding: '14px 16px', borderRadius: 16,
            background: verState === 'needs_changes' ? 'rgba(183,18,42,0.08)' : 'rgba(252,128,25,0.08)',
            border: verState === 'needs_changes' ? '1.5px solid rgba(183,18,42,0.3)' : '1.5px solid rgba(252,128,25,0.3)',
            boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
          }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
              <span className="material-symbols-outlined" style={{
                color: verState === 'needs_changes' ? 'var(--urgent)' : 'var(--primary)',
                fontSize: 22, flexShrink: 0, marginTop: 1
              }}>
                {verState === 'needs_changes' ? 'report_problem' : 'pending_actions'}
              </span>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' }}>
                  <span className="text-label-md" style={{
                    fontWeight: 800,
                    color: verState === 'needs_changes' ? 'var(--urgent)' : 'var(--primary-dark)'
                  }}>
                    {verState === 'needs_changes' ? '⚠️ Verification Action Required' : '⏳ Shelter Verification Pending Admin Approval'}
                  </span>
                  <span style={{
                    fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 999,
                    background: verState === 'needs_changes' ? 'rgba(183,18,42,0.15)' : 'rgba(252,128,25,0.15)',
                    color: verState === 'needs_changes' ? 'var(--urgent)' : 'var(--primary-dark)',
                    textTransform: 'uppercase'
                  }}>
                    {verState === 'needs_changes' ? 'Action Needed' : verState === 'under_review' ? 'Under Review' : 'Pending Approval'}
                  </span>
                </div>
                <p className="text-body-sm" style={{ color: 'var(--on-surface-variant)', margin: '4px 0 10px', lineHeight: 1.4 }}>
                  {verState === 'needs_changes'
                    ? (verCase?.decision_reason || 'District Operations Desk requested document updates before food intake authorization.')
                    : 'Asha Nilayam verification dossier is under review by City Dispatch Admin. Surplus food intake unlocks immediately upon admin approval.'}
                </p>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <button
                    onClick={() => navigate('/verification')}
                    style={{
                      padding: '6px 12px', borderRadius: 10, border: 'none',
                      background: 'var(--primary-dark)', color: 'white',
                      fontSize: 12, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4
                    }}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: 16 }}>badge</span>
                    <span>Verification Portal</span>
                  </button>
                  <button
                    onClick={() => navigate('/admin/verification')}
                    style={{
                      padding: '6px 12px', borderRadius: 10,
                      border: '1px solid var(--outline-variant)', background: 'var(--surface-container-lowest)',
                      color: 'var(--on-surface)', fontSize: 12, fontWeight: 700, cursor: 'pointer',
                      display: 'flex', alignItems: 'center', gap: 4
                    }}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: 16 }}>admin_panel_settings</span>
                    <span>Admin Review Desk</span>
                  </button>
                  <button
                    onClick={handleInstantApproveDemo}
                    style={{
                      padding: '6px 12px', borderRadius: 10, border: 'none',
                      background: 'rgba(0,110,22,0.12)', color: 'var(--tertiary)',
                      fontSize: 12, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4
                    }}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: 16 }}>bolt</span>
                    <span>Demo: Instant Admin Approve</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Institution header */}
        <div style={{
          margin: '12px 16px',
          padding: 16, borderRadius: 20,
          background: 'linear-gradient(135deg, rgba(252,128,25,0.06), rgba(255,154,61,0.04))',
          border: '1px solid rgba(252,128,25,0.12)',
        }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 10 }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <TierBadge tier={1} />
                <VerifiedBadge />
              </div>
              <h2 className="text-headline-sm" style={{ margin: '0 0 2px' }}>
                {hi ? 'आशा निलयम वृद्धाश्रम' : 'Asha Nilayam Old Age Home'}
              </h2>
              <p className="text-body-sm" style={{ color: 'var(--on-surface-variant)', margin: 0 }}>
                {hi ? '65 निवासी • कोटा, राजस्थान' : '65 residents • Kota, Rajasthan'}
              </p>
            </div>
            <div style={{ width: 48, height: 48, borderRadius: 14, background: 'var(--primary-fixed)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <span className="material-symbols-outlined" style={{ fontSize: 26, color: 'var(--on-primary-fixed)', fontVariationSettings: "'FILL' 1" }}>volunteer_activism</span>
            </div>
          </div>

          {/* Capacity gauge */}
          <CapacityGauge used={myRecipient.capacity_used_kg} total={myRecipient.capacity_kg} />
        </div>

        {/* Accepting toggle */}
        <div style={{ margin: '0 16px 16px', padding: '14px 16px', borderRadius: 16, background: 'var(--surface-container-lowest)', boxShadow: 'var(--shadow-card)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <span className="text-label-lg" style={{ fontWeight: 700, display: 'block' }}>
              {hi ? 'आज स्वीकार कर रहे हैं' : 'Accepting Today'}
            </span>
            <span className="text-body-sm" style={{ color: accepting ? 'var(--tertiary)' : 'var(--on-surface-variant)' }}>
              {accepting ? (hi ? '● सक्रिय' : '● Active — offers will arrive') : (hi ? '● बंद है' : '● Paused')}
            </span>
          </div>
          <button
            role="switch"
            aria-checked={accepting}
            onClick={() => { setAccepting(!accepting); showToast(accepting ? 'Paused — offers suspended' : 'Active — ready to receive offers', accepting ? 'pause' : 'play_circle'); }}
            style={{
              width: 56, height: 30, borderRadius: 15, border: 'none', cursor: 'pointer',
              background: accepting ? 'var(--tertiary)' : 'var(--surface-container)',
              position: 'relative', transition: 'background 250ms',
            }}
          >
            <div style={{
              position: 'absolute', top: 3, left: accepting ? 29 : 3, width: 24, height: 24,
              borderRadius: '50%', background: 'white', transition: 'left 250ms cubic-bezier(0.23,1,0.32,1)',
              boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
            }} />
          </button>
        </div>

        {/* Tonight's need */}
        <div style={{ margin: '0 16px 16px', padding: '14px 16px', borderRadius: 16, background: 'var(--surface-container-lowest)', boxShadow: 'var(--shadow-card)' }}>
          <span className="text-label-lg" style={{ fontWeight: 700, display: 'block', marginBottom: 8 }}>
            {hi ? 'आज रात की ज़रूरत' : "Tonight's Need"}
          </span>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <input
              type="number" min="1" placeholder={hi ? 'किलो' : 'kg needed'}
              value={needKg}
              onChange={e => setNeedKg(e.target.value)}
              style={{ flex: 1, padding: '10px 12px', borderRadius: 12, border: 'none', background: 'var(--surface-container-low)', outline: 'none', fontSize: 16, fontFamily: 'var(--font-family)', color: 'var(--on-surface)' }}
              aria-label="Kg needed tonight"
            />
            <span className="text-label-md" style={{ color: 'var(--on-surface-variant)' }}>kg</span>
            <button
              onClick={() => showToast(`Need updated to ${needKg} kg`, 'check')}
              style={{ padding: '10px 16px', borderRadius: 12, background: 'var(--primary-dark)', color: 'white', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 700 }}
            >
              {hi ? 'सेट करें' : 'Set'}
            </button>
          </div>
          <p className="text-body-sm" style={{ color: 'var(--on-surface-variant)', marginTop: 6 }}>
            {hi ? 'वर्तमान ज़रूरत: 25 kg (65 लोगों के लिए रात का खाना)' : 'Current need: 25 kg (dinner for 65 residents)'}
          </p>
        </div>

        {/* Active Incoming Rescue in Transit Card */}
        {activeIntake && (
          <div style={{
            margin: '0 16px 16px', borderRadius: 20, overflow: 'hidden',
            background: 'var(--surface-container-lowest)',
            border: '2px solid rgba(0,110,22,0.3)',
            boxShadow: 'var(--shadow-elevated)', padding: 16
          }} className="animate-fade-in-up">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span className="material-symbols-outlined" style={{ fontSize: 20, color: 'var(--tertiary)' }}>
                  {activeIntake.status === 'shelter_accepted' ? 'schedule' : 'two_wheeler'}
                </span>
                <span className="text-label-md" style={{ fontWeight: 800, color: 'var(--tertiary)' }}>
                  {activeIntake.status === 'shelter_accepted'
                    ? (hi ? 'राइडर की प्रतीक्षा में...' : 'Shelter Accepted • Awaiting Rider')
                    : (hi ? 'भोजन रास्ते में है' : 'Incoming Food in Transit')}
                </span>
              </div>
              <span style={{
                fontSize: 10, fontWeight: 800, padding: '2px 8px', borderRadius: 999,
                background: 'rgba(0,110,22,0.1)', color: 'var(--tertiary)', textTransform: 'uppercase'
              }}>
                {activeIntake.status === 'picked_up' ? 'Picked Up' : activeIntake.status === 'matched' ? 'Rider Assigned' : 'Awaiting Rider'}
              </span>
            </div>

            <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 12 }}>
              <div style={{
                width: 52, height: 52, borderRadius: 14, background: 'var(--primary-fixed)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--on-primary-fixed)', flexShrink: 0
              }}>
                <span className="material-symbols-outlined" style={{ fontSize: 28 }}>soup_kitchen</span>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <h4 className="text-headline-sm" style={{ margin: 0, fontSize: 16 }}>{activeIntake.description}</h4>
                <p className="text-body-sm" style={{ color: 'var(--on-surface-variant)', margin: '2px 0 0' }}>
                  {activeIntake.qty_kg} kg • Feeds {activeIntake.est_meals || (activeIntake.qty_kg * 2)} people
                </p>
              </div>
            </div>

            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              background: 'var(--surface-container-low)', borderRadius: 12, padding: '8px 12px', marginBottom: 12
            }}>
              <div>
                <span style={{ fontSize: 10, color: 'var(--on-surface-variant)', display: 'block', fontWeight: 600 }}>
                  Gate Intake OTP
                </span>
                <span style={{ fontSize: 18, fontWeight: 900, color: 'var(--primary-dark)', letterSpacing: '0.15em' }}>
                  {activeIntake.delivery_otp || '8492'}
                </span>
              </div>
              <span style={{ fontSize: 11, color: 'var(--on-surface-variant)', fontWeight: 600 }}>
                Give to rider at gate
              </span>
            </div>

            <button
              onClick={() => navigate(`/recipient/track/${activeIntake.id}`)}
              style={{
                width: '100%', height: 48, borderRadius: 14, border: 'none',
                background: 'linear-gradient(135deg, var(--tertiary), #28a745)',
                color: 'white', fontWeight: 800, fontSize: 14, cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                boxShadow: '0 4px 12px rgba(0,110,22,0.25)'
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 20 }}>location_on</span>
              <span>{hi ? 'लाइव डिलीवरी ट्रैक करें' : 'Track Live Delivery 🛵'}</span>
            </button>
          </div>
        )}

        {activeIntake && (
          <div style={{ margin: '0 16px 16px', padding: 14, borderRadius: 20, background: 'var(--surface-container-lowest)', boxShadow: 'var(--shadow-card)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <div>
                <div className="text-label-lg" style={{ fontWeight: 800 }}>Incoming delivery route</div>
                <div className="text-body-sm" style={{ color: 'var(--on-surface-variant)' }}>Pickup to your shelter gate</div>
              </div>
              <span className="material-symbols-outlined" style={{ fontSize: 20, color: 'var(--tertiary)' }}>route</span>
            </div>
            <MapView
              mode="route"
              height="170px"
              pickupLat={activeIntakeDonor?.lat}
              pickupLng={activeIntakeDonor?.lng}
              dropLat={myRecipient?.lat}
              dropLng={myRecipient?.lng}
              riderLat={activeIntake?.rider_lat}
              riderLng={activeIntake?.rider_lng}
              waypoints={activeIntake?.route_waypoints || []}
              progress={activeIntake.status === 'picked_up' ? 0.7 : 0.25}
              showRoute
              ariaLabel="Shelter incoming delivery route"
            />
          </div>
        )}

        {/* Incoming offer */}
        {offer && accepting && offerResponse === null && (
          <div style={{ margin: '0 16px 16px', borderRadius: 20, overflow: 'hidden', boxShadow: 'var(--shadow-elevated)', border: '2px solid var(--primary-container)' }} className="animate-fade-in-up">
            {/* Offer header */}
            <div style={{ padding: '12px 16px 10px', background: 'linear-gradient(135deg, var(--primary-container) 0%, #ff9a3d 100%)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span className="text-label-sm" style={{ color: 'white', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  <span style={{ animation: 'ping 1s cubic-bezier(0,0,0.2,1) infinite', display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: 'rgba(255,255,255,0.8)', marginRight: 6 }} />
                  {hi ? 'नया प्रस्ताव!' : 'New Offer!'}
                </span>
                <CountdownRing expiresAt={offer.expires_at} size="sm" />
              </div>
            </div>

            {/* Offer body */}
            <div style={{ padding: 16, background: 'var(--surface-container-lowest)' }}>
              <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
                <div style={{ width: 72, height: 72, borderRadius: 12, background: 'var(--surface-container)', overflow: 'hidden', flexShrink: 0 }}>
                  {offer.donation.photo_url
                    ? <img src={offer.donation.photo_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <span className="material-symbols-outlined" style={{ fontSize: 28, color: 'var(--on-surface-variant)', fontVariationSettings: "'FILL' 1" }}>restaurant</span>
                      </div>
                  }
                </div>
                <div>
                  <h3 className="text-headline-sm" style={{ margin: '0 0 2px' }}>{offer.donation.description}</h3>
                  <p className="text-body-sm" style={{ color: 'var(--on-surface-variant)', margin: '0 0 6px' }}>
                    Feeds {offer.donation.est_meals || Math.round((offer.donation.qty_kg || 0) * 2)} people
                  </p>
                  <p className="text-body-sm" style={{ color: 'var(--on-surface-variant)', margin: 0 }}>
                    {hi ? 'दूरी:' : 'Distance:'} <strong style={{ color: 'var(--on-surface)' }}>2.1 km</strong>
                  </p>
                </div>
              </div>

              {/* Why chips */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginBottom: 16 }}>
                {offer.explanation.map(chip => (
                  <span key={chip} style={{ padding: '3px 8px', borderRadius: 999, background: 'rgba(152,72,0,0.08)', color: 'var(--primary-dark)', fontSize: 10, fontWeight: 600 }}>
                    {chip}
                  </span>
                ))}
              </div>

              {/* Accept / Decline */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <button
                  className="btn-danger"
                  style={{ height: 56, fontSize: 16 }}
                  onClick={handleDecline}
                  aria-label="Decline offer"
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 22 }}>close</span>
                  {hi ? 'अस्वीकार' : 'Decline'}
                </button>
                <button
                  className="btn-primary"
                  style={{ height: 56, fontSize: 16 }}
                  onClick={handleAccept}
                  aria-label="Accept offer"
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 22, fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                  {hi ? 'स्वीकार करें' : 'Accept!'}
                </button>
              </div>

              <p className="text-body-sm" style={{ color: 'var(--on-surface-variant)', textAlign: 'center', marginTop: 8 }}>
                {hi ? 'WhatsApp पर भी लिंक भेजा गया है' : 'Accept/Decline link also sent via WhatsApp'}
              </p>
            </div>
          </div>
        )}

        {/* Accepted confirmation */}
        {offerResponse === 'accepted' && (
          <div style={{ margin: '0 16px 16px', padding: 20, borderRadius: 20, background: 'rgba(0,110,22,0.06)', border: '1px solid rgba(0,110,22,0.15)', textAlign: 'center' }} className="animate-fade-in-up">
            <span className="material-symbols-outlined" style={{ fontSize: 40, color: 'var(--tertiary)', fontVariationSettings: "'FILL' 1" }}>check_circle</span>
            <h3 className="text-headline-sm" style={{ color: 'var(--tertiary)', margin: '8px 0 4px' }}>{hi ? 'स्वीकार किया गया!' : 'Intake Accepted!'}</h3>
            <p className="text-body-sm" style={{ color: 'var(--on-surface-variant)', margin: 0 }}>
              {hi ? 'पास के वॉलंटियर राइडर्स को अलर्ट भेजा गया है। राइडर के स्वीकार करते ही विवरण यहाँ दिखेगा।' : 'Alerting nearby volunteer riders in Kota for pickup. Rider details will appear once accepted.'}
            </p>
          </div>
        )}

        {/* WhatsApp SMS preview */}
        <div style={{ margin: '0 16px 16px', padding: 16, borderRadius: 16, background: 'var(--surface-container-lowest)', boxShadow: 'var(--shadow-card)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
            <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#25D366', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span className="material-symbols-outlined" style={{ fontSize: 18, color: 'white', fontVariationSettings: "'FILL' 1" }}>chat</span>
            </div>
            <span className="text-label-md" style={{ fontWeight: 700 }}>WhatsApp / SMS preview</span>
          </div>
          <div style={{ background: '#E8F5E9', borderRadius: '0 12px 12px 12px', padding: '10px 12px', fontSize: 12, color: '#1a1a1a', lineHeight: 1.6 }}>
            🍲 *Surplus-to-Shelter* नया प्रस्ताव<br />
            वस्तु: Paneer Gravy & Dal Box (18 kg)<br />
            से: Allen Coaching Mess (2.1 km)<br />
            ⏰ स्वीकार करें: bit.ly/s2s-accept-001<br />
            ❌ अस्वीकार: bit.ly/s2s-decline-001<br />
            <em style={{ color: '#666', fontSize: 10 }}>offer expires in 30s</em>
          </div>
        </div>

        {/* Delivery history */}
        <div style={{ padding: '0 16px' }}>
          <h3 className="text-headline-sm" style={{ marginBottom: 12 }}>{hi ? 'हाल की डिलिवरी' : 'Recent Deliveries'}</h3>
          {[
            { date: 'Yesterday', item: 'Dal Makhani & Roti', kg: 15, meals: 30 },
            { date: '2 days ago', item: 'Mixed Vegetable Curry', kg: 22, meals: 44 },
          ].map((h, i) => (
            <div key={i} style={{ padding: '12px 0', borderBottom: i === 0 ? '1px solid var(--outline-variant)' : 'none', display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--surface-container)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <span className="material-symbols-outlined" style={{ fontSize: 18, color: 'var(--tertiary)', fontVariationSettings: "'FILL' 1" }}>check_circle</span>
              </div>
              <div style={{ flex: 1 }}>
                <span className="text-label-md" style={{ color: 'var(--on-surface)', fontWeight: 700, display: 'block' }}>{h.item}</span>
                <span className="text-body-sm" style={{ color: 'var(--on-surface-variant)' }}>{h.date} • {h.kg} kg • {h.meals} meals</span>
              </div>
            </div>
          ))}
        </div>
      </main>

      {/* Unverified Modal */}
      {showUnverifiedModal && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 1000,
          background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20
        }}>
          <div style={{
            background: 'var(--surface-container-lowest)',
            borderRadius: 24, padding: 24, maxWidth: 440, width: '100%',
            boxShadow: 'var(--shadow-elevated)', animation: 'scaleUp 200ms ease'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
              <div style={{
                width: 48, height: 48, borderRadius: 14,
                background: verState === 'needs_changes' ? 'rgba(183,18,42,0.1)' : 'rgba(252,128,25,0.12)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: verState === 'needs_changes' ? 'var(--urgent)' : 'var(--primary)'
              }}>
                <span className="material-symbols-outlined" style={{ fontSize: 28 }}>
                  {verState === 'needs_changes' ? 'security_update_warning' : 'admin_panel_settings'}
                </span>
              </div>
              <div>
                <h3 className="text-headline-sm" style={{ margin: 0 }}>
                  {verState === 'needs_changes' ? 'Verification Action Required' : 'Shelter Verification Required'}
                </h3>
                <span className="text-body-sm" style={{ color: 'var(--on-surface-variant)' }}>
                  State Safety & NGO Compliance
                </span>
              </div>
            </div>

            <p className="text-body-md" style={{ color: 'var(--on-surface-variant)', lineHeight: 1.5, margin: '0 0 16px' }}>
              {verState === 'needs_changes'
                ? `The District Operations Desk requires changes on Asha Nilayam's compliance dossier: "${verCase?.decision_reason || 'Document revision required'}". Please update your files in the portal.`
                : 'To ensure beneficiary food safety, institutional shelters must have an approved registration, hygiene clearance, and NGO Darpan verification before accepting surplus meals.'}
            </p>

            <div style={{ background: 'var(--surface-container-low)', borderRadius: 14, padding: 12, marginBottom: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <span className="text-label-sm" style={{ color: 'var(--on-surface-variant)' }}>Current Stage</span>
                <span className="text-label-sm" style={{ fontWeight: 800, color: 'var(--primary-dark)', textTransform: 'capitalize' }}>
                  {verState?.replace('_', ' ') || 'Pending Review'}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span className="text-label-sm" style={{ color: 'var(--on-surface-variant)' }}>SLA Time</span>
                <span className="text-label-sm" style={{ fontWeight: 700, color: 'var(--on-surface)' }}>Within 4 Hours</span>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <button
                onClick={() => { setShowUnverifiedModal(false); navigate('/verification'); }}
                className="btn-primary"
                style={{ height: 48, fontSize: 14, justifyContent: 'center' }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 20 }}>badge</span>
                <span>Open Verification Portal</span>
              </button>

              <button
                onClick={() => { setShowUnverifiedModal(false); navigate('/admin/verification'); }}
                style={{
                  height: 48, borderRadius: 14, border: '1px solid var(--outline-variant)',
                  background: 'var(--surface-container-lowest)', color: 'var(--on-surface)',
                  fontSize: 14, fontWeight: 700, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 20 }}>admin_panel_settings</span>
                <span>Review in Admin Desk</span>
              </button>

              <button
                onClick={handleInstantApproveDemo}
                style={{
                  height: 44, borderRadius: 14, border: 'none',
                  background: 'rgba(0,110,22,0.12)', color: 'var(--tertiary)',
                  fontSize: 13, fontWeight: 800, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 18 }}>bolt</span>
                <span>⚡ Instant Admin Approval (Demo Override)</span>
              </button>

              <button
                onClick={() => setShowUnverifiedModal(false)}
                style={{
                  height: 38, border: 'none', background: 'transparent',
                  color: 'var(--on-surface-variant)', fontSize: 13, fontWeight: 600, cursor: 'pointer'
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <BottomNav />
    </div>
  );
}
