import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { TopBar, BottomNav } from '../../components/Navigation';

export default function DriverTasks() {
  const navigate = useNavigate();
  const { donations, driverPickup, driverDeliver, showToast } = useApp();
  const [tab, setTab] = useState('active'); // active | available
  const [otpInput, setOtpInput] = useState('');
  const [showOtpModal, setShowOtpModal] = useState(null);

  // Active tasks for this driver: matched or picked_up
  const activeTasks = donations.filter(d => ['matched', 'picked_up'].includes(d.status) && (d.driver_id === 1 || !d.driver_id));
  // Available jobs (e.g. status === 'posted' or unassigned)
  const availableTasks = donations.filter(d => d.status === 'posted');

  const handleDeliverWithOtp = (donationId) => {
    if (otpInput.trim().length < 4) {
      showToast('Please enter the 4-digit shelter intake OTP', 'warning');
      return;
    }
    driverDeliver(donationId, otpInput);
    setShowOtpModal(null);
    setOtpInput('');
  };

  return (
    <div style={{ minHeight: '100dvh', background: 'var(--surface)', display: 'flex', flexDirection: 'column' }}>
      <TopBar title="Rescue Tasks" subtitle="Surplus-to-Shelter" />

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
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>two_wheeler</span>
            <span>My Active Tasks ({activeTasks.length})</span>
          </button>
          <button
            onClick={() => setTab('available')}
            style={{
              flex: 1, padding: '10px 14px', borderRadius: 14, border: 'none', cursor: 'pointer',
              fontWeight: 800, fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              background: tab === 'available' ? 'var(--primary)' : 'var(--surface-container)',
              color: tab === 'available' ? 'white' : 'var(--on-surface-variant)',
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>explore</span>
            <span>Nearby Pool ({availableTasks.length})</span>
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: 14 }}>
          {tab === 'active' ? (
            activeTasks.length === 0 ? (
              <div style={{
                background: 'var(--surface-container-lowest)', borderRadius: 20, padding: 36,
                textAlign: 'center', boxShadow: 'var(--shadow-card)',
              }}>
                <span className="material-symbols-outlined" style={{ fontSize: 48, color: 'var(--tertiary)' }}>check_circle</span>
                <h3 className="text-headline-sm" style={{ margin: '12px 0 6px' }}>No active deliveries</h3>
                <p className="text-body-sm" style={{ color: 'var(--on-surface-variant)', margin: '0 0 16px' }}>
                  You have completed all assigned food rescues. You are online and ready for new alerts.
                </p>
                <button className="btn-secondary" onClick={() => setTab('available')}>
                  View Nearby Food Rescue Pool
                </button>
              </div>
            ) : (
              activeTasks.map(task => {
                const isPickedUp = task.status === 'picked_up';
                return (
                  <div
                    key={task.id}
                    style={{
                      background: 'var(--surface-container-lowest)', borderRadius: 20, padding: 18,
                      boxShadow: 'var(--shadow-card)', border: '2px solid rgba(252,128,25,0.3)',
                      display: 'flex', flexDirection: 'column', gap: 14,
                    }}
                  >
                    {/* Status ribbon */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{
                        padding: '4px 10px', borderRadius: 999,
                        background: isPickedUp ? 'rgba(0,110,22,0.12)' : 'rgba(252,128,25,0.12)',
                        color: isPickedUp ? 'var(--tertiary)' : 'var(--primary-dark)',
                        fontSize: 11, fontWeight: 800, textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: 4
                      }}>
                        <span style={{ width: 8, height: 8, borderRadius: '50%', background: isPickedUp ? 'var(--tertiary)' : 'var(--primary)' }} />
                        {isPickedUp ? 'In Transit to Shelter' : 'Assigned: Go to Pickup'}
                      </span>

                      <span className="text-label-sm" style={{ color: 'var(--secondary)', fontWeight: 800 }}>
                        ⏱ 2h 45m safe window
                      </span>
                    </div>

                    {/* Food info */}
                    <div>
                      <h3 className="text-headline-sm" style={{ margin: 0 }}>{task.description}</h3>
                      <div className="text-body-sm" style={{ color: 'var(--on-surface-variant)', marginTop: 2 }}>
                        Feeds {task.est_meals || Math.round((task.qty_kg || 0) * 2)} people • Sealed Food-grade Containers
                      </div>
                    </div>

                    {/* Route Timeline */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, background: 'var(--surface-container-low)', padding: 12, borderRadius: 14 }}>
                      {/* Step 1: Pickup */}
                      <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                        <div style={{ width: 24, height: 24, borderRadius: '50%', background: isPickedUp ? 'var(--tertiary)' : 'var(--primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 800, flexShrink: 0 }}>
                          {isPickedUp ? '✓' : '1'}
                        </div>
                        <div style={{ flex: 1 }}>
                          <div className="text-label-md" style={{ fontWeight: 800 }}>PICKUP: {task.donor_name}</div>
                          <div className="text-body-sm" style={{ color: 'var(--on-surface-variant)' }}>Talwandi, Kota • Contact: +91 98760 11111</div>
                        </div>
                      </div>

                      <div style={{ width: 2, height: 16, background: 'var(--outline-variant)', marginLeft: 11 }} />

                      {/* Step 2: Dropoff */}
                      <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                        <div style={{ width: 24, height: 24, borderRadius: '50%', background: 'var(--tertiary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 800, flexShrink: 0 }}>
                          2
                        </div>
                        <div style={{ flex: 1 }}>
                          <div className="text-label-md" style={{ fontWeight: 800 }}>DROPOFF: Asha Nilayam Old Age Home</div>
                          <div className="text-body-sm" style={{ color: 'var(--on-surface-variant)' }}>Behind Bus Stand, Kota • Contact: Sister Mary</div>
                        </div>
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button
                        onClick={() => {
                          const url = `https://www.google.com/maps/dir/?api=1&origin=25.2138,75.8648&destination=25.2065,75.8580`;
                          window.open(url, '_blank');
                        }}
                        style={{
                          height: 46, padding: '0 14px', borderRadius: 12, border: '1px solid var(--outline-variant)',
                          background: 'white', color: 'var(--primary-dark)', fontWeight: 700, fontSize: 13,
                          display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer'
                        }}
                      >
                        <span className="material-symbols-outlined" style={{ fontSize: 18 }}>navigation</span>
                        <span>Open Maps</span>
                      </button>

                      {!isPickedUp ? (
                        <button
                          onClick={() => driverPickup(task.id, 'Verified 4 sealed containers, hot')}
                          style={{
                            flex: 1, height: 46, borderRadius: 12, border: 'none',
                            background: 'var(--primary)', color: 'white', fontWeight: 800, fontSize: 13,
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, cursor: 'pointer'
                          }}
                        >
                          <span className="material-symbols-outlined" style={{ fontSize: 18 }}>restaurant</span>
                          <span>Confirm Pickup</span>
                        </button>
                      ) : (
                        <button
                          onClick={() => setShowOtpModal(task.id)}
                          style={{
                            flex: 1, height: 46, borderRadius: 12, border: 'none',
                            background: 'var(--tertiary)', color: 'white', fontWeight: 800, fontSize: 13,
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, cursor: 'pointer',
                            boxShadow: '0 4px 12px rgba(0,110,22,0.3)'
                          }}
                        >
                          <span className="material-symbols-outlined" style={{ fontSize: 18 }}>check_circle</span>
                          <span>Deliver & Verify OTP</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )
          ) : (
            // Nearby pool
            availableTasks.map(task => (
              <div
                key={task.id}
                style={{
                  background: 'var(--surface-container-lowest)', borderRadius: 18, padding: 16,
                  boxShadow: 'var(--shadow-card)', display: 'flex', flexDirection: 'column', gap: 10
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <h4 className="text-headline-sm" style={{ margin: 0, fontSize: 16 }}>{task.description}</h4>
                    <div className="text-body-sm" style={{ color: 'var(--on-surface-variant)' }}>
                      From {task.donor_name} • Feeds {task.est_meals || Math.round((task.qty_kg || 0) * 2)} people
                    </div>
                  </div>
                  <span style={{ padding: '3px 8px', borderRadius: 999, background: 'rgba(252,128,25,0.1)', color: 'var(--primary-dark)', fontSize: 11, fontWeight: 700 }}>
                    ~2.2 km away
                  </span>
                </div>

                <button
                  onClick={() => {
                    driverPickup(task.id, 'Self-accepted volunteer pickup');
                    showToast('Assigned to your route! Head to donor location.', 'rocket_launch');
                    setTab('active');
                  }}
                  className="btn-primary"
                  style={{ width: '100%' }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 18 }}>volunteer_activism</span>
                  <span>Volunteer for this Rescue</span>
                </button>
              </div>
            ))
          )}
        </div>

        {/* Delivery OTP Modal */}
        {showOtpModal && (
          <div style={{
            position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(0,0,0,0.5)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20
          }}>
            <div style={{
              background: 'white', borderRadius: 24, padding: 24, maxWidth: 360, width: '100%',
              display: 'flex', flexDirection: 'column', gap: 16, boxShadow: 'var(--shadow-elevated)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 className="text-headline-sm" style={{ margin: 0 }}>Verify Shelter Delivery</h3>
                <button onClick={() => setShowOtpModal(null)} style={{ border: 'none', background: 'none', cursor: 'pointer' }}>
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>

              <p className="text-body-sm" style={{ color: 'var(--on-surface-variant)', margin: 0 }}>
                Ask the shelter in-charge for their 4-digit intake OTP (Demo code: <strong>8492</strong>) to finalize delivery.
              </p>

              <input
                type="text"
                placeholder="Enter 4-digit OTP"
                maxLength={4}
                value={otpInput}
                onChange={e => setOtpInput(e.target.value)}
                style={{
                  height: 52, borderRadius: 14, border: '2px solid var(--primary)',
                  textAlign: 'center', fontSize: 24, fontWeight: 800, letterSpacing: 8, outline: 'none'
                }}
              />

              <div style={{ display: 'flex', gap: 10 }}>
                <button
                  onClick={() => setOtpInput('8492')}
                  style={{ padding: '8px 12px', borderRadius: 10, border: 'none', background: 'var(--surface-container)', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}
                >
                  Fill Demo OTP (8492)
                </button>
                <button
                  onClick={() => handleDeliverWithOtp(showOtpModal)}
                  className="btn-primary"
                  style={{ flex: 1 }}
                >
                  Verify & Complete
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
