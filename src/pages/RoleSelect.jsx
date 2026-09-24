import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';

const ROLES = [
  { id: 'donor', icon: 'skillet', label: 'Donor', sub: 'Restaurants, caterers & grocers', badge: 'Quick Post 30s', badgeColor: 'rgba(252,128,25,0.15)', badgeText: 'var(--primary-dark)', accentBg: '#fff6ee' },
  { id: 'recipient', icon: 'volunteer_activism', label: 'Shelter / Recipient', sub: 'Child Care Homes, Old Age Homes, Anganwadis & Govt Kitchens', badge: 'Priority ⚡', badgeColor: 'rgba(226,55,68,0.1)', badgeText: 'var(--secondary)', accentBg: '#fff5f5' },
  { id: 'driver', icon: 'two_wheeler', label: 'Rider', sub: 'Volunteer & gig rescue riders', badge: 'Flexible Hours', badgeColor: 'rgba(0,110,22,0.1)', badgeText: 'var(--tertiary)', accentBg: '#f0fff4' },
  { id: 'admin', icon: 'shield_with_heart', label: 'Admin', sub: 'Dispatchers & hub operations', badge: 'Ops Portal', badgeColor: 'var(--surface-container)', badgeText: 'var(--on-surface-variant)', accentBg: '#f3f2ff' },
];

