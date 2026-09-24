import React, { Component, useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { AppProvider, useApp } from './context/AppContext';
import { Toast } from './components/Navigation';

// Production Error Boundary
class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100dvh', display: 'flex', flexDirection: 'column', alignItems: 'center',
          justifyContent: 'center', padding: 24, textAlign: 'center', background: 'var(--surface)'
        }}>
          <span className="material-symbols-outlined" style={{ fontSize: 56, color: 'var(--primary)', marginBottom: 12 }}>
            volunteer_activism
          </span>
          <h2 className="text-headline-md" style={{ margin: '0 0 8px' }}>Surplus-to-Shelter</h2>
          <p className="text-body-sm" style={{ color: 'var(--on-surface-variant)', maxWidth: 320, margin: '0 0 20px' }}>
            We encountered a temporary interface state. Tap below to reload the clean screen.
          </p>
          <button
            onClick={() => { this.setState({ hasError: false }); window.location.href = '/'; }}
            className="btn-primary"
          >
            Reload Clean State
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

// Donor Pages
import RoleSelect from './pages/RoleSelect';
import DonorHome from './pages/donor/DonorHome';
import PostDonation from './pages/donor/PostDonation';
import MatchResult from './pages/donor/MatchResult';
import LiveTracking from './pages/donor/LiveTracking';
import ReceiptsPage from './pages/donor/ReceiptsPage';
import DonorDonations from './pages/donor/DonorDonations';
import DonorProfile from './pages/donor/DonorProfile';

// Recipient Pages
import RecipientHome from './pages/recipient/RecipientHome';
import RecipientOffers from './pages/recipient/RecipientOffers';
import RecipientTracking from './pages/recipient/RecipientTracking';
import RecipientHistory from './pages/recipient/RecipientHistory';
import RecipientProfile from './pages/recipient/RecipientProfile';

// Driver Pages
import DriverHome from './pages/driver/DriverHome';
import DriverTasks from './pages/driver/DriverTasks';
import DriverHistory from './pages/driver/DriverHistory';
import DriverMap from './pages/driver/DriverMap';
import DriverProfile from './pages/driver/DriverProfile';

// Admin & Shared Pages
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminQueue from './pages/admin/AdminQueue';
import AdminSettings from './pages/admin/AdminSettings';
import ImpactDashboard from './pages/shared/ImpactDashboard';
import NotificationsPage from './pages/shared/NotificationsPage';

// PWA Install Banner — shows when browser fires beforeinstallprompt
function PWAInstallBanner() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [show, setShow] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      // Only show if not already installed
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches
        || window.navigator.standalone;
      if (!isStandalone && !sessionStorage.getItem('pwa_banner_dismissed')) {
        setTimeout(() => setShow(true), 3000); // Show after 3s
      }
    };
    window.addEventListener('beforeinstallprompt', handler);

    // Online/offline tracking
    const goOnline = () => setIsOnline(true);
    const goOffline = () => setIsOnline(false);
    window.addEventListener('online', goOnline);
    window.addEventListener('offline', goOffline);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
      window.removeEventListener('online', goOnline);
      window.removeEventListener('offline', goOffline);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') setShow(false);
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setShow(false);
    sessionStorage.setItem('pwa_banner_dismissed', '1');
  };

  return (
    <>
      {/* Offline strip */}
      {!isOnline && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, zIndex: 9999,
          background: '#1a1a2e', color: '#f5a623', padding: '8px 16px',
          display: 'flex', alignItems: 'center', gap: 8,
          fontSize: 13, fontWeight: 600, textAlign: 'center', justifyContent: 'center',
          borderBottom: '1px solid rgba(245,166,35,0.2)',
        }}>
          <span className="material-symbols-outlined" style={{ fontSize: 16 }}>wifi_off</span>
          Offline — showing cached data
        </div>
      )}

      {/* Install banner */}
      {show && (
        <div style={{
          position: 'fixed', bottom: 96, left: 12, right: 12, zIndex: 200,
          background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
          borderRadius: 20, padding: '16px 18px',
          boxShadow: '0 8px 40px rgba(0,0,0,0.5)',
          border: '1px solid rgba(252,128,25,0.25)',
          display: 'flex', alignItems: 'center', gap: 14,
          animation: 'slide-up 350ms cubic-bezier(0.23,1,0.32,1)',
        }}>
          <img src="/icon-192.png" alt="" style={{ width: 48, height: 48, borderRadius: 12, flexShrink: 0 }} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ color: 'white', fontWeight: 700, fontSize: 14, marginBottom: 2 }}>Add JanSeva to Home Screen</div>
            <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12, lineHeight: 1.4 }}>Works offline • Instant access • No app store needed</div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flexShrink: 0 }}>
            <button
              onClick={handleInstall}
              style={{
                background: 'var(--primary)', color: 'white', border: 'none',
                borderRadius: 10, padding: '8px 14px', fontSize: 13, fontWeight: 700,
                cursor: 'pointer', whiteSpace: 'nowrap',
              }}
            >
              Install
            </button>
            <button
              onClick={handleDismiss}
              style={{
                background: 'transparent', color: 'rgba(255,255,255,0.5)', border: 'none',
                fontSize: 11, cursor: 'pointer', padding: '2px 4px',
              }}
            >
              Not now
            </button>
          </div>
        </div>
      )}
    </>
  );
}


