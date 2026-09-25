import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { TopBar } from '../../components/Navigation';
import { CountdownBadge } from '../../components/CountdownRing';
import { RECIPIENTS, DRIVERS, DONORS } from '../../data/seed';
import MapView from '../../components/MapView';

const TIMELINE_STEPS = [
  { id: 'posted', label: 'Posted', icon: 'upload', sub: 'Donation submitted' },
  { id: 'shelter_accepted', label: 'Shelter Accepted', icon: 'volunteer_activism', sub: 'Recipient confirmed food' },
  { id: 'matched', label: 'Rider Assigned', icon: 'two_wheeler', sub: 'Volunteer rider dispatched' },
  { id: 'picked_up', label: 'Picked Up', icon: 'restaurant_menu', sub: 'Food collected' },
  { id: 'delivered', label: 'Delivered', icon: 'check_circle', sub: 'Delivery confirmed' },
];

export default function LiveTracking() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { donations, donors, recipients, drivers, driverAcceptMission } = useApp();
  const donation = donations.find(d => d.id === parseInt(id)) ?? donations[0];
  const donorDirectory = donors?.length ? donors : DONORS;
  const recipientDirectory = recipients?.length ? recipients : RECIPIENTS;
  const driverDirectory = drivers?.length ? drivers : DRIVERS;
  const recipient = recipientDirectory.find(r => r.id === donation?.matched_recipient_id) ?? recipientDirectory[0];
  const hasDriver = !!donation?.driver_id && donation?.status !== 'shelter_accepted';
  const driver = hasDriver ? (driverDirectory.find(d => d.id === donation?.driver_id) ?? driverDirectory[0]) : null;
  const donorEntity = donorDirectory.find(d => d.id === donation?.donor_id) ?? donorDirectory[0];

  const currentStatus = donation?.status || 'posted';
  const [showReceipt, setShowReceipt] = useState(currentStatus === 'delivered');

  useEffect(() => {
    if (currentStatus === 'delivered') {
      setShowReceipt(true);
    }
  }, [currentStatus]);

  const driverProgress =
    currentStatus === 'delivered' ? 1.0 :
    currentStatus === 'picked_up' ? 0.65 :
    currentStatus === 'matched' ? 0.25 : 0.05;

  const getActiveStepIndex = (status) => {
    if (status === 'delivered') return 4;
    if (status === 'picked_up') return 3;
    if (status === 'matched') return 2;
    if (status === 'shelter_accepted') return 1;
    return 0;
  };
  const activeIdx = getActiveStepIndex(currentStatus);

  // Real coordinates from seed data
  const pickupLat = donorEntity?.lat ?? 25.2138;
  const pickupLng = donorEntity?.lng ?? 75.8648;
  const dropLat = recipient?.lat ?? 25.2065;
  const dropLng = recipient?.lng ?? 75.8580;

  return (
    <div style={{ minHeight: '100dvh', background: 'var(--surface)', display: 'flex', flexDirection: 'column' }}>
      <TopBar title="Live Tracking" showBack />

      <main style={{ flex: 1, paddingTop: 64, paddingBottom: 40, overflowY: 'auto' }}>
        {/* Real Leaflet Map */}
        <div style={{ position: 'relative', height: 280, borderRadius: 0, overflow: 'hidden' }}>
          <MapView
            mode="route"
            height="280px"
            pickupLat={pickupLat}
            pickupLng={pickupLng}
            dropLat={dropLat}
            dropLng={dropLng}
            riderLat={donation?.rider_lat}
            riderLng={donation?.rider_lng}
            waypoints={donation?.route_waypoints || []}
            progress={driverProgress}
            showRoute={hasDriver}
          />

          {/* Glass overlay pill */}
          <div style={{
            position: 'absolute', bottom: 12, left: '50%', transform: 'translateX(-50%)', zIndex: 1000,
            background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(12px)',
            borderRadius: 999, padding: '8px 16px',
            display: 'flex', alignItems: 'center', gap: 8,
            boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
            whiteSpace: 'nowrap',
          }}>
            <span className="material-symbols-outlined" style={{ fontSize: 16, color: hasDriver ? '#2563eb' : '#0284c7', fontVariationSettings: "'FILL' 1" }}>
              {hasDriver ? 'two_wheeler' : 'hourglass_top'}
            </span>
            <span className="text-label-md" style={{ color: 'var(--on-surface)' }}>
              {hasDriver
                ? `${driver?.name} • ${currentStatus === 'delivered' ? 'Delivered! 🎉' : `ETA: ~${Math.round((1 - driverProgress) * 15)} min`}`
                : 'Awaiting Volunteer Rider acceptance…'
              }
            </span>
            <CountdownBadge expiresAt={donation?.expires_at ?? new Date(Date.now() + 7200000).toISOString()} />
          </div>
        </div>

        <div style={{ padding: '20px 16px', display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Status timeline */}
          <div className="card" style={{ padding: 20 }}>
            <h3 className="text-headline-sm" style={{ margin: '0 0 16px' }}>Rescue Timeline</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
              {TIMELINE_STEPS.map((step, i) => {
                const isDone = i <= activeIdx;
                const isActive = i === activeIdx;
                const isFuture = i > activeIdx;
                return (
                  <div key={step.id} style={{ display: 'flex', gap: 12, paddingBottom: i < TIMELINE_STEPS.length - 1 ? 20 : 0 }}>
                    {/* Line + dot */}
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: 32, flexShrink: 0 }}>
                      <div style={{
                        width: 32, height: 32, borderRadius: '50%',
                        background: isDone ? (isActive ? 'linear-gradient(135deg, var(--primary-container), #ff9a3d)' : 'var(--tertiary)') : 'var(--surface-container)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        boxShadow: isActive ? 'var(--shadow-primary)' : 'none',
                        animation: isActive ? 'glow-line 2s ease-in-out infinite' : 'none',
                        flexShrink: 0,
                      }}>
                        <span className="material-symbols-outlined" style={{ fontSize: 15, color: isDone ? 'white' : 'var(--on-surface-variant)', fontVariationSettings: "'FILL' 1" }}>
                          {step.icon}
                        </span>
                      </div>
                      {i < TIMELINE_STEPS.length - 1 && (
                        <div style={{
                          width: 2, flex: 1, minHeight: 20,
                          background: isDone && !isActive ? 'var(--tertiary)' : 'var(--surface-container)',
                          marginTop: 4,
                          transition: 'background 500ms',
                        }} />
                      )}
                    </div>
                    {/* Content */}
                    <div style={{ paddingTop: 4 }}>
                      <span className="text-label-lg" style={{ fontWeight: 700, color: isFuture ? 'var(--on-surface-variant)' : 'var(--on-surface)' }}>
                        {step.label}
                      </span>
                      <p className="text-body-sm" style={{ color: 'var(--on-surface-variant)', margin: '2px 0 0' }}>{step.sub}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Donation details */}
          <div className="card" style={{ padding: 16 }}>
            <div style={{ display: 'flex', gap: 12 }}>
              <div style={{ width: 72, height: 72, borderRadius: 12, background: 'var(--surface-container)', overflow: 'hidden', flexShrink: 0 }}>
                {donation?.photo_url
                  ? <img src={donation.photo_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <span className="material-symbols-outlined" style={{ fontSize: 28, color: 'var(--on-surface-variant)', fontVariationSettings: "'FILL' 1" }}>restaurant</span>
                    </div>
                }
              </div>
              <div style={{ flex: 1 }}>
                <h4 className="text-headline-sm" style={{ margin: '0 0 2px' }}>{donation?.description ?? 'Veg Biryani'}</h4>
                <p className="text-body-sm" style={{ color: 'var(--on-surface-variant)', margin: '0 0 6px' }}>Feeds {donation?.est_meals || Math.round((donation?.qty_kg || 0) * 2)} people</p>
                <p className="text-body-sm" style={{ color: 'var(--on-surface-variant)', margin: 0 }}>
                  → <strong style={{ color: 'var(--on-surface)' }}>{recipient?.name ?? 'Shelter'}</strong>
                </p>
              </div>
            </div>
          </div>

          {/* Driver card */}
          {hasDriver ? (
            <div className="card" style={{ padding: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 52, height: 52, borderRadius: '50%', background: 'var(--primary-fixed)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 26, color: 'var(--on-primary-fixed)', fontVariationSettings: "'FILL' 1" }}>two_wheeler</span>
                </div>
                <div style={{ flex: 1 }}>
                  <h4 className="text-label-lg" style={{ margin: '0 0 1px', fontWeight: 700 }}>{driver?.name}</h4>
                  <p className="text-body-sm" style={{ color: 'var(--on-surface-variant)', margin: 0 }}>
                    {driver?.vehicle} • ⭐ {driver?.rating}
                  </p>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--surface-container-low)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    aria-label="Call driver">
                    <span className="material-symbols-outlined" style={{ fontSize: 18, color: 'var(--tertiary)' }}>call</span>
                  </button>
                  <button style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--surface-container-low)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    aria-label="Message driver">
                    <span className="material-symbols-outlined" style={{ fontSize: 18, color: 'var(--primary-dark)' }}>chat</span>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="card" style={{ padding: 18, border: '1.5px dashed var(--primary)', background: 'rgba(252,128,25,0.03)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{
                  width: 46, height: 46, borderRadius: '50%',
                  background: 'rgba(252,128,25,0.12)', color: 'var(--primary)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                  animation: 'pulse 2s infinite'
                }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 24, fontVariationSettings: "'FILL' 1" }}>two_wheeler</span>
                </div>
                <div style={{ flex: 1 }}>
                  <h4 className="text-label-lg" style={{ margin: '0 0 2px', fontWeight: 700, color: 'var(--on-surface)' }}>
                    Awaiting Volunteer Rider Acceptance
                  </h4>
                  <p className="text-body-sm" style={{ color: 'var(--on-surface-variant)', margin: 0 }}>
                    Nearby volunteer riders in Kota have been alerted to accept this rescue trip.
                  </p>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 10, marginTop: 14 }}>
                <button
                  className="btn-primary"
                  style={{ flex: 1, height: 40, fontSize: 13, gap: 6 }}
                  onClick={() => driverAcceptMission && driverAcceptMission(donation.id, 1)}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 16 }}>check_circle</span>
                  Simulate Rider Accept
                </button>
                <button
                  className="btn-secondary"
                  style={{ height: 40, fontSize: 13, padding: '0 12px' }}
                  onClick={() => navigate('/driver/tasks')}
                >
                  View as Rider →
                </button>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Delivery celebration modal */}
      {showReceipt && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(22,27,45,0.6)', display: 'flex', alignItems: 'flex-end' }}>
          <div style={{ width: '100%', background: 'var(--surface-container-lowest)', borderRadius: '28px 28px 0 0', padding: '24px 20px 40px', textAlign: 'center' }} className="animate-fade-in-up">
            <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'rgba(0,110,22,0.1)', margin: '0 auto 16px', display: 'flex', alignItems: 'center', justifyContent: 'center', animation: 'float 3s ease-in-out infinite' }}>
              <span className="material-symbols-outlined" style={{ fontSize: 48, color: 'var(--tertiary)', fontVariationSettings: "'FILL' 1" }}>celebration</span>
            </div>
            <h2 className="text-headline-md" style={{ margin: '0 0 6px', color: 'var(--tertiary)' }}>Delivered!</h2>
            <p className="text-body-sm" style={{ color: 'var(--on-surface-variant)', margin: '0 0 20px' }}>
              {donation?.est_meals || Math.round((donation?.qty_kg || 0) * 2)} people fed from this rescue!<br />
              {donation?.est_meals} meals for {recipient?.name}
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 20 }}>
              {[
                { icon: 'restaurant', label: 'Meals', value: donation?.est_meals ?? 24 },
                { icon: 'group', label: 'people fed', value: donation?.est_meals || Math.round((donation?.qty_kg ?? 12) * 2) },
                { icon: 'eco', label: 'kg CO₂e saved', value: Math.round((donation?.qty_kg ?? 12) * 2.5) },
              ].map(s => (
                <div key={s.label} style={{ padding: '10px 8px', borderRadius: 14, background: 'var(--surface-container-low)', textAlign: 'center' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 20, color: 'var(--primary-dark)', fontVariationSettings: "'FILL' 1" }}>{s.icon}</span>
                  <div className="text-display-lg-mobile" style={{ fontSize: 20, color: 'var(--on-surface)', fontWeight: 700, lineHeight: 1.2 }}>{s.value}</div>
                  <div className="text-label-sm" style={{ color: 'var(--on-surface-variant)' }}>{s.label}</div>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button className="btn-primary" style={{ flex: 1 }} onClick={() => navigate('/donor/receipts')}>
                <span className="material-symbols-outlined" style={{ fontSize: 18 }}>receipt_long</span>
                Download Receipt
              </button>
              <button className="btn-secondary" style={{ height: 52 }} onClick={() => navigate('/donor')}>
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
