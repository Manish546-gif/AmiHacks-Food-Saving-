import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { TopBar, BottomNav } from '../../components/Navigation';
import MapView from '../../components/MapView';

export default function DriverProfile() {
  const navigate = useNavigate();
  const { drivers, updateDriver, logout, showToast, resetDemoData } = useApp();
  const driver = drivers[0]; // Rahul Kumar

  const [name, setName] = useState(driver.name);
  const [phone, setPhone] = useState(driver.phone);
  const [vehicle, setVehicle] = useState(driver.vehicle);
  const [capacityKg, setCapacityKg] = useState(driver.vehicle_capacity_kg);
  const [hasCooler, setHasCooler] = useState(driver.has_cooler);
  const [available, setAvailable] = useState(driver.available);

  const handleSave = (e) => {
    e.preventDefault();
    updateDriver(driver.id, {
      name,
      phone,
      vehicle,
      vehicle_capacity_kg: Number(capacityKg),
      has_cooler: hasCooler,
      available,
    });
    showToast('Rider profile and vehicle details updated!', 'check_circle');
  };

  return (
    <div style={{ minHeight: '100dvh', background: 'var(--surface)', display: 'flex', flexDirection: 'column' }}>
      <TopBar title="Rider Profile" subtitle="Surplus-to-Shelter" />

      <main style={{ flex: 1, paddingTop: 68, paddingBottom: 100, overflowY: 'auto', paddingLeft: 16, paddingRight: 16 }}>
        {/* Header Profile Card */}
        <div style={{
          background: 'linear-gradient(135deg, var(--surface-container-lowest), var(--surface-container-low))',
          borderRadius: 20, padding: 18, margin: '12px 0 16px',
          boxShadow: 'var(--shadow-card)', border: '1px solid var(--surface-container)',
          display: 'flex', gap: 14, alignItems: 'center'
        }}>
          <div style={{
            width: 60, height: 60, borderRadius: 16,
            background: 'linear-gradient(135deg, #006e16, #58b654)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'white', flexShrink: 0, boxShadow: '0 4px 14px rgba(0,110,22,0.3)'
          }}>
            <span className="material-symbols-outlined" style={{ fontSize: 32 }}>person</span>
          </div>

          <div style={{ flex: 1, minWidth: 0 }}>
            <h2 className="text-headline-sm" style={{ margin: 0 }}>{name}</h2>
            <p className="text-body-sm" style={{ color: 'var(--on-surface-variant)', margin: '2px 0 4px' }}>
              Volunteer Rider • Kota Central Fleet
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{
                padding: '2px 8px', borderRadius: 999,
                background: available ? 'rgba(0,110,22,0.1)' : 'rgba(183,18,42,0.1)',
                color: available ? 'var(--tertiary)' : 'var(--secondary)',
                fontSize: 10, fontWeight: 800
              }}>
                {available ? '🟢 READY TO DISPATCH' : '🔴 OFFLINE'}
              </span>
            </div>
          </div>
        </div>

        <div style={{ padding: 14, borderRadius: 20, background: 'var(--surface-container-lowest)', boxShadow: 'var(--shadow-card)', marginBottom: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <div>
              <div className="text-label-lg" style={{ fontWeight: 800 }}>Rider availability location</div>
              <div className="text-body-sm" style={{ color: 'var(--on-surface-variant)' }}>Current dispatch position</div>
            </div>
            <span className="material-symbols-outlined" style={{ fontSize: 20, color: 'var(--tertiary)' }}>my_location</span>
          </div>
          <MapView
            mode="radar"
            height="170px"
            pins={[{
              id: `rider-${driver.id}`,
              lat: driver.lat,
              lng: driver.lng,
              type: 'rider',
              label: driver.name,
              address: driver.vehicle,
            }]}
            ariaLabel="Rider location map"
          />
        </div>

        {/* Vehicle & Capacity Form */}
        <form onSubmit={handleSave} style={{ background: 'var(--surface-container-lowest)', borderRadius: 20, padding: 16, boxShadow: 'var(--shadow-card)', display: 'flex', flexDirection: 'column', gap: 14 }}>
          <h3 className="text-label-lg" style={{ margin: 0, color: 'var(--primary-dark)', textTransform: 'uppercase' }}>
            Rider & Vehicle Details
          </h3>

          <div>
            <label className="text-label-md" style={{ display: 'block', marginBottom: 4, color: 'var(--on-surface-variant)' }}>Full Name</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              style={{ width: '100%', height: 44, padding: '0 12px', borderRadius: 12, border: '1px solid var(--outline-variant)', background: 'var(--surface-container-low)', fontSize: 14 }}
            />
          </div>

          <div>
            <label className="text-label-md" style={{ display: 'block', marginBottom: 4, color: 'var(--on-surface-variant)' }}>Phone (Emergency Dispatch SMS)</label>
            <input
              type="text"
              value={phone}
              onChange={e => setPhone(e.target.value)}
              style={{ width: '100%', height: 44, padding: '0 12px', borderRadius: 12, border: '1px solid var(--outline-variant)', background: 'var(--surface-container-low)', fontSize: 14 }}
            />
          </div>

          <div>
            <label className="text-label-md" style={{ display: 'block', marginBottom: 4, color: 'var(--on-surface-variant)' }}>Vehicle Description & Reg #</label>
            <input
              type="text"
              value={vehicle}
              onChange={e => setVehicle(e.target.value)}
              style={{ width: '100%', height: 44, padding: '0 12px', borderRadius: 12, border: '1px solid var(--outline-variant)', background: 'var(--surface-container-low)', fontSize: 14 }}
            />
          </div>

          <div>
            <label className="text-label-md" style={{ display: 'block', marginBottom: 4, color: 'var(--on-surface-variant)' }}>Max Food Payload (kg)</label>
            <input
              type="number"
              value={capacityKg}
              onChange={e => setCapacityKg(e.target.value)}
              style={{ width: '100%', height: 44, padding: '0 12px', borderRadius: 12, border: '1px solid var(--outline-variant)', background: 'var(--surface-container-low)', fontSize: 14 }}
            />
          </div>

          {/* Cooler box equipment toggle */}
          <div style={{ borderTop: '1px solid var(--surface-container)', paddingTop: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
            <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}>
              <div>
                <div className="text-label-md" style={{ fontWeight: 700 }}>Cooler Box / Thermal Bag Installed</div>
                <div className="text-body-sm" style={{ color: 'var(--on-surface-variant)' }}>Enables cold-chain dairy & ice-cream surplus delivery</div>
              </div>
              <input type="checkbox" checked={hasCooler} onChange={e => setHasCooler(e.target.checked)} style={{ width: 20, height: 20, accentColor: 'var(--tertiary)' }} />
            </label>

            <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}>
              <div>
                <div className="text-label-md" style={{ fontWeight: 700 }}>Available for Dispatches</div>
                <div className="text-body-sm" style={{ color: 'var(--on-surface-variant)' }}>Receive emergency alerts when nearby food is about to expire</div>
              </div>
              <input type="checkbox" checked={available} onChange={e => setAvailable(e.target.checked)} style={{ width: 20, height: 20, accentColor: 'var(--tertiary)' }} />
            </label>
          </div>

          <button type="submit" className="btn-primary" style={{ width: '100%', marginTop: 8 }}>
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>save</span>
            <span>Update Rider Details</span>
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
            <span>Sign Out from Rider Account</span>
          </button>
        </div>
      </main>

      <BottomNav />
    </div>
  );
}
