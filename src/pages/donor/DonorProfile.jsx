import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { TopBar, BottomNav, VerifiedBadge } from '../../components/Navigation';

export default function DonorProfile() {
  const navigate = useNavigate();
  const { user, donors, updateDonor, logout, showToast, resetDemoData } = useApp();
  const donor = donors.find(d => d.id === 1) || donors[0];

  const [name, setName] = useState(donor.name || 'Royal Spice Kitchen');
  const [fssai, setFssai] = useState(donor.fssai_no || 'FSSAI2023001');
  const [phone, setPhone] = useState(donor.contact || '+91 98760 11111');
  const [address, setAddress] = useState(donor.address || 'Talwandi, Kota, Rajasthan');
  const [autoMatch, setAutoMatch] = useState(true);
  const [notifyWhatsApp, setNotifyWhatsApp] = useState(true);

  const handleSave = (e) => {
    e.preventDefault();
    updateDonor(donor.id, { name, fssai_no: fssai, contact: phone, address });
    showToast('Profile & Kitchen details saved successfully!', 'check_circle');
  };

  return (
    <div style={{ minHeight: '100dvh', background: 'var(--surface)', display: 'flex', flexDirection: 'column' }}>
      <TopBar title="Donor Profile" subtitle="Surplus-to-Shelter" />

      <main style={{ flex: 1, paddingTop: 68, paddingBottom: 100, overflowY: 'auto', paddingLeft: 16, paddingRight: 16 }}>
        {/* Profile Header Card */}
        <div style={{
          background: 'linear-gradient(135deg, var(--surface-container-lowest), var(--surface-container-low))',
          borderRadius: 20, padding: 18, margin: '12px 0 16px',
          boxShadow: 'var(--shadow-card)', border: '1px solid var(--surface-container)',
          display: 'flex', gap: 14, alignItems: 'center'
        }}>
          <div style={{
            width: 60, height: 60, borderRadius: 16,
            background: 'linear-gradient(135deg, var(--primary), #ff9a3d)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'white', flexShrink: 0, boxShadow: '0 4px 14px rgba(252,128,25,0.3)',
          }}>
            <span className="material-symbols-outlined" style={{ fontSize: 32 }}>restaurant</span>
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <h2 className="text-headline-sm" style={{ margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {name}
              </h2>
              <VerifiedBadge small />
            </div>
            <p className="text-body-sm" style={{ color: 'var(--on-surface-variant)', margin: '2px 0 4px' }}>
              Commercial Kitchen • FSSAI Certified
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <span className="material-symbols-outlined" style={{ fontSize: 16, color: '#f59e0b', fontVariationSettings: "'FILL' 1" }}>star</span>
              <span className="text-label-md" style={{ fontWeight: 800 }}>4.5</span>
              <span className="text-body-sm" style={{ color: 'var(--on-surface-variant)' }}>• 99.2% on-time dispatch rate</span>
            </div>
          </div>
        </div>

        {/* FSSAI & Compliance Card */}
        <div style={{
          background: 'rgba(0,110,22,0.06)', border: '1px solid rgba(0,110,22,0.18)',
          borderRadius: 18, padding: 14, marginBottom: 16, display: 'flex', gap: 10, alignItems: 'center'
        }}>
          <span className="material-symbols-outlined" style={{ fontSize: 24, color: 'var(--tertiary)' }}>verified_user</span>
          <div style={{ flex: 1 }}>
            <div className="text-label-lg" style={{ color: 'var(--tertiary)', fontWeight: 800 }}>FSSAI Food Safety Compliant</div>
            <div className="text-body-sm" style={{ color: 'var(--on-surface-variant)' }}>
              License: <strong>{fssai}</strong> • Inspected & approved for food donation under Good Samaritan Food Safety Act.
            </div>
          </div>
        </div>

        {/* Edit Details Form */}
        <form onSubmit={handleSave} style={{ background: 'var(--surface-container-lowest)', borderRadius: 20, padding: 16, boxShadow: 'var(--shadow-card)', display: 'flex', flexDirection: 'column', gap: 14 }}>
          <h3 className="text-label-lg" style={{ margin: 0, color: 'var(--primary-dark)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Kitchen & Location Details
          </h3>

          <div>
            <label className="text-label-md" style={{ display: 'block', marginBottom: 4, color: 'var(--on-surface-variant)' }}>Establishment Name</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              style={{ width: '100%', height: 44, padding: '0 12px', borderRadius: 12, border: '1px solid var(--outline-variant)', background: 'var(--surface-container-low)', fontSize: 14 }}
            />
          </div>

          <div>
            <label className="text-label-md" style={{ display: 'block', marginBottom: 4, color: 'var(--on-surface-variant)' }}>FSSAI Registration #</label>
            <input
              type="text"
              value={fssai}
              onChange={e => setFssai(e.target.value)}
              style={{ width: '100%', height: 44, padding: '0 12px', borderRadius: 12, border: '1px solid var(--outline-variant)', background: 'var(--surface-container-low)', fontSize: 14 }}
            />
          </div>

          <div>
            <label className="text-label-md" style={{ display: 'block', marginBottom: 4, color: 'var(--on-surface-variant)' }}>Contact Phone (Emergency Dispatch)</label>
            <input
              type="text"
              value={phone}
              onChange={e => setPhone(e.target.value)}
              style={{ width: '100%', height: 44, padding: '0 12px', borderRadius: 12, border: '1px solid var(--outline-variant)', background: 'var(--surface-container-low)', fontSize: 14 }}
            />
          </div>

          <div>
            <label className="text-label-md" style={{ display: 'block', marginBottom: 4, color: 'var(--on-surface-variant)' }}>Address / Pickup Landmark</label>
            <textarea
              rows={2}
              value={address}
              onChange={e => setAddress(e.target.value)}
              style={{ width: '100%', padding: '8px 12px', borderRadius: 12, border: '1px solid var(--outline-variant)', background: 'var(--surface-container-low)', fontSize: 14, resize: 'none' }}
            />
          </div>

          {/* Preferences */}
          <div style={{ borderTop: '1px solid var(--surface-container)', paddingTop: 14, display: 'flex', flexDirection: 'column', gap: 12 }}>
            <h4 className="text-label-lg" style={{ margin: 0 }}>Automated Routing Preferences</h4>

            <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}>
              <div>
                <div className="text-label-md" style={{ fontWeight: 700 }}>Auto-Dispatch to Tier 1 Shelters</div>
                <div className="text-body-sm" style={{ color: 'var(--on-surface-variant)' }}>First priority to Child Care & Old Age Homes</div>
              </div>
              <input type="checkbox" checked={autoMatch} onChange={e => setAutoMatch(e.target.checked)} style={{ width: 20, height: 20, accentColor: 'var(--primary)' }} />
            </label>

            <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}>
              <div>
                <div className="text-label-md" style={{ fontWeight: 700 }}>WhatsApp Rescue Updates</div>
                <div className="text-body-sm" style={{ color: 'var(--on-surface-variant)' }}>Receive driver ETA & delivery proof instantly</div>
              </div>
              <input type="checkbox" checked={notifyWhatsApp} onChange={e => setNotifyWhatsApp(e.target.checked)} style={{ width: 20, height: 20, accentColor: 'var(--primary)' }} />
            </label>
          </div>

          <button type="submit" className="btn-primary" style={{ width: '100%', marginTop: 8 }}>
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>save</span>
            <span>Update Profile</span>
          </button>
        </form>

        {/* Quick Links & Danger Zone */}
        <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
          <button
            onClick={() => navigate('/donor/receipts')}
            style={{
              padding: '12px 16px', borderRadius: 14, border: 'none', background: 'var(--surface-container-lowest)',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer',
              boxShadow: 'var(--shadow-card)', color: 'var(--on-surface)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span className="material-symbols-outlined" style={{ color: 'var(--primary)' }}>receipt_long</span>
              <span className="text-label-md" style={{ fontWeight: 700 }}>Annual 80G Tax Certificates</span>
            </div>
            <span className="material-symbols-outlined" style={{ color: 'var(--on-surface-variant)' }}>chevron_right</span>
          </button>

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
            <span>Sign Out from Donor Account</span>
          </button>
        </div>
      </main>

      <BottomNav />
    </div>
  );
}