// Protected route
function Protected({ allowedRoles, redirectTo = '/' }) {
  const { user } = useApp();
  if (!user) return <Navigate to="/" replace />;
  if (allowedRoles && !allowedRoles.includes(user.role)) return <Navigate to={redirectTo} replace />;
  return <Outlet />;
}

function AppInner() {
  const { toast } = useApp();

  return (
    <>
      <Routes>
        {/* Onboarding */}
        <Route path="/" element={<RoleSelect />} />

        {/* Shared */}
        <Route path="/impact" element={<ImpactDashboard />} />
        <Route path="/notifications" element={<NotificationsPage />} />

        {/* Donor */}
        <Route element={<Protected allowedRoles={['donor']} />}>
          <Route path="/donor" element={<DonorHome />} />
          <Route path="/donor/post" element={<PostDonation />} />
          <Route path="/donor/match/:id" element={<MatchResult />} />
          <Route path="/donor/track/:id" element={<LiveTracking />} />
          <Route path="/donor/receipts" element={<ReceiptsPage />} />
          <Route path="/donor/donations" element={<DonorDonations />} />
          <Route path="/donor/profile" element={<DonorProfile />} />
        </Route>

        {/* Recipient */}
        <Route element={<Protected allowedRoles={['recipient']} />}>
          <Route path="/recipient" element={<RecipientHome />} />
          <Route path="/recipient/offers" element={<RecipientOffers />} />
          <Route path="/recipient/track/:id" element={<RecipientTracking />} />
          <Route path="/recipient/history" element={<RecipientHistory />} />
          <Route path="/recipient/profile" element={<RecipientProfile />} />
        </Route>

        {/* Driver */}
        <Route element={<Protected allowedRoles={['driver']} />}>
          <Route path="/driver" element={<DriverHome />} />
          <Route path="/driver/tasks" element={<DriverTasks />} />
          <Route path="/driver/history" element={<DriverHistory />} />
          <Route path="/driver/map" element={<DriverMap />} />
          <Route path="/driver/profile" element={<DriverProfile />} />
        </Route>

        {/* Admin */}
        <Route element={<Protected allowedRoles={['admin']} />}>
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/queue" element={<AdminQueue />} />
          <Route path="/admin/settings" element={<AdminSettings />} />
          <Route path="/official" element={<ImpactDashboard />} />
        </Route>

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>


      {/* PWA Install Banner + Offline indicator */}
      <PWAInstallBanner />

      {/* Global toast */}
      <Toast toast={toast} />
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppProvider>
        <ErrorBoundary>
          <AppInner />
        </ErrorBoundary>
      </AppProvider>
    </BrowserRouter>
  );
}
