import React, { Component } from 'react';
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

// Quick Role Switcher Floating Bar (visible on all screens except onboarding)
function QuickRoleSwitcher() {
  const { user, switchRole } = useApp();
  const location = useLocation();
  const navigate = useNavigate();

  if (location.pathname === '/') return null;

  const roles = [
    { id: 'donor', label: 'Donor', icon: 'restaurant', path: '/donor', color: 'var(--primary)' },
    { id: 'recipient', label: 'Shelter', icon: 'volunteer_activism', path: '/recipient', color: 'var(--secondary)' },
    { id: 'driver', label: 'Rider', icon: 'two_wheeler', path: '/driver', color: 'var(--tertiary)' },
    { id: 'admin', label: 'Admin', icon: 'shield_with_heart', path: '/admin', color: '#6366f1' },
  ];

  const handleSwitch = (r) => {
    switchRole(r.id);
    navigate(r.path);
  };

  return (
    <div style={{
      position: 'fixed',
      bottom: 64, // Just above the bottom nav
      left: '50%',
      transform: 'translateX(-50%)',
      zIndex: 60,
      background: 'rgba(22, 27, 45, 0.94)',
      backdropFilter: 'blur(16px)',
      WebkitBackdropFilter: 'blur(16px)',
      borderRadius: 999,
      padding: '4px 6px',
      display: 'flex',
      alignItems: 'center',
      gap: 4,
      boxShadow: '0 8px 30px rgba(0,0,0,0.3)',
      border: '1px solid rgba(255,255,255,0.15)',
    }}>
      <span style={{ fontSize: 10, fontWeight: 800, color: 'rgba(255,255,255,0.6)', paddingLeft: 6, paddingRight: 2, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
        Switch:
      </span>
      {roles.map(r => {
        const active = user?.role === r.id;
        return (
          <button
            key={r.id}
            onClick={() => handleSwitch(r)}
            style={{
              padding: '4px 10px',
              borderRadius: 999,
              border: 'none',
              background: active ? r.color : 'transparent',
              color: active ? 'white' : 'rgba(255,255,255,0.75)',
              fontSize: 11,
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              transition: 'all 180ms ease-out',
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 13, fontVariationSettings: "'FILL' 1" }}>
              {r.icon}
            </span>
            <span>{r.label}</span>
          </button>
        );
      })}
    </div>
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

      {/* Quick Role Switcher Bar */}
      <QuickRoleSwitcher />

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
