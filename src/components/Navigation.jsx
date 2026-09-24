import { useNavigate, useLocation } from 'react-router-dom';
import { useApp } from '../context/AppContext';

const NAV_ITEMS = {
  donor: [
    { path: '/donor', icon: 'home', label: 'Home' },
    { path: '/donor/donations', icon: 'shopping_bag', label: 'Donations' },
    { path: '/impact', icon: 'trending_up', label: 'Impact' },
    { path: '/donor/receipts', icon: 'receipt_long', label: 'Receipts' },
    { path: '/donor/profile', icon: 'account_circle', label: 'Profile' },
  ],
  recipient: [
    { path: '/recipient', icon: 'home', label: 'Home' },
    { path: '/recipient/offers', icon: 'volunteer_activism', label: 'Offers' },
    { path: '/impact', icon: 'trending_up', label: 'Impact' },
    { path: '/recipient/history', icon: 'history', label: 'History' },
    { path: '/recipient/profile', icon: 'account_circle', label: 'Profile' },
  ],
  driver: [
    { path: '/driver', icon: 'home', label: 'Home' },
    { path: '/driver/tasks', icon: 'local_shipping', label: 'Tasks' },
    { path: '/driver/history', icon: 'history', label: 'History' },
    { path: '/driver/map', icon: 'map', label: 'Map' },
    { path: '/driver/profile', icon: 'account_circle', label: 'Profile' },
  ],
  admin: [
    { path: '/admin', icon: 'grid_view', label: 'Control Room' },
    { path: '/admin/queue', icon: 'queue', label: 'Queue' },
    { path: '/impact', icon: 'trending_up', label: 'Impact' },
    { path: '/official', icon: 'bar_chart', label: 'Reports' },
    { path: '/admin/settings', icon: 'settings', label: 'Settings' },
  ],
};

