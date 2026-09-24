import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { TopBar, BottomNav, VerifiedBadge, TierBadge, CapacityGauge } from '../../components/Navigation';

export default function RecipientProfile() {
  const navigate = useNavigate();
  const { recipients, updateShelter, logout, showToast, resetDemoData } = useApp();
  const shelter = recipients[0]; // Asha Nilayam

  const [name, setName] = useState(shelter.name);
  const [headcount, setHeadcount] = useState(shelter.headcount);
  const [capacityKg, setCapacityKg] = useState(shelter.capacity_kg);
  const [capacityUsedKg, setCapacityUsedKg] = useState(shelter.capacity_used_kg);
  const [needTodayKg, setNeedTodayKg] = useState(shelter.need_today_kg);
  const [accepting, setAccepting] = useState(shelter.accepting);
  const [hasFridge, setHasFridge] = useState(shelter.has_refrigeration);
  const [hasKitchen, setHasKitchen] = useState(shelter.has_kitchen);
  const [dietary, setDietary] = useState(shelter.dietary_rules);
  const [contactPerson, setContactPerson] = useState(shelter.contact_person);
  const [phone, setPhone] = useState(shelter.contact);

  const handleSave = (e) => {
    e.preventDefault();
    updateShelter(shelter.id, {
      name,
      headcount: Number(headcount),
      capacity_kg: Number(capacityKg),
      capacity_used_kg: Number(capacityUsedKg),
      need_today_kg: Number(needTodayKg),
      accepting,
      has_refrigeration: hasFridge,
      has_kitchen: hasKitchen,
      dietary_rules: dietary,
      contact_person: contactPerson,
      contact: phone,
    });
    showToast('Shelter profile & intake settings saved!', 'check_circle');
  };

  const toggleDietary = (rule) => {
    if (dietary.includes(rule)) {
      setDietary(dietary.filter(r => r !== rule));
    } else {
      setDietary([...dietary, rule]);
    }
  };

  return (
    <div style={{ minHeight: '100dvh', background: 'var(--surface)', display: 'flex', flexDirection: 'column' }}>
      <TopBar title="Institution Profile" subtitle="Surplus-to-Shelter" />

      <main style={{ flex: 1, paddingTop: 68, paddingBottom: 100, overflowY: 'auto', paddingLeft: 16, paddingRight: 16 }}>
        {/* Header Institution Card */}
        <div style={{
          background: 'linear-gradient(135deg, var(--surface-container-lowest), var(--surface-container-low))',
          borderRadius: 20, padding: 18, margin: '12px 0 16px',
          boxShadow: 'var(--shadow-card)', border: '1px solid var(--surface-container)',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
            <TierBadge tier={shelter.tier} />
            <VerifiedBadge small />
          </div>

          <h2 className="text-headline-sm" style={{ margin: '4px 0 2px' }}>{name}</h2>
          <p className="text-body-sm" style={{ color: 'var(--on-surface-variant)', margin: '0 0 14px' }}>
            Registration: <strong>{shelter.registration_id}</strong> • Kota, Rajasthan
          </p>

          {/* Master intake switch */}
          <div style={{
            background: accepting ? 'rgba(0,110,22,0.08)' : 'rgba(183,18,42,0.08)',
            borderRadius: 14, padding: '12px 14px',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            border: `1px solid ${accepting ? 'rgba(0,110,22,0.2)' : 'rgba(183,18,42,0.2)'}`
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span className="material-symbols-outlined" style={{ color: accepting ? 'var(--tertiary)' : 'var(--secondary)' }}>
                {accepting ? 'door_front' : 'door_back'}
              </span>
              <div>
                <div className="text-label-md" style={{ fontWeight: 800, color: accepting ? 'var(--tertiary)' : 'var(--secondary)' }}>
                  {accepting ? 'Shelter Intake OPEN' : 'Shelter Intake PAUSED'}
                </div>
                <div className="text-body-sm" style={{ color: 'var(--on-surface-variant)' }}>
                  {accepting ? 'Ready to accept matched surplus' : 'Do not route new food right now'}
                </div>
              </div>
            </div>
            <input
              type="checkbox"
              checked={accepting}
              onChange={e => {
                setAccepting(e.target.checked);
                updateShelter(shelter.id, { accepting: e.target.checked });
              }}
              style={{ width: 24, height: 24, accentColor: 'var(--tertiary)', cursor: 'pointer' }}
            />
          </div>
        </div>

        {/* Live Capacity Gauge */}
        <div style={{ background: 'var(--surface-container-lowest)', borderRadius: 20, padding: 18, boxShadow: 'var(--shadow-card)', marginBottom: 16 }}>
          <h3 className="text-label-lg" style={{ margin: '0 0 12px', color: 'var(--primary-dark)', textTransform: 'uppercase' }}>
            Storage & Appetite Capacity
          </h3>
          <CapacityGauge used={capacityUsedKg} total={capacityKg} label={`${capacityKg - capacityUsedKg} kg intake capacity free`} />

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginTop: 14 }}>
            <div>
              <label className="text-label-sm" style={{ color: 'var(--on-surface-variant)' }}>Max Storage</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 4 }}>
                <input
                  type="number"
                  value={capacityKg}
                  onChange={e => setCapacityKg(e.target.value)}
                  style={{ width: '100%', height: 38, padding: '0 8px', borderRadius: 10, border: '1px solid var(--outline-variant)', fontSize: 14, fontWeight: 700 }}
                />
                <span className="text-body-sm">kg</span>
              </div>
            </div>

            <div>
              <label className="text-label-sm" style={{ color: 'var(--on-surface-variant)' }}>Currently Used</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 4 }}>
                <input
                  type="number"
                  value={capacityUsedKg}
                  onChange={e => setCapacityUsedKg(e.target.value)}
                  style={{ width: '100%', height: 38, padding: '0 8px', borderRadius: 10, border: '1px solid var(--outline-variant)', fontSize: 14, fontWeight: 700 }}
                />
                <span className="text-body-sm">kg</span>
              </div>
            </div>

            <div>
              <label className="text-label-sm" style={{ color: 'var(--on-surface-variant)' }}>Need Tonight</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 4 }}>
                <input
                  type="number"
                  value={needTodayKg}
                  onChange={e => setNeedTodayKg(e.target.value)}
                  style={{ width: '100%', height: 38, padding: '0 8px', borderRadius: 10, border: '1px solid var(--outline-variant)', fontSize: 14, fontWeight: 700 }}
                />
                <span className="text-body-sm">kg</span>
              </div>
            </div>
          </div>
        </div>

        {/* Profile Settings Form */}
        <form onSubmit={handleSave} style={{ background: 'var(--surface-container-lowest)', borderRadius: 20, padding: 16, boxShadow: 'var(--shadow-card)', display: 'flex', flexDirection: 'column', gap: 14 }}>
          <h3 className="text-label-lg" style={{ margin: 0, color: 'var(--primary-dark)', textTransform: 'uppercase' }}>
            Institution & Facilities
          </h3>

          <div>
            <label className="text-label-md" style={{ display: 'block', marginBottom: 4, color: 'var(--on-surface-variant)' }}>
              Headcount (Residents in Care)
            </label>
            <input
              type="number"
              value={headcount}
              onChange={e => setHeadcount(e.target.value)}
              style={{ width: '100%', height: 44, padding: '0 12px', borderRadius: 12, border: '1px solid var(--outline-variant)', background: 'var(--surface-container-low)', fontSize: 14, fontWeight: 700 }}
            />
          </div>

          <div>
            <label className="text-label-md" style={{ display: 'block', marginBottom: 4, color: 'var(--on-surface-variant)' }}>
              In-Charge / Supervisor Name
            </label>
            <input
              type="text"
              value={contactPerson}
              onChange={e => setContactPerson(e.target.value)}
              style={{ width: '100%', height: 44, padding: '0 12px', borderRadius: 12, border: '1px solid var(--outline-variant)', background: 'var(--surface-container-low)', fontSize: 14 }}
            />
          </div>

          <div>
            <label className="text-label-md" style={{ display: 'block', marginBottom: 4, color: 'var(--on-surface-variant)' }}>
              Emergency Intake Hotline
            </label>
            <input
              type="text"
              value={phone}
              onChange={e => setPhone(e.target.value)}
              style={{ width: '100%', height: 44, padding: '0 12px', borderRadius: 12, border: '1px solid var(--outline-variant)', background: 'var(--surface-container-low)', fontSize: 14 }}
            />
          </div>

          {/* Dietary Rules */}
          <div>
            <label className="text-label-md" style={{ display: 'block', marginBottom: 8, color: 'var(--on-surface-variant)' }}>
              Mandatory Dietary Filter
            </label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {[
                { id: 'veg_only', label: 'Pure Vegetarian Only' },
                { id: 'jain', label: 'Jain (No Root Veg)' },
                { id: 'soft_food', label: 'Soft Food (Elderly Friendly)' },
                { id: 'no_spicy', label: 'Low Spice / Mild Only' },
              ].map(d => {
                const active = dietary.includes(d.id);
                return (
                  <button
                    key={d.id}
                    type="button"
                    onClick={() => toggleDietary(d.id)}
                    style={{
                      padding: '6px 14px', borderRadius: 999, border: 'none', cursor: 'pointer',
                      fontSize: 12, fontWeight: 700,
                      background: active ? 'var(--tertiary)' : 'var(--surface-container)',
                      color: active ? 'white' : 'var(--on-surface-variant)',
                    }}
                  >
                    {active ? '✓ ' : '+ '}{d.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Storage Amenities */}
          <div style={{ borderTop: '1px solid var(--surface-container)', paddingTop: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
            <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}>
              <div>
                <div className="text-label-md" style={{ fontWeight: 700 }}>Commercial Refrigerator Onsite</div>
                <div className="text-body-sm" style={{ color: 'var(--on-surface-variant)' }}>Enables cold-chain & dairy surplus matching</div>
              </div>
              <input type="checkbox" checked={hasFridge} onChange={e => setHasFridge(e.target.checked)} style={{ width: 20, height: 20, accentColor: 'var(--tertiary)' }} />
            </label>

            <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}>
              <div>
                <div className="text-label-md" style={{ fontWeight: 700 }}>Commercial Kitchen & Heating Setup</div>
                <div className="text-body-sm" style={{ color: 'var(--on-surface-variant)' }}>Can re-heat cooked food above 65°C immediately</div>
              </div>
              <input type="checkbox" checked={hasKitchen} onChange={e => setHasKitchen(e.target.checked)} style={{ width: 20, height: 20, accentColor: 'var(--tertiary)' }} />
            </label>
          </div>

          <button type="submit" className="btn-primary" style={{ width: '100%', marginTop: 8 }}>
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>save</span>
            <span>Save Shelter Configuration</span>
          </button>
        </form>

        {/* Danger zone */}
        <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
          <button
            onClick={resetDemoData}
            style={{
              padding: '12px 16px', borderRadius: 14, border: 'none', background: 'var(--surface-container-lowest)',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer',
              boxShadow: 'var(--shadow-card)', color: 'var(--on-surface)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span className="material-symbols-outlined" style={{ color: '#f59e0b' }}>restart_alt</span>
              <span className="text-label-md" style={{ fontWeight: 700 }}>Reset Live Demo Simulation</span>
            </div>
            <span className="material-symbols-outlined" style={{ color: 'var(--on-surface-variant)' }}>chevron_right</span>
          </button>

          <button
            onClick={() => { logout(); navigate('/'); }}
            style={{
              padding: '12px 16px', borderRadius: 14, border: 'none', background: 'rgba(183,18,42,0.08)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, cursor: 'pointer',
              color: 'var(--secondary)', fontWeight: 700, fontSize: 13, marginTop: 8
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>logout</span>
            <span>Sign Out from Shelter Account</span>
          </button>
        </div>
      </main>

      <BottomNav />
    </div>
  );
}