export default function RoleSelect() {
  const navigate = useNavigate();
  const { login } = useApp();
  const [selectedRole, setSelectedRole] = useState('donor');
  const [phone, setPhone] = useState('');
  const [showOtp, setShowOtp] = useState(false);
  const [otp, setOtp] = useState(['', '', '', '']);
  const [lang, setLang] = useState('en');
  const [loading, setLoading] = useState(false);

  const handleContinue = () => {
    if (!showOtp) {
      if (phone.length < 10) return;
      setShowOtp(true);
      return;
    }

    // Demo: any OTP (or "1234") works
    setLoading(true);
    setTimeout(() => {
      login(phone, selectedRole);
      const routes = { donor: '/donor', recipient: '/recipient', driver: '/driver', admin: '/admin' };
      navigate(routes[selectedRole] ?? '/donor');
      setLoading(false);
    }, 800);
  };

  const handleOtpChange = (index, value) => {
    if (!/^\d*$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);
    if (value && index < 3) {
      document.getElementById(`otp-${index + 1}`)?.focus();
    }
  };

  return (
    <div style={{ minHeight: '100dvh', background: 'var(--surface)', display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
      {/* Hero Header */}
      <div className="hero-header" style={{ position: 'relative', overflow: 'hidden', padding: '32px 16px 24px', borderRadius: '0 0 28px 28px', boxShadow: '0 8px 24px rgba(152,72,0,0.2)' }}>
        {/* Language toggle */}
        <div style={{ position: 'absolute', top: 12, right: 12, zIndex: 20, display: 'flex', background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(8px)', borderRadius: 999, padding: 3 }}>
          {['EN', 'हिंदी'].map((l, i) => (
            <button key={l} onClick={() => setLang(i === 0 ? 'en' : 'hi')}
              style={{
                padding: '2px 10px', borderRadius: 999, border: 'none', cursor: 'pointer',
                fontSize: 11, fontWeight: 700,
                background: (lang === 'en') === (i === 0) ? 'white' : 'transparent',
                color: (lang === 'en') === (i === 0) ? 'var(--primary-dark)' : 'white',
                transition: 'all 200ms',
              }}>
              {l}
            </button>
          ))}
        </div>

        {/* Decorative circles */}
        <div style={{ position: 'absolute', right: -48, top: -48, width: 192, height: 192, borderRadius: '50%', background: 'rgba(255,255,255,0.1)', filter: 'blur(40px)' }} />
        <div style={{ position: 'absolute', left: -40, bottom: 0, width: 144, height: 144, borderRadius: '50%', background: 'rgba(255,219,200,0.15)', filter: 'blur(32px)' }} />

        <div style={{ position: 'relative', zIndex: 10, display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
          {/* Logo */}
          <div style={{ width: 64, height: 64, borderRadius: 16, background: 'white', padding: 10, boxShadow: '0 8px 24px rgba(0,0,0,0.15)', marginBottom: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span className="material-symbols-outlined" style={{ fontSize: 36, color: 'var(--primary-dark)', fontVariationSettings: "'FILL' 1" }}>soup_kitchen</span>
          </div>

          <h1 className="text-headline-lg" style={{ color: 'white', margin: '0 0 4px' }}>
            Surplus-to-Shelter
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.85)', fontSize: 13, margin: 0 }}>
            {lang === 'en' ? "Today's surplus, tonight's meal." : "आज का अधिशेष, आज रात का भोजन।"}
          </p>

          {/* Live counter pill */}
          <div style={{
            marginTop: 16, display: 'inline-flex', alignItems: 'center', gap: 8,
            background: 'rgba(255,255,255,0.95)', borderRadius: 999, padding: '6px 14px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
          }}>
            <span style={{ position: 'relative', display: 'flex', width: 10, height: 10 }}>
              <span className="animate-ping" style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: 'var(--tertiary)', opacity: 0.7 }} />
              <span style={{ width: 10, height: 10, borderRadius: '50%', background: 'var(--tertiary)' }} />
            </span>
            <span className="text-label-md" style={{ color: 'var(--on-surface)', fontWeight: 700 }}>
              🔥 12,480 meals rescued this month
            </span>
          </div>
        </div>
      </div>

      {/* Role selection */}
      <div style={{ padding: '20px 16px', flex: 1, display: 'flex', flexDirection: 'column', gap: 20 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
            <h2 className="text-headline-sm" style={{ margin: 0 }}>
              {lang === 'en' ? 'Select your role' : 'अपनी भूमिका चुनें'}
            </h2>
            <span className="text-label-sm" style={{ background: 'rgba(152,72,0,0.1)', color: 'var(--primary-dark)', padding: '2px 8px', borderRadius: 999, textTransform: 'uppercase' }}>
              Step 1 of 2
            </span>
          </div>
          <p className="text-body-sm" style={{ color: 'var(--on-surface-variant)', margin: '4px 0 12px' }}>
            {lang === 'en' ? 'Choose how you want to make an impact today' : 'आज प्रभाव डालने का तरीका चुनें'}
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {ROLES.map(role => {
              const active = selectedRole === role.id;
              return (
                <div
                  key={role.id}
                  onClick={() => setSelectedRole(role.id)}
                  role="radio"
                  aria-checked={active}
                  tabIndex={0}
                  onKeyDown={e => e.key === 'Enter' && setSelectedRole(role.id)}
                  style={{
                    position: 'relative',
                    padding: '12px',
                    borderRadius: 20,
                    background: active ? role.accentBg : 'var(--surface-container-lowest)',
                    boxShadow: active ? 'var(--shadow-elevated)' : 'var(--shadow-card)',
                    cursor: 'pointer',
                    transition: 'all 200ms cubic-bezier(0.23,1,0.32,1)',
                    transform: active ? 'scale(1.02)' : 'scale(1)',
                    outline: active ? `2px solid var(--primary-container)` : 'none',
                    outlineOffset: 1,
                    userSelect: 'none',
                  }}
                >
                  {/* Check indicator */}
                  {active && (
                    <div style={{ position: 'absolute', top: 8, right: 8, width: 20, height: 20, borderRadius: '50%', background: 'var(--primary-container)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <span className="material-symbols-outlined" style={{ fontSize: 13, color: 'white', fontVariationSettings: "'FILL' 1" }}>check</span>
                    </div>
                  )}

                  <div style={{ width: 40, height: 40, borderRadius: 12, background: active ? 'rgba(252,128,25,0.12)' : 'var(--surface-container)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 8 }}>
                    <span className="material-symbols-outlined" style={{ fontSize: 22, color: 'var(--primary-dark)', fontVariationSettings: "'FILL' 1" }}>{role.icon}</span>
                  </div>

                  <span style={{ display: 'inline-flex', padding: '1px 6px', borderRadius: 4, background: role.badgeColor, color: role.badgeText, fontSize: 9, fontWeight: 700, marginBottom: 4, letterSpacing: '0.03em' }}>
                    {role.badge}
                  </span>

                  <div className="text-label-lg" style={{ fontWeight: 700, lineHeight: 1.3 }}>{role.label}</div>
                  <p className="text-body-sm" style={{ color: 'var(--on-surface-variant)', margin: '2px 0 0', lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {role.sub}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Phone OTP section */}
        <div style={{ background: 'var(--surface-container-lowest)', borderRadius: 20, padding: 16, boxShadow: 'var(--shadow-card)', display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div>
            <label className="text-label-md" htmlFor="phone-input" style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
              <span>{lang === 'en' ? 'Enter Mobile Number' : 'मोबाइल नंबर दर्ज करें'}</span>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--primary-container)' }} />
            </label>
            <span className="text-body-sm" style={{ color: 'var(--on-surface-variant)', display: 'block', marginBottom: 8 }}>
              {lang === 'en' ? "We'll send a 4-digit code to verify your profile" : 'सत्यापन के लिए 4 अंकों का कोड भेजा जाएगा'}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--surface-container-low)', borderRadius: 14, padding: '8px 12px', transition: 'box-shadow 200ms' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
              <span style={{ fontSize: 18 }}>🇮🇳</span>
              <span className="text-label-lg" style={{ fontWeight: 700 }}>+91</span>
              <span className="material-symbols-outlined" style={{ fontSize: 18, color: 'var(--on-surface-variant)' }}>expand_more</span>
            </div>
            <input
              id="phone-input"
              type="tel"
              inputMode="numeric"
              maxLength={10}
              placeholder="98765 43210"
              value={phone}
              onChange={e => setPhone(e.target.value.replace(/\D/g, ''))}
              disabled={showOtp}
              style={{
                flex: 1, border: 'none', background: 'transparent', outline: 'none',
                fontSize: 18, fontWeight: 600, fontFamily: 'var(--font-family)',
                color: 'var(--on-surface)', letterSpacing: '0.05em',
              }}
              aria-label="Mobile number"
            />
          </div>

          {showOtp && (
            <div className="animate-fade-in-up" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span className="text-label-md">Enter 4-Digit OTP</span>
                <button className="text-label-md" style={{ color: 'var(--primary-dark)', fontWeight: 700, border: 'none', background: 'none', cursor: 'pointer' }}>
                  Resend OTP (24s)
                </button>
              </div>
              <div style={{ display: 'flex', gap: 8, justifyContent: 'space-between' }}>
                {otp.map((digit, i) => (
                  <input
                    key={i}
                    id={`otp-${i}`}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={e => handleOtpChange(i, e.target.value)}
                    style={{
                      width: 56, height: 56, textAlign: 'center',
                      fontSize: 22, fontWeight: 700, fontFamily: 'var(--font-family)',
                      borderRadius: 14, border: 'none', background: 'var(--surface-container-low)',
                      color: 'var(--on-surface)', outline: 'none',
                      boxShadow: digit ? '0 0 0 2px var(--primary-container)' : 'none',
                      transition: 'all 200ms',
                    }}
                    aria-label={`OTP digit ${i + 1}`}
                  />
                ))}
              </div>
              <p className="text-body-sm" style={{ color: 'var(--on-surface-variant)', textAlign: 'center' }}>
                Demo: Enter any 4 digits to continue
              </p>
            </div>
          )}

          <button
            className="btn-primary"
            style={{ width: '100%' }}
            onClick={handleContinue}
            disabled={loading || (!showOtp && phone.length < 10)}
            aria-busy={loading}
          >
            {loading ? (
              <span className="animate-spin material-symbols-outlined" style={{ fontSize: 20 }}>progress_activity</span>
            ) : (
              <>
                <span>{showOtp ? 'Verify & Enter App' : 'Continue'}</span>
                <span className="material-symbols-outlined" style={{ fontSize: 20 }}>arrow_forward</span>
              </>
            )}
          </button>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, color: 'var(--tertiary)' }}>
            <span className="material-symbols-outlined" style={{ fontSize: 16, fontVariationSettings: "'FILL' 1" }}>verified_user</span>
            <span className="text-label-sm" style={{ fontWeight: 600 }}>No account needed for your first donation</span>
          </div>
        </div>

        {/* Guest and Verification links */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, paddingBottom: 24 }}>
          <button
            onClick={() => navigate('/verification')}
            style={{
              display: 'flex', alignItems: 'center', gap: 6, border: '1px solid var(--outline-variant)',
              background: 'var(--surface-container-lowest)', padding: '8px 16px', borderRadius: 999,
              cursor: 'pointer', color: 'var(--on-surface)', fontSize: 13, fontWeight: 700,
              boxShadow: 'var(--shadow-card)'
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 18, color: 'var(--tertiary)' }}>verified</span>
            <span>Institution & Donor Verification Desk</span>
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>chevron_right</span>
          </button>

          <button
            onClick={() => navigate('/impact')}
            style={{ display: 'flex', alignItems: 'center', gap: 4, border: 'none', background: 'none', cursor: 'pointer', color: 'var(--primary-dark)', fontSize: 14, fontWeight: 700 }}
          >
            <span>Browse live rescue feed as Guest</span>
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>east</span>
          </button>
          <p className="text-body-sm" style={{ color: 'var(--on-surface-variant)', textAlign: 'center', maxWidth: 280 }}>
            By continuing, you agree to our{' '}
            <a href="#terms" style={{ color: 'var(--primary-dark)' }}>Terms</a> &{' '}
            <a href="#privacy" style={{ color: 'var(--primary-dark)' }}>Privacy Policy</a>
          </p>
        </div>
      </div>
    </div>
  );
}
