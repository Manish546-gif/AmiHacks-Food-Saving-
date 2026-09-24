import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { TopBar, BottomNav } from '../../components/Navigation';

export default function DriverMap() {
  const navigate = useNavigate();
  const { donors, recipients, drivers, donations } = useApp();
  const [selectedPin, setSelectedPin] = useState(null);
  const [filterType, setFilterType] = useState('all'); // all | donors | shelters | riders

  const activeDonation = donations.find(d => ['matched', 'picked_up'].includes(d.status));

  // Map coordinates scaled to canvas percentage
  const donorPins = donors.map((d, i) => ({
    ...d,
    pinType: 'donor',
    x: 25 + (i * 14) % 60,
    y: 30 + (i * 12) % 45,
  }));

  const shelterPins = recipients.map((r, i) => ({
    ...r,
    pinType: 'shelter',
    x: 35 + (i * 13) % 55,
    y: 50 + (i * 9) % 35,
  }));

  const riderPins = drivers.map((dr, i) => ({
    ...dr,
    pinType: 'rider',
    x: 30 + (i * 18) % 50,
    y: 42 + (i * 14) % 40,
  }));

  const allPins = [
    ...(filterType === 'all' || filterType === 'donors' ? donorPins : []),
    ...(filterType === 'all' || filterType === 'shelters' ? shelterPins : []),
    ...(filterType === 'all' || filterType === 'riders' ? riderPins : []),
  ];

  return (
    <div style={{ minHeight: '100dvh', background: 'var(--surface)', display: 'flex', flexDirection: 'column' }}>
      <TopBar title="Kota Rescue Radar Map" subtitle="Surplus-to-Shelter" />

      <main style={{ flex: 1, paddingTop: 64, paddingBottom: 96, position: 'relative', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        {/* Floating Map Filter Chips */}
        <div style={{
          position: 'absolute', top: 76, left: 16, right: 16, zIndex: 30,
          display: 'flex', gap: 6, overflowX: 'auto', scrollbarWidth: 'none',
        }}>
          {[
            { id: 'all', label: 'All Hotspots' },
            { id: 'donors', label: 'Donors (Restaurants/Messes)' },
            { id: 'shelters', label: 'Shelters & Kitchens' },
            { id: 'riders', label: 'Active Riders' },
          ].map(f => (
            <button
              key={f.id}
              onClick={() => setFilterType(f.id)}
              style={{
                padding: '6px 14px', borderRadius: 999, border: 'none', cursor: 'pointer',
                fontSize: 12, fontWeight: 700, whiteSpace: 'nowrap',
                background: filterType === f.id ? 'var(--primary)' : 'rgba(255,255,255,0.92)',
                color: filterType === f.id ? 'white' : 'var(--on-surface)',
                boxShadow: 'var(--shadow-card)', backdropFilter: 'blur(8px)',
              }}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Interactive SVG Radar Map Canvas */}
        <div style={{
          flex: 1, position: 'relative', background: '#e9ecef',
          overflow: 'hidden', minHeight: 460, cursor: 'grab'
        }}>
          {/* Simulated Roads & City River (Chambal River in Kota) */}
          <svg width="100%" height="100%" style={{ position: 'absolute', inset: 0 }}>
            {/* Chambal River Curve */}
            <path
              d="M 0,220 Q 200,240 400,180 T 800,120"
              fill="none"
              stroke="#a5d8ff"
              strokeWidth={34}
              opacity={0.7}
            />
            {/* Main Kota Arterial Roads */}
            <line x1="10%" y1="0%" x2="90%" y2="100%" stroke="#dee2e6" strokeWidth={14} />
            <line x1="0%" y1="65%" x2="100%" y2="45%" stroke="#dee2e6" strokeWidth={10} />
            <circle cx="50%" cy="50%" r="220" fill="none" stroke="#ced4da" strokeWidth={1} strokeDasharray="6 6" />
            <circle cx="50%" cy="50%" r="380" fill="none" stroke="#ced4da" strokeWidth={1} strokeDasharray="6 6" />

            {/* Active flight route */}
            {activeDonation && (
              <>
                <line
                  x1="32%" y1="36%" x2="48%" y2="59%"
                  stroke="var(--primary)" strokeWidth={4} strokeDasharray="8 6"
                >
                  <animate attributeName="stroke-dashoffset" values="28;0" dur="1s" repeatCount="indefinite" />
                </line>
                <circle cx="32%" cy="36%" r={18} fill="rgba(252,128,25,0.2)" />
                <circle cx="48%" cy="59%" r={18} fill="rgba(0,110,22,0.2)" />
              </>
            )}

            {/* Render Pins */}
            {allPins.map(pin => {
              const isSelected = selectedPin?.id === pin.id && selectedPin?.pinType === pin.pinType;
              const color = pin.pinType === 'donor' ? 'var(--primary)' : pin.pinType === 'shelter' ? 'var(--tertiary)' : '#2563eb';
              const icon = pin.pinType === 'donor' ? 'restaurant' : pin.pinType === 'shelter' ? 'home' : 'two_wheeler';

              return (
                <g
                  key={`${pin.pinType}-${pin.id}`}
                  transform={`translate(${pin.x * 3.5 + 40}, ${pin.y * 3.8 + 80})`}
                  style={{ cursor: 'pointer' }}
                  onClick={() => setSelectedPin(pin)}
                >
                  {/* Outer pulse if rider */}
                  {pin.pinType === 'rider' && (
                    <circle r={18} fill={color} opacity={0.2}>
                      <animate attributeName="r" values="10;22;10" dur="2s" repeatCount="indefinite" />
                      <animate attributeName="opacity" values="0.3;0;0.3" dur="2s" repeatCount="indefinite" />
                    </circle>
                  )}

                  {/* Marker Pin Base */}
                  <circle
                    r={isSelected ? 18 : 13}
                    fill={color}
                    stroke="white"
                    strokeWidth={3}
                    filter="drop-shadow(0px 3px 6px rgba(0,0,0,0.2))"
                  />
                  <text
                    textAnchor="middle"
                    dy={isSelected ? 4 : 3}
                    fill="white"
                    fontSize={isSelected ? 10 : 8}
                    fontWeight="bold"
                    fontFamily="sans-serif"
                  >
                    {pin.pinType === 'donor' ? 'D' : pin.pinType === 'shelter' ? 'S' : 'R'}
                  </text>
                </g>
              );
            })}
          </svg>

          {/* Active Legend in Bottom Corner */}
          <div style={{
            position: 'absolute', bottom: selectedPin ? 180 : 16, left: 16, zIndex: 20,
            background: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(10px)',
            borderRadius: 14, padding: '8px 12px', boxShadow: 'var(--shadow-card)',
            display: 'flex', gap: 10, alignItems: 'center'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <span style={{ width: 10, height: 10, borderRadius: '50%', background: 'var(--primary)' }} />
              <span className="text-label-sm">Donor</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <span style={{ width: 10, height: 10, borderRadius: '50%', background: 'var(--tertiary)' }} />
              <span className="text-label-sm">Shelter</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#2563eb' }} />
              <span className="text-label-sm">Rider</span>
            </div>
          </div>
        </div>

        {/* Selected Pin Bottom Sheet Card */}
        {selectedPin && (
          <div style={{
            position: 'absolute', bottom: 12, left: 16, right: 16, zIndex: 40,
            background: 'var(--surface-container-lowest)', borderRadius: 20, padding: 16,
            boxShadow: 'var(--shadow-elevated)', border: '1px solid var(--surface-container)',
            animation: 'fadeInUp 200ms ease-out',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <span style={{
                  padding: '2px 8px', borderRadius: 999,
                  background: selectedPin.pinType === 'donor' ? 'rgba(252,128,25,0.1)' : selectedPin.pinType === 'shelter' ? 'rgba(0,110,22,0.1)' : 'rgba(37,99,235,0.1)',
                  color: selectedPin.pinType === 'donor' ? 'var(--primary)' : selectedPin.pinType === 'shelter' ? 'var(--tertiary)' : '#2563eb',
                  fontSize: 10, fontWeight: 800, textTransform: 'uppercase'
                }}>
                  {selectedPin.pinType}
                </span>
                <h3 className="text-headline-sm" style={{ margin: '4px 0 2px' }}>{selectedPin.name}</h3>
                <div className="text-body-sm" style={{ color: 'var(--on-surface-variant)' }}>
                  {selectedPin.address || selectedPin.vehicle || 'Kota, Rajasthan'}
                </div>
              </div>
              <button onClick={() => setSelectedPin(null)} style={{ border: 'none', background: 'none', cursor: 'pointer' }}>
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
              <button
                onClick={() => {
                  const url = `https://www.google.com/maps/search/?api=1&query=${selectedPin.lat || 25.21},${selectedPin.lng || 75.86}`;
                  window.open(url, '_blank');
                }}
                className="btn-secondary"
                style={{ flex: 1, height: 42, fontSize: 13 }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 18 }}>navigation</span>
                <span>Directions</span>
              </button>
              <button
                onClick={() => navigate('/driver/tasks')}
                className="btn-primary"
                style={{ flex: 1, height: 42, fontSize: 13 }}
              >
                <span>View Rescue Jobs</span>
              </button>
            </div>
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  );
}
