import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { TopBar, BottomNav } from '../../components/Navigation';
import MapView from '../../components/MapView';

const FILTERS = [
  { id: 'all', label: '🗺️ All Hotspots' },
  { id: 'donor', label: '🍽️ Donors' },
  { id: 'shelter', label: '🏠 Shelters' },
  { id: 'rider', label: '🛵 Active Riders' },
];

export default function DriverMap() {
  const navigate = useNavigate();
  const { donors, recipients, drivers, donations } = useApp();
  const [selectedPin, setSelectedPin] = useState(null);
  const [filterType, setFilterType] = useState('all');

  const activeDonation = donations.find(d => ['matched', 'picked_up'].includes(d.status));
  const activeDonor = donors.find(d => d.id === activeDonation?.donor_id) || donors[0];
  const activeShelter = recipients.find(r => r.id === activeDonation?.matched_recipient_id) || recipients[0];
  const activeRider = drivers.find(d => d.id === activeDonation?.driver_id) || drivers[0];

  // Build unified pin list for the map
  const pins = useMemo(() => {
    const donorPins = donors.map(d => ({
      id: `donor-${d.id}`,
      lat: d.lat,
      lng: d.lng,
       type: d.type === 'individual' ? 'individual' : d.type === 'restaurant' ? 'restaurant' : 'donor',
       label: d.name,
      address: d.address,
      ...d,
      _role: 'donor',
    }));

    const shelterPins = recipients.map(r => ({
      id: `shelter-${r.id}`,
      lat: r.lat,
      lng: r.lng,
      type: 'shelter',
      label: r.name,
      address: r.address,
      ...r,
      _role: 'shelter',
    }));

    const riderPins = drivers
      .filter(d => d.available)
      .map(d => ({
        id: `rider-${d.id}`,
        lat: d.lat,
        lng: d.lng,
        type: 'rider',
        label: d.name,
        address: d.vehicle,
        ...d,
        _role: 'rider',
      }));

    const type = filterType;
    return [
      ...(type === 'all' || type === 'donor' ? donorPins : []),
      ...(type === 'all' || type === 'shelter' ? shelterPins : []),
      ...(type === 'all' || type === 'rider' ? riderPins : []),
    ];
  }, [donors, recipients, drivers, filterType]);

  return (
    <div style={{ minHeight: '100dvh', background: 'var(--surface)', display: 'flex', flexDirection: 'column' }}>
      <TopBar title="Kota Rescue Radar Map" subtitle="Surplus-to-Shelter" />

      <main style={{ flex: 1, paddingTop: 64, paddingBottom: 96, display: 'flex', flexDirection: 'column', overflow: 'hidden', position: 'relative' }}>
        {/* Filter chips */}
        <div style={{
          position: 'absolute', top: 76, left: 0, right: 0, zIndex: 400,
          display: 'flex', gap: 6, padding: '0 16px',
          overflowX: 'auto', scrollbarWidth: 'none',
        }}>
          {FILTERS.map(f => (
            <button
              key={f.id}
              onClick={() => setFilterType(f.id)}
              style={{
                padding: '6px 14px', borderRadius: 999, border: 'none', cursor: 'pointer',
                fontSize: 12, fontWeight: 700, whiteSpace: 'nowrap',
                background: filterType === f.id ? 'var(--primary)' : 'rgba(255,255,255,0.95)',
                color: filterType === f.id ? 'white' : 'var(--on-surface)',
                boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
                backdropFilter: 'blur(8px)',
                transition: 'all 0.2s ease',
              }}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Live rescue map */}
        <MapView
          mode="radar"
          height="100%"
          pins={pins}
          pickupLat={activeDonor?.lat}
          pickupLng={activeDonor?.lng}
          dropLat={activeShelter?.lat}
          dropLng={activeShelter?.lng}
          riderLat={activeDonation?.status === 'picked_up' ? activeRider?.lat : undefined}
          riderLng={activeDonation?.status === 'picked_up' ? activeRider?.lng : undefined}
          progress={activeDonation?.status === 'picked_up' ? 0.65 : 0.25}
          showRoute={Boolean(activeDonation)}
          selectedPinId={selectedPin?.id}
          onPinClick={setSelectedPin}
          style={{ flex: 1, borderRadius: 0 }}
        />

        {/* Legend */}
        <div style={{
          position: 'absolute',
          bottom: selectedPin ? 190 : 16,
          left: 16,
          zIndex: 400,
          background: 'rgba(255,255,255,0.95)',
          backdropFilter: 'blur(12px)',
          borderRadius: 14, padding: '8px 12px',
          boxShadow: '0 2px 12px rgba(0,0,0,0.12)',
          display: 'flex', gap: 10, alignItems: 'center',
          transition: 'bottom 0.3s ease',
        }}>
          {[
            { color: '#fc8019', label: 'Donor' },
            { color: '#006e16', label: 'Shelter' },
            { color: '#2563eb', label: 'Rider' },
          ].map(({ color, label }) => (
            <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <span style={{ width: 10, height: 10, borderRadius: '50%', background: color, display: 'block' }} />
              <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--on-surface)' }}>{label}</span>
            </div>
          ))}
        </div>

        {/* Active mission pulse badge */}
        {activeDonation && (
          <div style={{
            position: 'absolute', top: 116, right: 16, zIndex: 400,
            background: 'rgba(252,128,25,0.95)', backdropFilter: 'blur(8px)',
            borderRadius: 12, padding: '6px 12px',
            display: 'flex', alignItems: 'center', gap: 6,
            boxShadow: '0 2px 12px rgba(252,128,25,0.4)',
          }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'white', animation: 'pulse 1.5s infinite' }} />
            <span style={{ fontSize: 11, fontWeight: 800, color: 'white' }}>Active Rescue</span>
          </div>
        )}

        {/* Selected Pin Bottom Sheet */}
        {selectedPin && (
          <div style={{
            position: 'absolute', bottom: 12, left: 16, right: 16, zIndex: 500,
            background: 'var(--surface-container-lowest)', borderRadius: 20, padding: 16,
            boxShadow: '0 -4px 24px rgba(0,0,0,0.15)',
            border: '1px solid var(--surface-container)',
            animation: 'fadeInUp 200ms ease-out',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <span style={{
                  padding: '2px 8px', borderRadius: 999,
                  background: selectedPin._role === 'donor' ? 'rgba(252,128,25,0.1)'
                    : selectedPin._role === 'shelter' ? 'rgba(0,110,22,0.1)'
                    : 'rgba(37,99,235,0.1)',
                  color: selectedPin._role === 'donor' ? 'var(--primary)'
                    : selectedPin._role === 'shelter' ? 'var(--tertiary)'
                    : '#2563eb',
                  fontSize: 10, fontWeight: 800, textTransform: 'uppercase'
                }}>
                  {selectedPin._role}
                </span>
                <h3 className="text-headline-sm" style={{ margin: '4px 0 2px' }}>{selectedPin.name || selectedPin.label}</h3>
                <div className="text-body-sm" style={{ color: 'var(--on-surface-variant)' }}>
                  {selectedPin.address || selectedPin.vehicle || 'Kota, Rajasthan'}
                </div>
              </div>
              <button onClick={() => setSelectedPin(null)} style={{ border: 'none', background: 'none', cursor: 'pointer', padding: 4 }}>
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
              <button
                onClick={() => {
                  const url = `https://www.google.com/maps/search/?api=1&query=${selectedPin.lat},${selectedPin.lng}`;
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
