import { useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { TopBar, BottomNav } from '../../components/Navigation';

export default function NotificationsPage() {
  const navigate = useNavigate();
  const { notifications, markNotificationRead } = useApp();

  const formatTime = (iso) => {
    const diff = Date.now() - new Date(iso).getTime();
    const min = Math.floor(diff / 60000);
    const hr = Math.floor(diff / 3600000);
    if (min < 60) return `${min} min ago`;
    if (hr < 24) return `${hr}h ago`;
    return new Date(iso).toLocaleDateString('en-IN');
  };

  const ICON_MAP = {
    'Offer Accepted': 'celebration',
    'Accepted': 'celebration',
    'Match Found': 'volunteer_activism',
    'Delivery Complete': 'check_circle',
    'Driver Assigned': 'two_wheeler',
    'Rescue Mission': 'two_wheeler',
    'Escalated': 'alarm_off',
    'New Food Offer': 'soup_kitchen',
    'Incoming': 'soup_kitchen',
  };

  const handleNotificationClick = (n) => {
    markNotificationRead(n.id);
    if (n.donation_id) {
      if (n.role === 'donor') {
        if (n.title.includes('Accepted')) {
          navigate(`/donor/match/${n.donation_id}`);
        } else {
          navigate(`/donor/match/${n.donation_id}`);
        }
      } else if (n.role === 'recipient') {
        navigate('/recipient/offers');
      }
    }
  };

  return (
    <div style={{ minHeight: '100dvh', background: 'var(--surface)', display: 'flex', flexDirection: 'column' }}>
      <TopBar title="Notifications" showBack />
      <main style={{ flex: 1, paddingTop: 64, paddingBottom: 96, overflowY: 'auto' }}>
        <div style={{ padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 8 }}>
          {notifications.length === 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '60px 24px', gap: 12 }}>
              <span className="material-symbols-outlined" style={{ fontSize: 48, color: 'var(--on-surface-variant)' }}>notifications_none</span>
              <p className="text-headline-sm" style={{ margin: 0 }}>No notifications yet</p>
            </div>
          )}
          {notifications.map(n => {
            const iconKey = Object.keys(ICON_MAP).find(k => n.title.includes(k));
            const icon = iconKey ? ICON_MAP[iconKey] : 'notifications';
            return (
              <div
                key={n.id}
                onClick={() => handleNotificationClick(n)}
                style={{
                  padding: '14px 14px',
                  borderRadius: 16,
                  background: n.read ? 'var(--surface-container-lowest)' : 'rgba(252,128,25,0.06)',
                  border: n.read ? '1px solid transparent' : '1px solid rgba(252,128,25,0.15)',
                  display: 'flex', alignItems: 'flex-start', gap: 12, cursor: 'pointer',
                  boxShadow: 'var(--shadow-card)',
                  transition: 'background 200ms',
                }}
              >
                <div style={{
                  width: 40, height: 40, borderRadius: '50%', flexShrink: 0,
                  background: n.read ? 'var(--surface-container)' : 'rgba(252,128,25,0.12)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 20, color: n.read ? 'var(--on-surface-variant)' : 'var(--primary-dark)', fontVariationSettings: "'FILL' 1" }}>{icon}</span>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span className="text-label-lg" style={{ fontWeight: 700, color: 'var(--on-surface)' }}>{n.title}</span>
                    <span className="text-label-sm" style={{ color: 'var(--on-surface-variant)', flexShrink: 0, marginLeft: 8 }}>{formatTime(n.created_at)}</span>
                  </div>
                  <p className="text-body-sm" style={{ color: 'var(--on-surface-variant)', margin: '3px 0 0', lineHeight: 1.5 }}>{n.body}</p>
                </div>
                {!n.read && (
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--primary-container)', flexShrink: 0, marginTop: 6 }} />
                )}
              </div>
            );
          })}
        </div>
      </main>
      <BottomNav />
    </div>
  );
}
