import { useState, useRef, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { TopBar, BottomNav } from '../../components/Navigation';
import { CountdownBadge } from '../../components/CountdownRing';
import MapView from '../../components/MapView';
import { RECIPIENTS, DONORS, DRIVERS } from '../../data/seed';

export default function DriverHome() {
  const { user, donations, donors, recipients, drivers, driverAcceptMission, driverPickup, driverDeliver, showToast } = useApp();
  const [online, setOnline] = useState(true);

  const donorDirectory = donors?.length ? donors : DONORS;
  const recipientDirectory = recipients?.length ? recipients : RECIPIENTS;
  const driverDirectory = drivers?.length ? drivers : DRIVERS;

  // Pending missions awaiting driver acceptance (shelter confirmed!)
  const pendingMission = donations.find(d => d.status === 'shelter_accepted' && !d.driver_id) || null;
  const pendingDonor = donorDirectory.find(d => d.id === pendingMission?.donor_id) || donorDirectory[0];
  const pendingShelter = recipientDirectory.find(r => r.id === pendingMission?.matched_recipient_id) || recipientDirectory[0];

  // Live active job from AppContext — only real matched/picked_up donations
  const activeDonation = donations.find(d => ['matched', 'picked_up'].includes(d.status) && (d.driver_id === (user?.id || 1) || !d.driver_id)) || null;
  const activeDonor = donorDirectory.find(d => d.id === activeDonation?.donor_id) || donorDirectory[0];
  const activeShelter = recipientDirectory.find(r => r.id === activeDonation?.matched_recipient_id) || recipientDirectory[0];
  const activeRider = driverDirectory.find(d => d.id === activeDonation?.driver_id) || driverDirectory[0];
  const targetId = activeDonation?.id || null;
  const currentStatus = activeDonation?.status === 'picked_up' ? 'picked_up' : activeDonation?.status === 'delivered' ? 'delivered' : 'assigned';

  // Construct job object safely — null when no real active donation
  const job = activeDonation ? {
    id: activeDonation.id,
    donation: activeDonation,
    pickup: (activeDonation.donor_name || 'Donor') + ', Kota',
    dropoff: (activeShelter?.name || 'Shelter') + ', Kota',
    distanceKm: 2.4,
    qty_kg: activeDonation.qty_kg || 0,
    cold_chain: activeDonation.needs_cold_chain || false,
    expires_at: activeDonation.expires_at || new Date(Date.now() + 6300000).toISOString(),
    est_earnings: '₹' + Math.round((activeDonation.qty_kg || 10) * 6),
    status: activeDonation.status,
  } : null;

  const [jobStatus, setJobStatus] = useState(currentStatus);
  const [swipeProgress, setSwipeProgress] = useState(0);
  const isDragging = useRef(false);
  const startX = useRef(0);

  useEffect(() => {
    if (activeDonation) {
      setJobStatus(activeDonation.status === 'picked_up' ? 'picked_up' : activeDonation.status === 'delivered' ? 'delivered' : 'assigned');
    }
  }, [activeDonation?.status]);

  const handleSwipeStart = (e) => {
    isDragging.current = true;
    startX.current = e.touches?.[0]?.clientX ?? e.clientX;
  };

  const handleSwipeMove = (e) => {
    if (!isDragging.current) return;
    const x = e.touches?.[0]?.clientX ?? e.clientX;
    const delta = Math.max(0, Math.min(x - startX.current, 240));
    setSwipeProgress(delta);
  };

  const handleSwipeEnd = () => {
    if (!isDragging.current) return;
    isDragging.current = false;
    if (swipeProgress > 180 && targetId) {
      if (jobStatus === 'assigned') {
        driverPickup(targetId, `Picked up by rider ${user?.name || 'Volunteer'}`);
        setJobStatus('picked_up');
      } else if (jobStatus === 'picked_up') {
        driverDeliver(targetId, activeDonation?.delivery_otp || '8492');
        setJobStatus('delivered');
      }
    }
    setSwipeProgress(0);
  };

  const swipeLabel = jobStatus === 'assigned' ? 'Swipe to confirm Picked Up →' : jobStatus === 'picked_up' ? 'Swipe to confirm Delivered →' : 'Delivered ✓';
  const swipeDone = jobStatus === 'delivered';

  return (
    <div style={{ minHeight: '100dvh', background: 'var(--surface)', display: 'flex', flexDirection: 'column' }}>
      <TopBar title="Rider Dashboard" subtitle="Surplus-to-Shelter" />

      <main style={{ flex: 1, paddingTop: 64, paddingBottom: 96, overflowY: 'auto' }}>
        {/* Online / Offline toggle */}
        <div style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ width: 10, height: 10, borderRadius: '50%', background: online ? 'var(--tertiary)' : 'var(--outline)', animation: online ? 'pulse 2s ease-in-out infinite' : 'none', display: 'block', flexShrink: 0 }} />
              <span className="text-headline-sm">{online ? 'Online' : 'Offline'}</span>
            </div>
            <span className="text-body-sm" style={{ color: 'var(--on-surface-variant)' }}>
              {online ? 'Receiving rescue jobs' : 'Tap to go online'}
            </span>
          </div>
          <button
            role="switch"
            aria-checked={online}
            onClick={() => { setOnline(!online); showToast(online ? 'Offline — no new jobs' : 'Online — ready for rescue jobs!', online ? 'offline_bolt' : 'online_prediction'); }}
            style={{
              width: 64, height: 34, borderRadius: 17, border: 'none', cursor: 'pointer',
              background: online ? 'var(--tertiary)' : 'var(--surface-container)',
              position: 'relative', transition: 'background 250ms',
            }}
          >
            <div style={{
              position: 'absolute', top: 3, left: online ? 33 : 3, width: 28, height: 28,
              borderRadius: '50%', background: 'white', transition: 'left 250ms cubic-bezier(0.23,1,0.32,1)',
              boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <span className="material-symbols-outlined" style={{ fontSize: 16, color: online ? 'var(--tertiary)' : 'var(--on-surface-variant)', fontVariationSettings: "'FILL' 1" }}>
                {online ? 'check' : 'close'}
              </span>
            </div>
          </button>
        </div>

        {/* Incoming Mission Alert Banner */}
        {online && pendingMission && (
          <div style={{
            margin: '0 16px 16px', borderRadius: 20, padding: 18,
            background: 'linear-gradient(135deg, rgba(0,110,22,0.1), rgba(88,182,84,0.08))',
            border: '2px solid rgba(0,110,22,0.3)', boxShadow: '0 4px 16px rgba(0,110,22,0.15)',
            display: 'flex', flexDirection: 'column', gap: 12
          }} className="animate-fade-in-up">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span className="material-symbols-outlined" style={{ fontSize: 22, color: 'var(--tertiary)', animation: 'pulse 1.2s infinite' }}>
                  notification_important
                </span>
                <span style={{ fontWeight: 800, fontSize: 13, color: 'var(--tertiary)', textTransform: 'uppercase' }}>
                  New Rescue Mission Available!
                </span>
              </div>
              <span style={{ fontSize: 11, fontWeight: 800, padding: '2px 8px', borderRadius: 999, background: 'white', color: 'var(--tertiary)' }}>
                SHELTER READY
              </span>
            </div>

            <div>
              <h3 className="text-headline-sm" style={{ margin: '0 0 2px' }}>{pendingMission.description}</h3>
              <p className="text-body-sm" style={{ color: 'var(--on-surface-variant)', margin: 0 }}>
                {pendingMission.qty_kg} kg • Feeds {pendingMission.est_meals || Math.round((pendingMission.qty_kg || 0) * 2)} people
              </p>
            </div>

            <div style={{ background: 'white', padding: '10px 12px', borderRadius: 12, display: 'flex', flexDirection: 'column', gap: 6, fontSize: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span className="material-symbols-outlined" style={{ fontSize: 16, color: 'var(--primary)' }}>storefront</span>
                <span>Pickup: <strong>{pendingDonor?.name || pendingMission.donor_name}</strong></span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span className="material-symbols-outlined" style={{ fontSize: 16, color: 'var(--tertiary)' }}>volunteer_activism</span>
                <span>Dropoff: <strong>{pendingShelter?.name || 'Shelter'}</strong></span>
              </div>
            </div>

            <button
              onClick={() => {
                driverAcceptMission(pendingMission.id, user?.id || 1);
                showToast(`Mission accepted! Heading to ${pendingDonor?.name || 'kitchen'} for pickup.`, 'two_wheeler');
              }}
              className="btn-primary"
              style={{ width: '100%', height: 46, fontSize: 14, gap: 6 }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 20 }}>check_circle</span>
              <span>Accept Rescue Mission</span>
            </button>
          </div>
        )}

        {/* Stats bar */}
        <div style={{ margin: '0 16px 16px', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
          {[
            { label: "Today's Rescues", value: '3', icon: 'volunteer_activism' },
            { label: 'Meals Delivered', value: '142', icon: 'restaurant' },
            { label: 'kg Saved', value: '71', icon: 'eco' },
          ].map(s => (
            <div key={s.label} style={{ padding: '10px 8px', borderRadius: 14, background: 'var(--surface-container-lowest)', boxShadow: 'var(--shadow-card)', textAlign: 'center' }}>
              <span className="material-symbols-outlined" style={{ fontSize: 18, color: 'var(--primary-dark)', fontVariationSettings: "'FILL' 1" }}>{s.icon}</span>
              <div className="text-headline-sm" style={{ fontWeight: 700 }}>{s.value}</div>
              <div className="text-label-sm" style={{ color: 'var(--on-surface-variant)', textTransform: 'none', lineHeight: 1.3 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Active job card */}
        {online && job && jobStatus !== 'delivered' && (
          <div className="card animate-fade-in-up" style={{ margin: '0 16px 16px', overflow: 'visible' }}>
            {/* Job header */}
            <div style={{ padding: '14px 16px', background: 'linear-gradient(135deg, rgba(252,128,25,0.08), rgba(255,154,61,0.04))', borderRadius: '20px 20px 0 0' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ padding: '2px 8px', borderRadius: 999, background: 'rgba(252,128,25,0.12)', color: 'var(--primary-dark)', fontSize: 10, fontWeight: 700 }}>
                  {jobStatus === 'assigned' ? '● NEW JOB ASSIGNED' : '● IN TRANSIT'}
                </span>
                <CountdownBadge expiresAt={job.expires_at} />
              </div>
              <h3 className="text-headline-sm" style={{ margin: '4px 0 2px' }}>{job.donation.description}</h3>
              <p className="text-body-sm" style={{ color: 'var(--on-surface-variant)', margin: 0 }}>
                {job.donation.est_meals || Math.round((job.qty_kg || 0) * 2)} people to feed
                {job.cold_chain && <span style={{ marginLeft: 8, color: '#2F80ED' }}>❄ Cold chain</span>}
              </p>
            </div>

            <div style={{ padding: '0 16px 14px' }}>
              <MapView
                mode={jobStatus === 'picked_up' ? 'route' : 'pickup'}
                routePhase={jobStatus === 'picked_up' ? 'delivery' : 'pickup'}
                height="160px"
                pickupLat={activeDonor?.lat}
                pickupLng={activeDonor?.lng}
                dropLat={activeShelter?.lat}
                dropLng={activeShelter?.lng}
                originLat={jobStatus === 'picked_up' ? activeDonor?.lat : activeRider?.lat}
                originLng={jobStatus === 'picked_up' ? activeDonor?.lng : activeRider?.lng}
                destinationLat={jobStatus === 'picked_up' ? activeShelter?.lat : activeDonor?.lat}
                destinationLng={jobStatus === 'picked_up' ? activeShelter?.lng : activeDonor?.lng}
                riderLat={jobStatus === 'picked_up' ? undefined : activeRider?.lat}
                riderLng={jobStatus === 'picked_up' ? undefined : activeRider?.lng}
                progress={jobStatus === 'picked_up' ? 0.65 : 0}
                showRoute
                ariaLabel={jobStatus === 'picked_up' ? 'Rider delivery route' : 'Rider route to pickup'}
              />
            </div>

            {/* Route */}
            <div style={{ padding: '14px 16px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                {[
                  { icon: 'radio_button_checked', label: job.pickup, color: 'var(--primary-container)', sub: '📍 Pickup point' },
                  { icon: 'south', label: '', color: 'var(--outline-variant)', sub: null, connector: true },
                  { icon: 'location_on', label: job.dropoff, color: 'var(--tertiary)', sub: '📍 Drop-off point' },
                ].map((r, i) => (
                  r.connector
                    ? <div key={i} style={{ width: 2, height: 20, background: 'var(--surface-container)', marginLeft: 11 }} />
                    : (
                      <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                        <span className="material-symbols-outlined" style={{ fontSize: 22, color: r.color, flexShrink: 0, fontVariationSettings: "'FILL' 1" }}>{r.icon}</span>
                        <div>
                          <span className="text-label-md" style={{ color: 'var(--on-surface)', fontWeight: 600, display: 'block' }}>{r.label}</span>
                          <span className="text-body-sm" style={{ color: 'var(--on-surface-variant)' }}>{r.sub}</span>
                        </div>
                      </div>
                    )
                ))}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 12 }}>
                <div style={{ padding: '8px 12px', borderRadius: 12, background: 'var(--surface-container-low)', textAlign: 'center' }}>
                  <span className="text-label-sm" style={{ color: 'var(--on-surface-variant)', display: 'block' }}>Distance</span>
                  <span className="text-headline-sm" style={{ color: 'var(--on-surface)' }}>{job.distanceKm} km</span>
                </div>
                <div style={{ padding: '8px 12px', borderRadius: 12, background: 'var(--surface-container-low)', textAlign: 'center' }}>
                  <span className="text-label-sm" style={{ color: 'var(--on-surface-variant)', display: 'block' }}>Earnings</span>
                  <span className="text-headline-sm" style={{ color: 'var(--tertiary)', fontWeight: 700 }}>{job.est_earnings}</span>
                </div>
              </div>

              {/* Action buttons */}
              <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                <button style={{ flex: 1, height: 44, borderRadius: 12, background: 'var(--surface-container)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, fontSize: 13, fontWeight: 600 }}
                  onClick={() => showToast('Opening navigation…', 'navigation')}>
                  <span className="material-symbols-outlined" style={{ fontSize: 18, color: 'var(--primary-dark)' }}>navigation</span>
                  Navigate
                </button>
                <button style={{ flex: 1, height: 44, borderRadius: 12, background: 'var(--surface-container)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, fontSize: 13, fontWeight: 600 }}
                  onClick={() => showToast('Calling pickup point…', 'call')}>
                  <span className="material-symbols-outlined" style={{ fontSize: 18, color: 'var(--tertiary)' }}>call</span>
                  Call
                </button>
                <button style={{ flex: 1, height: 44, borderRadius: 12, background: 'var(--surface-container)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, fontSize: 13, fontWeight: 600 }}
                  onClick={() => showToast('Camera opened for proof photo', 'photo_camera')}>
                  <span className="material-symbols-outlined" style={{ fontSize: 18, color: '#2F80ED' }}>photo_camera</span>
                  Photo
                </button>
              </div>
            </div>

            {/* Swipe button */}
            <div style={{ padding: '0 16px 16px' }}>
              {!swipeDone ? (
                <>
                <div
                  className="swipe-btn"
                  onMouseDown={handleSwipeStart}
                  onMouseMove={handleSwipeMove}
                  onMouseUp={handleSwipeEnd}
                  onTouchStart={handleSwipeStart}
                  onTouchMove={handleSwipeMove}
                  onTouchEnd={handleSwipeEnd}
                  style={{ cursor: 'grab', background: swipeProgress > 200 ? 'rgba(0,110,22,0.1)' : 'var(--surface-container)' }}
                  aria-label={swipeLabel}
                >
                  <div
                    className="swipe-btn-thumb"
                    style={{ left: 4 + swipeProgress, transition: isDragging.current ? 'none' : 'left 300ms cubic-bezier(0.23,1,0.32,1)' }}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: 22, fontVariationSettings: "'FILL' 1" }}>
                      {jobStatus === 'assigned' ? 'restaurant_menu' : 'check_circle'}
                    </span>
                  </div>
                  <div className="swipe-btn-label" style={{ paddingLeft: 64, fontSize: 13, opacity: Math.max(0, 1 - swipeProgress / 100) }}>
                    {swipeLabel}
                    <span style={{ display: 'inline-flex', alignItems: 'center', marginLeft: 6 }}>
                      {[4, 7, 4].map((o, i) => (
                        <span key={i} style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--on-surface-variant)', opacity: 0.4 + i * 0.3, marginLeft: 3, animation: `swipe-hint 1.5s ${i * 0.2}s ease-in-out infinite` }} />
                      ))}
                    </span>
                  </div>
                </div>
                {/* Desktop 1-Click Fallback */}
                <div style={{ marginTop: 8, textAlign: 'center' }}>
                  <button
                    onClick={() => {
                      if (!targetId) return;
                      if (jobStatus === 'assigned') {
                        driverPickup(targetId, `Picked up by rider ${user?.name || 'Volunteer'}`);
                        setJobStatus('picked_up');
                      } else if (jobStatus === 'picked_up') {
                        driverDeliver(targetId, activeDonation?.delivery_otp || '8492');
                        setJobStatus('delivered');
                      }
                    }}
                    style={{
                      border: 'none', background: 'none', color: 'var(--primary-dark)',
                      fontSize: 12, fontWeight: 700, cursor: 'pointer', padding: '4px 8px'
                    }}
                  >
                    ⚡ Or Click Here to {jobStatus === 'assigned' ? 'Confirm Pick Up' : 'Confirm Delivery'}
                  </button>
                </div>
              </>
              ) : (
                <div style={{ height: 56, borderRadius: 28, background: 'rgba(0,110,22,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 22, color: 'var(--tertiary)', fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                  <span className="text-label-lg" style={{ color: 'var(--tertiary)', fontWeight: 700 }}>Delivered!</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Delivered state */}
        {jobStatus === 'delivered' && (
          <div style={{ margin: '0 16px', padding: 24, borderRadius: 20, background: 'rgba(0,110,22,0.06)', border: '1px solid rgba(0,110,22,0.15)', textAlign: 'center' }} className="animate-fade-in-up">
            <span className="material-symbols-outlined" style={{ fontSize: 48, color: 'var(--tertiary)', fontVariationSettings: "'FILL' 1", display: 'block', marginBottom: 12 }}>celebration</span>
            <h3 className="text-headline-md" style={{ color: 'var(--tertiary)', margin: '0 0 6px' }}>Rescue Complete!</h3>
            <p className="text-body-sm" style={{ color: 'var(--on-surface-variant)' }}>
              {job.donation.est_meals || Math.round((job.donation.qty_kg || 0) * 2)} people fed at shelter ✓
            </p>
            <div style={{ marginTop: 16, padding: '8px 16px', borderRadius: 12, background: 'var(--surface-container-lowest)', display: 'inline-block' }}>
              <span className="text-label-md" style={{ color: 'var(--on-surface)' }}>Earned: <strong style={{ color: 'var(--tertiary)' }}>{job.est_earnings}</strong></span>
            </div>
          </div>
        )}

        {/* Empty state */}
        {online && !job && jobStatus !== 'delivered' && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '60px 24px', textAlign: 'center', gap: 16 }}>
            <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'var(--surface-container)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span className="material-symbols-outlined" style={{ fontSize: 40, color: 'var(--on-surface-variant)', fontVariationSettings: "'FILL' 1" }}>two_wheeler</span>
            </div>
            <div>
              <h3 className="text-headline-sm" style={{ margin: '0 0 4px' }}>Ready for rescues</h3>
              <p className="text-body-sm" style={{ color: 'var(--on-surface-variant)' }}>Waiting for nearby donation matches. New jobs will appear here.</p>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              {[1,2,3].map(i => (
                <div key={i} style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--primary-container)', animation: `pulse ${1 + i * 0.3}s ease-in-out infinite` }} />
              ))}
            </div>
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  );
}