export function BottomNav() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, unreadCount } = useApp();

  const items = NAV_ITEMS[user?.role] ?? NAV_ITEMS.donor;

  const isActive = (path) => {
    if (path === '/donor' || path === '/recipient' || path === '/driver' || path === '/admin') {
      return location.pathname === path;
    }
    return location.pathname.startsWith(path);
  };

  return (
    <nav className="bottom-nav pb-safe" role="navigation" aria-label="Main navigation">
      {items.map((item) => {
        const active = isActive(item.path);
        return (
          <button
            key={item.path}
            className={`bottom-nav-item ${active ? 'active' : ''}`}
            onClick={() => navigate(item.path)}
            aria-current={active ? 'page' : undefined}
            aria-label={item.label}
            style={{ position: 'relative' }}
          >
            <span
              className="material-symbols-outlined"
              style={{
                fontSize: 22,
                fontVariationSettings: active ? "'FILL' 1" : "'FILL' 0",
                transition: 'all 200ms',
              }}
            >
              {item.icon}
            </span>
            <span className="text-label-sm" style={{ marginTop: 1 }}>{item.label}</span>
            {/* Notification badge */}
            {item.icon === 'home' && unreadCount > 0 && (
              <span style={{
                position: 'absolute', top: 2, right: '50%', marginRight: -18,
                width: 16, height: 16, borderRadius: '50%',
                background: 'var(--secondary)', color: 'white',
                fontSize: 9, fontWeight: 700,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                {unreadCount}
              </span>
            )}
          </button>
        );
      })}
    </nav>
  );
}

export function TopBar({ title, subtitle, showBack = false, rightSlot }) {
  const navigate = useNavigate();
  const { user, unreadCount } = useApp();

  return (
    <header style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50,
      height: 64,
      background: 'rgba(251,248,255,0.85)',
      backdropFilter: 'blur(16px)',
      WebkitBackdropFilter: 'blur(16px)',
      boxShadow: '0 1px 8px rgba(0,0,0,0.04)',
      display: 'flex', alignItems: 'center',
      padding: '0 16px',
      gap: 12,
    }}>
      {showBack && (
        <button
          onClick={() => navigate(-1)}
          aria-label="Go back"
          style={{ width: 40, height: 40, borderRadius: '50%', border: 'none', background: 'var(--surface-container)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: 20 }}>arrow_back</span>
        </button>
      )}

      {!showBack && (
        <div style={{ width: 32, height: 32, borderRadius: 8, background: 'linear-gradient(135deg, var(--primary-container), #ff9a3d)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <span className="material-symbols-outlined" style={{ fontSize: 18, color: 'white', fontVariationSettings: "'FILL' 1" }}>eco</span>
        </div>
      )}

      <div style={{ flex: 1, minWidth: 0 }}>
        {subtitle && <span className="text-label-sm" style={{ color: 'var(--primary-dark)', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block' }}>Surplus-to-Shelter</span>}
        <span className="text-headline-sm" style={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', lineHeight: subtitle ? 1.2 : undefined }}>
          {title}
        </span>
      </div>

      {rightSlot ?? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button
            onClick={() => navigate('/notifications')}
            aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`}
            style={{ width: 40, height: 40, borderRadius: '50%', border: 'none', background: 'var(--surface-container)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', position: 'relative' }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 22 }}>notifications</span>
            {unreadCount > 0 && (
              <span style={{ position: 'absolute', top: 6, right: 6, width: 8, height: 8, borderRadius: '50%', background: 'var(--secondary)' }} />
            )}
          </button>
          <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--primary-dark)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span className="material-symbols-outlined" style={{ fontSize: 18, color: 'white', fontVariationSettings: "'FILL' 1" }}>person</span>
          </div>
        </div>
      )}
    </header>
  );
}

export function Toast({ toast }) {
  if (!toast) return null;
  return (
    <div className="toast" role="status" aria-live="polite">
      <span className="material-symbols-outlined" style={{ fontSize: 18, color: 'var(--primary-fixed-dim)', fontVariationSettings: "'FILL' 1" }}>{toast.icon}</span>
      {toast.message}
    </div>
  );
}

export function TierBadge({ tier }) {
  const configs = {
    1: { label: 'Tier 1 • Children & Elderly', cls: 'tier-1', icon: 'child_care' },
    2: { label: 'Tier 2 • Govt Kitchen', cls: 'tier-2', icon: 'restaurant' },
    3: { label: 'Tier 3 • NGO / Shelter', cls: 'tier-3', icon: 'home' },
    4: { label: 'Tier 4 • Compost', cls: 'tier-4', icon: 'compost' },
  };
  const cfg = configs[tier] ?? configs[3];
  return (
    <span className={`tier-badge ${cfg.cls}`}>
      <span className="material-symbols-outlined" style={{ fontSize: 10, fontVariationSettings: "'FILL' 1" }}>{cfg.icon}</span>
      {cfg.label}
    </span>
  );
}

export function VerifiedBadge({ small = false }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 3,
      padding: small ? '1px 6px' : '2px 8px',
      borderRadius: 'var(--radius-full)',
      background: 'rgba(0,110,22,0.1)',
      color: 'var(--tertiary)',
      fontSize: small ? 9 : 10,
      fontWeight: 700,
      letterSpacing: '0.03em',
    }}>
      <span className="material-symbols-outlined" style={{ fontSize: small ? 10 : 12, fontVariationSettings: "'FILL' 1" }}>verified</span>
      Verified
    </span>
  );
}

export function ScoreBars({ breakdown }) {
  const items = [
    { label: 'Proximity', value: breakdown.proximity, icon: 'location_on' },
    { label: 'Capacity Fit', value: breakdown.capacityFit, icon: 'scale' },
    { label: 'Priority Tier', value: breakdown.priorityTier, icon: 'star' },
    { label: 'Time Slack', value: breakdown.timeSlack, icon: 'schedule' },
    { label: 'Need Today', value: breakdown.needToday, icon: 'volunteer_activism' },
    { label: 'Fairness', value: breakdown.fairness, icon: 'balance' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {items.map(({ label, value, icon }) => (
        <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span className="material-symbols-outlined" style={{ fontSize: 14, color: 'var(--primary-dark)', width: 14, flexShrink: 0 }}>{icon}</span>
          <span className="text-label-md" style={{ width: 80, flexShrink: 0, color: 'var(--on-surface-variant)' }}>{label}</span>
          <div className="score-bar-track" style={{ flex: 1 }}>
            <div className="score-bar-fill" style={{ width: `${Math.round(value * 100)}%` }} />
          </div>
          <span className="text-label-md" style={{ width: 32, textAlign: 'right', color: 'var(--on-surface)' }}>{Math.round(value * 100)}%</span>
        </div>
      ))}
    </div>
  );
}

export function CapacityGauge({ used, total, label }) {
  const pct = total > 0 ? (used / total) * 100 : 0;
  const free = total - used;

  // SVG semicircle gauge
  const r = 48;
  const cx = 60, cy = 60;
  const startAngle = -180;
  const endAngle = 0;
  const angleRange = endAngle - startAngle;
  const filledAngle = startAngle + (pct / 100) * angleRange;

  const polarToCart = (cx, cy, r, angleDeg) => {
    const rad = (angleDeg * Math.PI) / 180;
    return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
  };

  const trackStart = polarToCart(cx, cy, r, startAngle);
  const trackEnd = polarToCart(cx, cy, r, endAngle);
  const fillEnd = polarToCart(cx, cy, r, filledAngle);
  const largeArcFill = filledAngle - startAngle > 180 ? 1 : 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
      <svg width={120} height={70} viewBox="0 0 120 70">
        {/* Track */}
        <path
          d={`M ${trackStart.x} ${trackStart.y} A ${r} ${r} 0 0 1 ${trackEnd.x} ${trackEnd.y}`}
          fill="none"
          stroke="var(--surface-container)"
          strokeWidth={10}
          strokeLinecap="round"
        />
        {/* Fill */}
        {pct > 0 && (
          <path
            d={`M ${trackStart.x} ${trackStart.y} A ${r} ${r} 0 ${largeArcFill} 1 ${fillEnd.x} ${fillEnd.y}`}
            fill="none"
            stroke="var(--primary-container)"
            strokeWidth={10}
            strokeLinecap="round"
          />
        )}
        {/* Labels */}
        <text x={cx} y={58} textAnchor="middle" style={{ fontSize: '16px', fontWeight: 700, fill: 'var(--on-surface)', fontFamily: 'var(--font-family)' }}>
          {free} kg
        </text>
      </svg>
      <span className="text-label-md" style={{ color: 'var(--on-surface-variant)' }}>
        {label ?? `${Math.round(pct)}% full • ${free} kg free of ${total} kg`}
      </span>
    </div>
  );
}
