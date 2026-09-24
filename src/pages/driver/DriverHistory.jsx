import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { TopBar, BottomNav } from '../../components/Navigation';

export default function DriverHistory() {
  const navigate = useNavigate();
  const { donations, showToast } = useApp();

  const delivered = donations.filter(d => d.status === 'delivered');
  const totalKg = delivered.reduce((acc, d) => acc + (d.qty_kg || 12), 0);
  const totalMeals = delivered.reduce((acc, d) => acc + (d.est_meals || 24), 0);

  return (
    <div style={{ minHeight: '100dvh', background: 'var(--surface)', display: 'flex', flexDirection: 'column' }}>
      <TopBar title="Rider History & Badges" subtitle="Surplus-to-Shelter" />

      <main style={{ flex: 1, paddingTop: 68, paddingBottom: 100, overflowY: 'auto' }}>
        {/* Volunteer Hero Profile Banner */}
        <div style={{ padding: '0 16px 14px' }}>
          <div style={{
            background: 'linear-gradient(135deg, var(--surface-container-lowest), var(--surface-container-low))',
            borderRadius: 20, padding: 18, boxShadow: 'var(--shadow-card)',
            border: '1px solid var(--surface-container)',
          }}>
            <div style={{ display: 'flex', gap: 14, alignItems: 'center', marginBottom: 16 }}>
              <div style={{
                width: 60, height: 60, borderRadius: '50%',
                background: 'linear-gradient(135deg, #006e16, #58b654)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'white', flexShrink: 0, boxShadow: '0 4px 14px rgba(0,110,22,0.3)'
              }}>
                <span className="material-symbols-outlined" style={{ fontSize: 32 }}>two_wheeler</span>
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <h2 className="text-headline-sm" style={{ margin: 0 }}>Rahul Kumar</h2>
                  <span style={{ padding: '2px 8px', borderRadius: 999, background: 'rgba(0,110,22,0.1)', color: 'var(--tertiary)', fontSize: 10, fontWeight: 800 }}>
                    Level 4 Hero
                  </span>
                </div>
                <div className="text-body-sm" style={{ color: 'var(--on-surface-variant)' }}>
                  Kota Central Volunteer Fleet • Honda Activa (RJ-20-AA-1234)
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 16, color: '#f59e0b', fontVariationSettings: "'FILL' 1" }}>star</span>
                  <span className="text-label-md" style={{ fontWeight: 800 }}>4.8 ★</span>
                  <span className="text-body-sm" style={{ color: 'var(--on-surface-variant)' }}>• 100% successful drop-offs</span>
                </div>
              </div>
            </div>

            {/* Impact Metric Chips */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
              <div style={{ background: 'var(--surface-container-lowest)', padding: 10, borderRadius: 12, textAlign: 'center' }}>
                <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--primary)' }}>{delivered.length + 28}</div>
                <div className="text-label-sm" style={{ color: 'var(--on-surface-variant)' }}>Rescues</div>
              </div>
              <div style={{ background: 'var(--surface-container-lowest)', padding: 10, borderRadius: 12, textAlign: 'center' }}>
                <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--tertiary)' }}>{totalKg + 340} kg</div>
                <div className="text-label-sm" style={{ color: 'var(--on-surface-variant)' }}>Food Moved</div>
              </div>
              <div style={{ background: 'var(--surface-container-lowest)', padding: 10, borderRadius: 12, textAlign: 'center' }}>
                <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--secondary)' }}>{totalMeals + 680}</div>
                <div className="text-label-sm" style={{ color: 'var(--on-surface-variant)' }}>People Fed</div>
              </div>
              <div style={{ background: 'var(--surface-container-lowest)', padding: 10, borderRadius: 12, textAlign: 'center' }}>
                <div style={{ fontSize: 18, fontWeight: 800, color: '#2563eb' }}>42h</div>
                <div className="text-label-sm" style={{ color: 'var(--on-surface-variant)' }}>Volunteered</div>
              </div>
            </div>
          </div>
        </div>

        {/* Badges Section */}
        <div style={{ padding: '0 16px 14px' }}>
          <h3 className="text-label-lg" style={{ margin: '0 0 10px', color: 'var(--primary-dark)', textTransform: 'uppercase' }}>
            Earned Volunteer Badges
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
            {[
              { icon: 'military_tech', title: 'Kota Food Hero', desc: 'Over 25 rescues', color: '#f59e0b' },
              { icon: 'speed', title: 'Swift Wheels', desc: '< 18 min avg ETA', color: 'var(--primary)' },
              { icon: 'ac_unit', title: 'Safe Chain', desc: '0 food spoilage', color: '#0284c7' },
            ].map(b => (
              <div key={b.title} style={{
                background: 'var(--surface-container-lowest)', borderRadius: 14, padding: 12,
                textAlign: 'center', boxShadow: 'var(--shadow-card)', display: 'flex', flexDirection: 'column', alignItems: 'center'
              }}>
                <div style={{ width: 38, height: 38, borderRadius: '50%', background: `${b.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: b.color, marginBottom: 6 }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 22, fontVariationSettings: "'FILL' 1" }}>{b.icon}</span>
                </div>
                <div className="text-label-md" style={{ fontWeight: 800, fontSize: 12 }}>{b.title}</div>
                <div className="text-body-sm" style={{ fontSize: 10, color: 'var(--on-surface-variant)' }}>{b.desc}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Completed Trips Log */}
        <div style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 className="text-label-lg" style={{ margin: 0, color: 'var(--on-surface-variant)' }}>Recent Rescue Missions</h3>
            <button
              onClick={() => showToast('Volunteer Service Certificate downloaded (PDF)', 'download')}
              style={{ border: 'none', background: 'none', color: 'var(--tertiary)', fontSize: 12, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 16 }}>workspace_premium</span>
              <span>Get Certificate</span>
            </button>
          </div>

          {delivered.map(d => (
            <div
              key={d.id}
              style={{
                background: 'var(--surface-container-lowest)', borderRadius: 16, padding: 14,
                boxShadow: 'var(--shadow-card)', display: 'flex', justifyContent: 'space-between', alignItems: 'center'
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span className="text-label-lg" style={{ fontWeight: 800 }}>{d.description}</span>
                  <span style={{ padding: '2px 6px', borderRadius: 999, background: 'rgba(0,110,22,0.1)', color: 'var(--tertiary)', fontSize: 10, fontWeight: 800 }}>
                    COMPLETED ✓
                  </span>
                </div>
                <div className="text-body-sm" style={{ color: 'var(--on-surface-variant)', marginTop: 2 }}>
                  {d.donor_name} → Asha Nilayam • {d.qty_kg} kg (~{d.est_meals || d.qty_kg * 2} meals)
                </div>
                <div className="text-body-sm" style={{ color: 'var(--tertiary)', fontSize: 11, fontWeight: 700, marginTop: 4 }}>
                  ★ 5.0 Rating from Shelter Supervisor
                </div>
              </div>

              <div style={{ textAlign: 'right' }}>
                <span className="material-symbols-outlined" style={{ color: 'var(--tertiary)' }}>verified</span>
              </div>
            </div>
          ))}
        </div>
      </main>

      <BottomNav />
    </div>
  );
}
