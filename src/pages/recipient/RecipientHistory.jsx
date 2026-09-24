import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { TopBar, BottomNav } from '../../components/Navigation';

export default function RecipientHistory() {
  const navigate = useNavigate();
  const { donations, showToast } = useApp();
  const [filterMonth, setFilterMonth] = useState('September 2026');
  const [thankedId, setThankedId] = useState(null);

  // Delivered donations received by recipient
  const deliveries = donations.filter(d => d.status === 'delivered' && (d.matched_recipient_id === 1 || !d.matched_recipient_id));

  const totalMeals = deliveries.reduce((acc, d) => acc + (d.est_meals || (d.qty_kg * 2)), 0);
  const totalKg = deliveries.reduce((acc, d) => acc + (d.qty_kg || 0), 0);

  const handleSendThanks = (id) => {
    setThankedId(id);
    showToast('Sent gratitude & meal blessings note to donor!', 'volunteer_activism');
  };

  return (
    <div style={{ minHeight: '100dvh', background: 'var(--surface)', display: 'flex', flexDirection: 'column' }}>
      <TopBar title="Delivery Log & History" subtitle="Surplus-to-Shelter" />

      <main style={{ flex: 1, paddingTop: 68, paddingBottom: 100, overflowY: 'auto' }}>
        {/* Monthly Summary Card */}
        <div style={{ padding: '0 16px 14px' }}>
          <div style={{
            background: 'linear-gradient(135deg, var(--surface-container-lowest), var(--surface-container-low))',
            borderRadius: 20, padding: 18, boxShadow: 'var(--shadow-card)',
            border: '1px solid var(--surface-container)',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <div>
                <span className="text-label-sm" style={{ color: 'var(--primary-dark)', fontWeight: 800, textTransform: 'uppercase' }}>Shelter Intake Log</span>
                <h2 className="text-headline-sm" style={{ margin: 0 }}>Asha Nilayam Old Age Home</h2>
              </div>
              <span style={{
                padding: '4px 10px', borderRadius: 999, background: 'var(--surface-container)',
                fontSize: 11, fontWeight: 700, color: 'var(--on-surface-variant)'
              }}>
                {filterMonth}
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
              <div style={{ background: 'var(--surface-container-lowest)', padding: 10, borderRadius: 12, textAlign: 'center' }}>
                <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--tertiary)' }}>{deliveries.length}</div>
                <div className="text-label-sm" style={{ color: 'var(--on-surface-variant)' }}>Deliveries</div>
              </div>
              <div style={{ background: 'var(--surface-container-lowest)', padding: 10, borderRadius: 12, textAlign: 'center' }}>
                <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--primary)' }}>{totalKg} kg</div>
                <div className="text-label-sm" style={{ color: 'var(--on-surface-variant)' }}>Food Received</div>
              </div>
              <div style={{ background: 'var(--surface-container-lowest)', padding: 10, borderRadius: 12, textAlign: 'center' }}>
                <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--secondary)' }}>{totalMeals}</div>
                <div className="text-label-sm" style={{ color: 'var(--on-surface-variant)' }}>Meals Served</div>
              </div>
            </div>

            <div style={{
              marginTop: 12, paddingTop: 10, borderTop: '1px solid var(--surface-container)',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center'
            }}>
              <span className="text-body-sm" style={{ color: 'var(--tertiary)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4 }}>
                <span className="material-symbols-outlined" style={{ fontSize: 16 }}>verified</span>
                100% Quality Audited at Gate
              </span>
              <button
                onClick={() => showToast('Intake Audit PDF generated & downloaded', 'download')}
                style={{
                  border: 'none', background: 'none', color: 'var(--primary-dark)',
                  fontSize: 12, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 16 }}>download</span>
                <span>Export Audit</span>
              </button>
            </div>
          </div>
        </div>

        {/* History Entries */}
        <div style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
          <h3 className="text-label-lg" style={{ margin: 0, color: 'var(--on-surface-variant)' }}>Verified Intake Records</h3>

          {deliveries.map(item => (
            <div
              key={item.id}
              style={{
                background: 'var(--surface-container-lowest)', borderRadius: 18, padding: 16,
                boxShadow: 'var(--shadow-card)', display: 'flex', flexDirection: 'column', gap: 10
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <h4 className="text-headline-sm" style={{ margin: 0, fontSize: 16 }}>{item.description}</h4>
                    <span style={{
                      padding: '1px 6px', borderRadius: 999, background: 'rgba(0,110,22,0.1)',
                      color: 'var(--tertiary)', fontSize: 10, fontWeight: 700
                    }}>
                      ✓ Temp: 68°C Verified
                    </span>
                  </div>
                  <div className="text-body-sm" style={{ color: 'var(--on-surface-variant)', marginTop: 2 }}>
                    From {item.donor_name} • Delivered by Volunteer Rider Rahul Kumar
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontWeight: 800, fontSize: 15, color: 'var(--on-surface)' }}>{item.qty_kg} kg</div>
                  <div className="text-label-sm" style={{ color: 'var(--tertiary)' }}>~{item.est_meals || item.qty_kg * 2} meals</div>
                </div>
              </div>

              {/* Safety & Gate Audit Details */}
              <div style={{
                display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6,
                background: 'var(--surface-container-low)', borderRadius: 10, padding: 8, fontSize: 11
              }}>
                <div><strong>Packaging:</strong> Sealed Food-Grade</div>
                <div><strong>Intake Time:</strong> 20:15 PM</div>
                <div><strong>OTP Verified:</strong> #8492</div>
              </div>

              {/* Action row */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 4 }}>
                <span className="text-body-sm" style={{ color: 'var(--on-surface-variant)' }}>
                  Distributed to 65 residents tonight
                </span>

                <button
                  onClick={() => handleSendThanks(item.id)}
                  style={{
                    padding: '6px 12px', borderRadius: 10, border: 'none',
                    background: thankedId === item.id ? 'rgba(0,110,22,0.1)' : 'var(--primary-fixed)',
                    color: thankedId === item.id ? 'var(--tertiary)' : 'var(--on-primary-fixed)',
                    fontWeight: 700, fontSize: 12, display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer'
                  }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 14 }}>
                    {thankedId === item.id ? 'favorite' : 'volunteer_activism'}
                  </span>
                  <span>{thankedId === item.id ? 'Gratitude Sent!' : 'Say Thank You'}</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </main>

      <BottomNav />
    </div>
  );
}
