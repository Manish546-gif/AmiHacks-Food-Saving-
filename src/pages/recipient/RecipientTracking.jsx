import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { TopBar, TierBadge, VerifiedBadge } from '../../components/Navigation';
import { CountdownBadge } from '../../components/CountdownRing';
import { RECIPIENTS, DRIVERS, DONORS } from '../../data/seed';

const INTAKE_STEPS = [
  { id: 'matched', label: 'Offer Accepted', icon: 'volunteer_activism', desc: 'Shelter confirmed intake capacity' },
  { id: 'assigned', label: 'Rider Dispatched', icon: 'two_wheeler', desc: 'Volunteer rider en route to donor kitchen' },
  { id: 'picked_up', label: 'Food Picked Up', icon: 'takeout_dining', desc: 'Collected & sealed in insulated carriers' },
  { id: 'arriving', label: 'Arriving at Gate', icon: 'near_me', desc: 'Rider within 1 km of shelter' },
  { id: 'delivered', label: 'Intake Verified', icon: 'verified', desc: 'OTP verified & meals distributed' },
];

export default function RecipientTracking() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { donations, recipients, drivers, driverPickup, driverDeliver, showToast } = useApp();

  const targetId = parseInt(id, 10);
  const donation = donations.find(d => d.id === targetId) || donations[0];
  const recipient = (recipients || RECIPIENTS).find(r => r.id === donation?.matched_recipient_id) || (recipients || RECIPIENTS)[0];
  const driver = (drivers || DRIVERS).find(d => d.id === donation?.driver_id) || (drivers || DRIVERS)[0];
  const donor = DONORS.find(d => d.id === donation?.donor_id) || { name: donation?.donor_name || 'Verified Donor Kitchen', address: 'Talwandi, Kota' };

  const currentStatus = donation?.status || 'matched';
  const isDelivered = currentStatus === 'delivered';
  const isPickedUp = currentStatus === 'picked_up' || isDelivered;

  // Determine active step index
  let activeStepIndex = 0;
  if (currentStatus === 'matched') activeStepIndex = 1; // Rider dispatched
  else if (currentStatus === 'picked_up') activeStepIndex = 3; // Food picked up & arriving
  else if (currentStatus === 'delivered') activeStepIndex = 4; // Completed

  const [copiedOtp, setCopiedOtp] = useState(false);
  const [showCelebration, setShowCelebration] = useState(isDelivered);

  useEffect(() => {
    if (isDelivered) {
      setShowCelebration(true);
    }
  }, [isDelivered]);

  // Simulated progress along route
  const progressPercent =
    currentStatus === 'delivered' ? 100 :
    currentStatus === 'picked_up' ? 70 : 25;

  const etaMinutes =
    currentStatus === 'delivered' ? 0 :
    currentStatus === 'picked_up' ? 8 : 16;

  const handleCopyOtp = () => {
    const otp = donation?.delivery_otp || '8492';
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(otp);
    }
    setCopiedOtp(true);
    showToast(`Gate OTP ${otp} copied!`, 'content_copy');
    setTimeout(() => setCopiedOtp(false), 2000);
  };

  // Demo simulation controls for testing
  const handleSimulatePickup = () => {
    if (driverPickup && donation?.id) {
      driverPickup(donation.id);
      showToast('Rider picked up food from kitchen — now en route to shelter!', 'two_wheeler');
    }
  };

  const handleSimulateDelivery = () => {
    const otp = donation?.delivery_otp || '8492';
    if (driverDeliver && donation?.id) {
      driverDeliver(donation.id, otp);
      setShowCelebration(true);
      showToast('Delivery verified! Meals logged into shelter intake.', 'check_circle');
    }
  };

  const safeHours = Number(donation?.safe_hours || 4);
  const expiryTime = donation?.expires_at || new Date(Date.now() + safeHours * 3600000).toISOString();

  return (
    <div style={{ minHeight: '100dvh', background: 'var(--surface)', display: 'flex', flexDirection: 'column' }}>
      <TopBar
        title="Incoming Food Tracking"
        subtitle="Surplus-to-Shelter"
        showBack
        rightSlot={
          <div style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '4px 10px', borderRadius: 999,
            background: isDelivered ? 'rgba(0,110,22,0.1)' : 'rgba(252,128,25,0.12)',
            color: isDelivered ? 'var(--tertiary)' : 'var(--primary-dark)',
            fontSize: 11, fontWeight: 800, textTransform: 'uppercase'
          }}>
            <span style={{
              width: 8, height: 8, borderRadius: '50%',
              background: isDelivered ? 'var(--tertiary)' : 'var(--primary)',
              animation: isDelivered ? 'none' : 'pulse 1.5s infinite'
            }} />
            <span>{isDelivered ? 'Delivered' : isPickedUp ? 'En Route' : 'Assigned'}</span>
          </div>
        }
      />

      <main style={{ flex: 1, paddingTop: 64, paddingBottom: 80, overflowY: 'auto' }}>
        {/* Animated Map & Delivery Route Banner */}
        <div style={{
          position: 'relative', height: 230,
          background: 'linear-gradient(180deg, #1e293b 0%, #0f172a 100%)',
          overflow: 'hidden'
        }}>
          {/* Subtle grid pattern */}
          <div style={{
            position: 'absolute', inset: 0, opacity: 0.15,
            backgroundImage: 'radial-gradient(#ffffff 1px, transparent 1px)',
            backgroundSize: '20px 20px'
          }} />

          {/* SVG Map Path */}
          <svg width="100%" height="100%" style={{ position: 'absolute', inset: 0, zIndex: 2 }}>
            <defs>
              <linearGradient id="routeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#fc8019" />
                <stop offset="100%" stopColor="#006e16" />
              </linearGradient>
            </defs>

            {/* Connecting Route */}
            <path
              d="M 60 140 Q 180 60, 320 120 T 440 100"
              fill="none"
              stroke="rgba(255,255,255,0.2)"
              strokeWidth="4"
              strokeDasharray="6 6"
            />
            <path
              d="M 60 140 Q 180 60, 320 120 T 440 100"
              fill="none"
              stroke="url(#routeGradient)"
              strokeWidth="4"
              strokeDasharray="400"
              strokeDashoffset={400 - (progressPercent / 100) * 400}
              style={{ transition: 'stroke-dashoffset 1s ease' }}
            />

            {/* Donor Node */}
            <circle cx="60" cy="140" r="10" fill="#fc8019" />
            <circle cx="60" cy="140" r="16" fill="#fc8019" opacity="0.3" />
            <text x="60" y="170" textAnchor="middle" fill="#f8fafc" fontSize="11" fontWeight="700">Kitchen</text>

            {/* Shelter Gate Node */}
            <circle cx="440" cy="100" r="10" fill="#006e16" />
            <circle cx="440" cy="100" r="16" fill="#006e16" opacity="0.3" />
            <text x="440" y="130" textAnchor="middle" fill="#f8fafc" fontSize="11" fontWeight="700">Shelter Gate</text>
          </svg>

          {/* Live Floating Rider Badge */}
          <div style={{
            position: 'absolute',
            top: '50%',
            left: `${Math.min(85, Math.max(15, progressPercent))}%`,
            transform: 'translate(-50%, -60%)',
            zIndex: 10,
            transition: 'left 1s cubic-bezier(0.34, 1.56, 0.64, 1)'
          }}>
            <div style={{
              background: 'white', borderRadius: 999, padding: '6px 12px',
              boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
              display: 'flex', alignItems: 'center', gap: 6
            }}>
              <span className="material-symbols-outlined" style={{ fontSize: 20, color: '#fc8019', animation: isDelivered ? 'none' : 'bounce 1s infinite' }}>
                two_wheeler
              </span>
              <span style={{ fontSize: 12, fontWeight: 800, color: '#0f172a' }}>
                {isDelivered ? 'Arrived!' : `${etaMinutes}m ETA`}
              </span>
            </div>
          </div>

          {/* Bottom stats overlay */}
          <div style={{
            position: 'absolute', bottom: 10, left: 16, right: 16, zIndex: 10,
            background: 'rgba(15, 23, 42, 0.75)', backdropFilter: 'blur(10px)',
            borderRadius: 14, padding: '8px 14px',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            border: '1px solid rgba(255,255,255,0.1)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'white' }}>
              <span className="material-symbols-outlined" style={{ fontSize: 18, color: '#ff9a3d' }}>
                schedule
              </span>
              <span style={{ fontSize: 12, fontWeight: 700 }}>
                {isDelivered ? 'Intake Complete ✓' : `Estimated Arrival: ~${etaMinutes} mins`}
              </span>
            </div>
            <CountdownBadge expiresAt={expiryTime} />
          </div>
        </div>

        <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Gate Verification OTP Card */}
          <div style={{
            background: 'linear-gradient(135deg, rgba(0,110,22,0.08), rgba(252,128,25,0.06))',
            borderRadius: 20, padding: 18,
            border: '2px solid rgba(0,110,22,0.2)',
            boxShadow: 'var(--shadow-card)',
            display: 'flex', flexDirection: 'column', gap: 10
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span className="material-symbols-outlined" style={{ fontSize: 20, color: 'var(--tertiary)' }}>
                  vpn_key
                </span>
                <span className="text-label-md" style={{ fontWeight: 800, color: 'var(--tertiary-dark)' }}>
                  Gate Intake OTP
                </span>
              </div>
              <span style={{
                fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 999,
                background: 'rgba(0,110,22,0.1)', color: 'var(--tertiary)'
              }}>
                Security Check
              </span>
            </div>

            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              background: 'white', borderRadius: 14, padding: '12px 18px',
              border: '1px dashed rgba(0,110,22,0.3)'
            }}>
              <div>
                <span style={{ fontSize: 11, color: 'var(--on-surface-variant)', display: 'block', fontWeight: 600 }}>
                  Share with rider upon arrival
                </span>
                <span style={{
                  fontSize: 28, fontWeight: 900, letterSpacing: '0.25em',
                  color: 'var(--primary-dark)', fontFamily: 'monospace'
                }}>
                  {donation?.delivery_otp || '8492'}
                </span>
              </div>

              <button
                onClick={handleCopyOtp}
                style={{
                  height: 40, padding: '0 14px', borderRadius: 12, border: 'none',
                  background: copiedOtp ? 'var(--tertiary)' : 'var(--primary)',
                  color: 'white', fontWeight: 800, fontSize: 12, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: 6, transition: 'all 0.2s ease'
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
                  {copiedOtp ? 'check' : 'content_copy'}
                </span>
                <span>{copiedOtp ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
            <p style={{ margin: 0, fontSize: 11, color: 'var(--on-surface-variant)' }}>
              Verifies shelter receipt and updates the city surplus audit log.
            </p>
          </div>

          {/* Volunteer Rider Profile Card */}
          <div style={{
            background: 'var(--surface-container-lowest)', borderRadius: 20, padding: 16,
            boxShadow: 'var(--shadow-card)', display: 'flex', flexDirection: 'column', gap: 12
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span className="text-label-sm" style={{ color: 'var(--on-surface-variant)', fontWeight: 800, textTransform: 'uppercase' }}>
                Assigned Volunteer Rider
              </span>
              <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--tertiary)', display: 'flex', alignItems: 'center', gap: 4 }}>
                <span className="material-symbols-outlined" style={{ fontSize: 14 }}>verified</span>
                Verified Volunteer
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{
                width: 52, height: 52, borderRadius: 16,
                background: 'linear-gradient(135deg, var(--primary-fixed), #ff9a3d)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'white', flexShrink: 0
              }}>
                <span className="material-symbols-outlined" style={{ fontSize: 28 }}>two_wheeler</span>
              </div>

              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <h4 className="text-headline-sm" style={{ margin: 0, fontSize: 16 }}>{driver?.name || 'Rahul Kumar'}</h4>
                  <span style={{ fontSize: 12, fontWeight: 800, color: '#f59e0b' }}>
                    ★ {driver?.rating || '4.9'}
                  </span>
                </div>
                <p className="text-body-sm" style={{ color: 'var(--on-surface-variant)', margin: '2px 0 0' }}>
                  {driver?.vehicle || 'Hero Electric (RJ-20-EV-1042)'}
                </p>
              </div>

              {/* Quick Contacts */}
              <div style={{ display: 'flex', gap: 8 }}>
                <a
                  href={`tel:${driver?.phone || '+919876211111'}`}
                  style={{
                    width: 42, height: 42, borderRadius: 12,
                    background: 'rgba(0,110,22,0.1)', color: 'var(--tertiary)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    textDecoration: 'none'
                  }}
                  title="Call Driver"
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 20 }}>call</span>
                </a>
                <a
                  href={`sms:${driver?.phone || '+919876211111'}`}
                  style={{
                    width: 42, height: 42, borderRadius: 12,
                    background: 'rgba(252,128,25,0.1)', color: 'var(--primary)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    textDecoration: 'none'
                  }}
                  title="Message Driver"
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 20 }}>chat</span>
                </a>
              </div>
            </div>
          </div>

          {/* Rescue Timeline */}
          <div style={{
            background: 'var(--surface-container-lowest)', borderRadius: 20, padding: 18,
            boxShadow: 'var(--shadow-card)'
          }}>
            <h3 className="text-headline-sm" style={{ margin: '0 0 16px', fontSize: 16 }}>
              Rescue & Intake Timeline
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
              {INTAKE_STEPS.map((step, i) => {
                const isPassed = i <= activeStepIndex;
                const isCurrent = i === activeStepIndex;

                return (
                  <div key={step.id} style={{ display: 'flex', gap: 12, paddingBottom: i < INTAKE_STEPS.length - 1 ? 18 : 0 }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: 32, flexShrink: 0 }}>
                      <div style={{
                        width: 32, height: 32, borderRadius: '50%',
                        background: isPassed
                          ? (isCurrent ? 'linear-gradient(135deg, var(--primary), #ff9a3d)' : 'var(--tertiary)')
                          : 'var(--surface-container)',
                        color: isPassed ? 'white' : 'var(--on-surface-variant)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        boxShadow: isCurrent ? '0 0 12px rgba(252,128,25,0.4)' : 'none',
                        transition: 'all 0.3s ease'
                      }}>
                        <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
                          {step.icon}
                        </span>
                      </div>

                      {i < INTAKE_STEPS.length - 1 && (
                        <div style={{
                          width: 2, flex: 1, minHeight: 18,
                          background: isPassed && !isCurrent ? 'var(--tertiary)' : 'var(--surface-container)',
                          margin: '4px 0'
                        }} />
                      )}
                    </div>

                    <div style={{ paddingTop: 4 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span className="text-label-md" style={{
                          fontWeight: 800,
                          color: isPassed ? 'var(--on-surface)' : 'var(--on-surface-variant)'
                        }}>
                          {step.label}
                        </span>
                        {isCurrent && !isDelivered && (
                          <span style={{
                            padding: '1px 8px', borderRadius: 999,
                            background: 'rgba(252,128,25,0.12)', color: 'var(--primary-dark)',
                            fontSize: 10, fontWeight: 800
                          }}>
                            Current Stage
                          </span>
                        )}
                      </div>
                      <p className="text-body-sm" style={{ color: 'var(--on-surface-variant)', margin: '2px 0 0' }}>
                        {step.desc}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Food Details & Safety Card */}
          <div style={{
            background: 'var(--surface-container-lowest)', borderRadius: 20, padding: 16,
            boxShadow: 'var(--shadow-card)', display: 'flex', flexDirection: 'column', gap: 10
          }}>
            <span className="text-label-sm" style={{ color: 'var(--on-surface-variant)', fontWeight: 800, textTransform: 'uppercase' }}>
              Surplus Intake Information
            </span>

            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
              <div style={{
                width: 60, height: 60, borderRadius: 14, background: 'var(--primary-fixed)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--on-primary-fixed)',
                flexShrink: 0
              }}>
                <span className="material-symbols-outlined" style={{ fontSize: 32 }}>soup_kitchen</span>
              </div>
              <div style={{ flex: 1 }}>
                <h4 className="text-headline-sm" style={{ margin: 0, fontSize: 16 }}>{donation?.description || 'Surplus Meal Package'}</h4>
                <p className="text-body-sm" style={{ color: 'var(--on-surface-variant)', margin: '2px 0 0' }}>
                  From <strong>{donation?.donor_name || donor.name}</strong> • Talwandi
                </p>
                <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
                  <span style={{ padding: '1px 6px', borderRadius: 999, background: 'rgba(0,110,22,0.1)', color: 'var(--tertiary)', fontSize: 10, fontWeight: 800 }}>
                    Pure Veg ✓
                  </span>
                  <span style={{ padding: '1px 6px', borderRadius: 999, background: 'var(--surface-container)', color: 'var(--on-surface-variant)', fontSize: 10, fontWeight: 700 }}>
                    {donation?.qty_kg || 25} kg • {donation?.est_meals || 50} Meals
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Demo Controls for easy presentation/testing */}
          <div style={{
            background: 'var(--surface-container-low)', borderRadius: 16, padding: 14,
            display: 'flex', flexDirection: 'column', gap: 8
          }}>
            <span className="text-label-sm" style={{ color: 'var(--on-surface-variant)', fontWeight: 800 }}>
              Live Demo Testing Controls:
            </span>
            <div style={{ display: 'flex', gap: 8 }}>
              {currentStatus === 'matched' && (
                <button
                  onClick={handleSimulatePickup}
                  style={{
                    flex: 1, padding: '10px 12px', borderRadius: 12, border: 'none',
                    background: 'var(--primary)', color: 'white', fontWeight: 800, fontSize: 12,
                    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6
                  }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 16 }}>takeout_dining</span>
                  Simulate Rider Pickup
                </button>
              )}
              {currentStatus === 'picked_up' && (
                <button
                  onClick={handleSimulateDelivery}
                  style={{
                    flex: 1, padding: '10px 12px', borderRadius: 12, border: 'none',
                    background: 'var(--tertiary)', color: 'white', fontWeight: 800, fontSize: 12,
                    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6
                  }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 16 }}>verified</span>
                  Simulate Delivery & Verify OTP
                </button>
              )}
              {isDelivered && (
                <div style={{ fontSize: 12, color: 'var(--tertiary)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 18 }}>check_circle</span>
                  Intake completed & verified with OTP.
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Delivery Verified Celebration Modal */}
      {showCelebration && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 100,
          background: 'rgba(15,23,42,0.65)', backdropFilter: 'blur(6px)',
          display: 'flex', alignItems: 'flex-end', justifyContent: 'center'
        }}>
          <div style={{
            width: '100%', maxWidth: 520, background: 'var(--surface-container-lowest)',
            borderRadius: '28px 28px 0 0', padding: '24px 20px 36px', textAlign: 'center',
            boxShadow: '0 -10px 40px rgba(0,0,0,0.3)'
          }}>
            <div style={{
              width: 72, height: 72, borderRadius: '50%',
              background: 'rgba(0,110,22,0.1)', margin: '0 auto 14px',
              display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--tertiary)'
            }}>
              <span className="material-symbols-outlined" style={{ fontSize: 42 }}>
                celebration
              </span>
            </div>

            <h2 className="text-headline-md" style={{ margin: '0 0 6px', color: 'var(--tertiary)' }}>
              Intake Completed & Audited!
            </h2>
            <p className="text-body-sm" style={{ color: 'var(--on-surface-variant)', margin: '0 0 20px' }}>
              <strong>{donation?.description}</strong> has arrived at {recipient.name}.<br />
              {donation?.est_meals || 50} wholesome meals ready for dinner distribution tonight.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 20 }}>
              <div style={{ background: 'var(--surface-container-low)', padding: 10, borderRadius: 14 }}>
                <span className="material-symbols-outlined" style={{ fontSize: 18, color: 'var(--tertiary)' }}>restaurant</span>
                <div style={{ fontSize: 18, fontWeight: 900 }}>{donation?.est_meals || 50}</div>
                <div style={{ fontSize: 10, color: 'var(--on-surface-variant)' }}>Meals Fed</div>
              </div>
              <div style={{ background: 'var(--surface-container-low)', padding: 10, borderRadius: 14 }}>
                <span className="material-symbols-outlined" style={{ fontSize: 18, color: 'var(--primary)' }}>scale</span>
                <div style={{ fontSize: 18, fontWeight: 900 }}>{donation?.qty_kg || 25} kg</div>
                <div style={{ fontSize: 10, color: 'var(--on-surface-variant)' }}>Net Weight</div>
              </div>
              <div style={{ background: 'var(--surface-container-low)', padding: 10, borderRadius: 14 }}>
                <span className="material-symbols-outlined" style={{ fontSize: 18, color: '#0284c7' }}>eco</span>
                <div style={{ fontSize: 18, fontWeight: 900 }}>{Math.round((donation?.qty_kg || 25) * 2.5)} kg</div>
                <div style={{ fontSize: 10, color: 'var(--on-surface-variant)' }}>CO₂e Saved</div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <button
                onClick={() => navigate('/recipient/history')}
                style={{
                  flex: 1, height: 50, borderRadius: 14, border: 'none',
                  background: 'var(--tertiary)', color: 'white', fontWeight: 800,
                  fontSize: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 18 }}>receipt_long</span>
                View Intake History
              </button>
              <button
                onClick={() => setShowCelebration(false)}
                style={{
                  height: 50, padding: '0 20px', borderRadius: 14,
                  border: '1px solid var(--outline-variant)', background: 'transparent',
                  color: 'var(--on-surface)', fontWeight: 700, fontSize: 14, cursor: 'pointer'
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
