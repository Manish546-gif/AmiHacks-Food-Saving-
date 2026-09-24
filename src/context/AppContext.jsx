import { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';
import { DONATIONS, RECIPIENTS, DRIVERS, DONORS, IMPACT_STATS, matchDonation } from '../data/seed';

const AppContext = createContext(null);

const STORAGE_KEY = 'surplus_to_shelter_state_v1';
const RAW_API_URL = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? 'https://amihacks-food-saving.onrender.com' : 'http://localhost:5000');
const API_BASE = `${RAW_API_URL.replace(/\/$/, '')}/api`;

// Safe API helper
async function apiFetch(endpoint, options = {}) {
  try {
    const res = await fetch(`${API_BASE}${endpoint}`, {
      headers: { 'Content-Type': 'application/json' },
      ...options,
    });
    if (!res.ok) return null;
    return await res.json();
  } catch (err) {
    return null; // Graceful fallback to local state
  }
}

export function AppProvider({ children }) {
  const [dbStatus, setDbStatus] = useState({ connected: false, provider: 'Local Reactive Sync' });

  // Load initial state from localStorage if available
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY + '_user');
      return saved ? JSON.parse(saved) : { role: 'donor', phone: '+91 98760 11111', name: 'Royal Spice Kitchen', id: 1 };
    } catch {
      return { role: 'donor', phone: '+91 98760 11111', name: 'Royal Spice Kitchen', id: 1 };
    }
  });

  const [donations, setDonations] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY + '_donations');
      return saved ? JSON.parse(saved) : DONATIONS;
    } catch {
      return DONATIONS;
    }
  });

  const [recipients, setRecipients] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY + '_recipients');
      return saved ? JSON.parse(saved) : RECIPIENTS;
    } catch {
      return RECIPIENTS;
    }
  });

  const [drivers, setDrivers] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY + '_drivers');
      return saved ? JSON.parse(saved) : DRIVERS;
    } catch {
      return DRIVERS;
    }
  });

  const [donors, setDonors] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY + '_donors');
      return saved ? JSON.parse(saved) : DONORS;
    } catch {
      return DONORS;
    }
  });

  const [notifications, setNotifications] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY + '_notifications');
      return saved ? JSON.parse(saved) : [
        { id: 1, role: 'donor', title: 'Match Found!', body: 'Asha Nilayam accepted your Veg Biryani donation.', read: false, created_at: new Date(Date.now() - 300000).toISOString() },
        { id: 2, role: 'donor', title: 'Delivery Complete', body: 'Dal Makhani delivered to Annapurna Rasoi. Receipt ready.', read: false, created_at: new Date(Date.now() - 3600000).toISOString() },
        { id: 3, role: 'driver', title: 'New Rescue Task', body: 'Pickup ready at Royal Spice Kitchen, Talwandi.', read: false, created_at: new Date(Date.now() - 120000).toISOString() },
        { id: 4, role: 'recipient', title: 'Incoming Food Offer', body: '18 kg Paneer Gravy & Dal Box offered to Asha Nilayam.', read: false, created_at: new Date(Date.now() - 60000).toISOString() },
      ];
    } catch {
      return [
        { id: 1, role: 'donor', title: 'Match Found!', body: 'Asha Nilayam accepted your Veg Biryani donation.', read: false, created_at: new Date(Date.now() - 300000).toISOString() },
        { id: 2, role: 'donor', title: 'Delivery Complete', body: 'Dal Makhani delivered to Annapurna Rasoi. Receipt ready.', read: false, created_at: new Date(Date.now() - 3600000).toISOString() },
      ];
    }
  });

  const [toast, setToast] = useState(null);
  const toastTimerRef = useRef(null);

  const showToast = useCallback((message, icon = 'check_circle') => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setToast({ message, icon });
    toastTimerRef.current = setTimeout(() => setToast(null), 3500);
  }, []);

  // Check backend health & sync from MongoDB on mount
  useEffect(() => {
    async function initDbSync() {
      const health = await apiFetch('/health');
      if (health && health.connected) {
        setDbStatus({ connected: true, provider: 'MongoDB Atlas', host: health.host });

        // Load initial records from MongoDB
        const [cloudDonations, cloudRecipients, cloudDrivers, cloudDonors, cloudNotifs] = await Promise.all([
          apiFetch('/donations'),
          apiFetch('/recipients'),
          apiFetch('/drivers'),
          apiFetch('/donors'),
          apiFetch('/notifications'),
        ]);

        if (cloudDonations?.length) setDonations(cloudDonations);
        if (cloudRecipients?.length) setRecipients(cloudRecipients);
        if (cloudDrivers?.length) setDrivers(cloudDrivers);
        if (cloudDonors?.length) setDonors(cloudDonors);
        if (cloudNotifs?.length) setNotifications(cloudNotifs);
      }
    }
    initDbSync();
  }, []);

  // Poll MongoDB every 3.5s to keep all dashboards live-synced
  useEffect(() => {
    const pollInterval = setInterval(async () => {
      const [cloudDonations, cloudNotifs] = await Promise.all([
        apiFetch('/donations'),
        apiFetch('/notifications'),
      ]);
      if (cloudDonations && Array.isArray(cloudDonations)) {
        setDonations(cloudDonations);
      }
      if (cloudNotifs && Array.isArray(cloudNotifs)) {
        setNotifications(cloudNotifs);
      }
    }, 3500);
    return () => clearInterval(pollInterval);
  }, []);

  // Instant cross-tab sync via storage events
  useEffect(() => {
    const handleStorage = (e) => {
      if (e.key === STORAGE_KEY + '_donations' && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          if (Array.isArray(parsed)) setDonations(parsed);
        } catch (err) {}
      }
      if (e.key === STORAGE_KEY + '_notifications' && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          if (Array.isArray(parsed)) setNotifications(parsed);
        } catch (err) {}
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  // Sync to localStorage as continuous backup
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY + '_user', JSON.stringify(user));
      localStorage.setItem(STORAGE_KEY + '_donations', JSON.stringify(donations));
      localStorage.setItem(STORAGE_KEY + '_recipients', JSON.stringify(recipients));
      localStorage.setItem(STORAGE_KEY + '_drivers', JSON.stringify(drivers));
      localStorage.setItem(STORAGE_KEY + '_donors', JSON.stringify(donors));
      localStorage.setItem(STORAGE_KEY + '_notifications', JSON.stringify(notifications));
    } catch (e) {
      console.warn('Storage sync failed:', e);
    }
  }, [user, donations, recipients, drivers, donors, notifications]);

  const addNotification = useCallback((notif) => {
    const newNotif = { id: Date.now() + Math.random(), read: false, created_at: new Date().toISOString(), ...notif };
    setNotifications(prev => [newNotif, ...prev]);
    apiFetch('/notifications', { method: 'POST', body: JSON.stringify(newNotif) });
  }, []);

  const login = useCallback((phone, role) => {
    const roleProfiles = {
      donor: { role: 'donor', name: 'Royal Spice Kitchen', phone: phone || '+91 98760 11111', id: 1 },
      recipient: { role: 'recipient', name: 'Asha Nilayam Old Age Home', phone: phone || '+91 98761 11111', id: 1 },
      driver: { role: 'driver', name: 'Rahul Kumar', phone: phone || '+91 98762 11111', id: 1 },
      admin: { role: 'admin', name: 'Kota Central Dispatcher', phone: phone || '+91 98763 00000', id: 99 },
    };
    const prof = roleProfiles[role] || { role, name: 'User', phone, id: 1 };
    setUser(prof);
    showToast(`Logged in as ${prof.name} (${role.toUpperCase()})`, 'verified_user');
  }, [showToast]);

  const switchRole = useCallback((newRole) => {
    login(null, newRole);
  }, [login]);

  const logout = useCallback(() => {
    setUser(null);
    showToast('Logged out successfully', 'logout');
  }, [showToast]);

  // Create Donation flow (immediately displayed on Shelter, Rider, and Admin dashboards)
  const createDonation = useCallback((donationData) => {
    const now = new Date();
    const readyAt = donationData.ready_at ? new Date(donationData.ready_at) : now;
    const safeHours = donationData.safe_hours ?? 4;
    const expiresAt = new Date(readyAt.getTime() + safeHours * 3600000);

    const peopleFed = Number(donationData.est_meals || donationData.qty_kg || 50);
    const newId = Math.max(0, ...donations.map(d => d.id || 0)) + 1;
    const targetShelter = recipients[0] || { id: 1, name: 'Asha Nilayam Old Age Home' };

    const newDonation = {
      id: newId,
      donor_id: user?.id ?? 1,
      donor_name: user?.name ?? 'Royal Spice Kitchen',
      ...donationData,
      qty_kg: donationData.qty_kg || peopleFed,
      est_meals: peopleFed,
      expires_at: expiresAt.toISOString(),
      status: 'offered', // Instantly available to shelters and riders!
      matched_recipient_id: targetShelter.id,
      driver_id: 1,
      match_score: 0.94,
      match_explanation: [
        `Tier 1 Priority Shelter (${targetShelter.name})`,
        'Dietary requirements verified ✓',
        `Ready to feed ${peopleFed} people tonight`,
      ],
      delivery_otp: '8492',
      created_at: now.toISOString(),
    };

    // Update state immediately so current tab and all screens see it instantly
    setDonations(prev => {
      const next = [newDonation, ...prev.filter(d => d.id !== newId)];
      try {
        localStorage.setItem(STORAGE_KEY + '_donations', JSON.stringify(next));
      } catch (e) {}
      return next;
    });

    // Notify shelter
    addNotification({
      role: 'recipient',
      title: `New Food Offer (${targetShelter.name})`,
      body: `${newDonation.description} (feeds ${peopleFed} people) offered by ${newDonation.donor_name}. Ready for acceptance!`,
    });

    // Notify driver
    addNotification({
      role: 'driver',
      title: 'Rescue Mission Available ⚡',
      body: `Pickup ${newDonation.description} (feeds ${peopleFed} people) for ${targetShelter.name}.`,
    });

    showToast(`Surplus posted! Matched with ${targetShelter.name} (Feeds ${peopleFed} people)`, 'volunteer_activism');

    // Post to MongoDB in background
    apiFetch('/donations', { method: 'POST', body: JSON.stringify(newDonation) })
      .then(saved => {
        if (saved && saved.id) {
          setDonations(prev => {
            const next = prev.map(d => d.id === newId ? { ...d, ...saved } : d);
            try {
              localStorage.setItem(STORAGE_KEY + '_donations', JSON.stringify(next));
            } catch (e) {}
            return next;
          });
        }
      });

    return newDonation;
  }, [donations, recipients, user, showToast, addNotification]);

  // Recipient accepts offer
  const acceptOffer = useCallback((donationId, recipientId) => {
    const updatePayload = { status: 'matched', matched_recipient_id: recipientId, driver_id: 1 };

    setDonations(prev => prev.map(d => {
      if (d.id === donationId) {
        return { ...d, ...updatePayload };
      }
      return d;
    }));

    apiFetch(`/donations/${donationId}`, { method: 'PATCH', body: JSON.stringify(updatePayload) });

    const don = donations.find(d => d.id === donationId);
    const recip = recipients.find(r => r.id === recipientId);

    // Notify Driver
    addNotification({
      role: 'driver',
      title: 'Rescue Mission Assigned! ⚡',
      body: `Pickup ${don?.qty_kg || ''} kg from ${don?.donor_name || 'Donor'} to ${recip?.name || 'Shelter'}. Route ready.`,
    });

    // Notify Donor
    addNotification({
      role: 'donor',
      title: 'Offer Accepted! 🛵',
      body: `${recip?.name || 'Shelter'} accepted your donation! Volunteer rider dispatched for pickup.`,
    });

    showToast(`Accepted offer! Volunteer rider assigned for pickup.`, 'check_circle');
  }, [donations, recipients, addNotification, showToast]);

  // Recipient declines offer
  const declineOffer = useCallback((donationId, recipientId, reason = 'Capacity full') => {
    const nextRecip = recipients.find(r => r.id !== recipientId && r.accepting) || recipients[1];
    const updatePayload = {
      status: 'offered',
      matched_recipient_id: nextRecip.id,
      driver_id: 1,
    };

    setDonations(prev => prev.map(d => {
      if (d.id === donationId) {
        return { ...d, ...updatePayload };
      }
      return d;
    }));

    apiFetch(`/donations/${donationId}`, { method: 'PATCH', body: JSON.stringify(updatePayload) });

    addNotification({
      role: 'admin',
      title: 'Offer Cascaded',
      body: `Shelter declined (#${donationId}): ${reason}. Rerouted to next available recipient.`,
    });

    showToast(`Declined. Automatically rerouted to next shelter.`, 'arrow_forward');
  }, [recipients, addNotification, showToast]);

  // Driver picks up
  const driverPickup = useCallback((donationId, notes = '') => {
    const updatePayload = { status: 'picked_up', picked_up_at: new Date().toISOString(), pickup_notes: notes };

    setDonations(prev => prev.map(d => {
      if (d.id === donationId) {
        return { ...d, ...updatePayload };
      }
      return d;
    }));

    apiFetch(`/donations/${donationId}`, { method: 'PATCH', body: JSON.stringify(updatePayload) });

    const don = donations.find(d => d.id === donationId);
    addNotification({
      role: 'donor',
      title: 'Food Picked Up! 🛵',
      body: `Rider collected ${don?.description || 'food'}. En route to shelter.`,
    });
    addNotification({
      role: 'recipient',
      title: 'Rider In Transit! 📦',
      body: `Food has been picked up from donor. Arriving in ~15 mins.`,
    });

    showToast('Pickup confirmed! Navigation to shelter active.', 'local_shipping');
  }, [donations, addNotification, showToast]);

  // Driver delivers food
  const driverDeliver = useCallback((donationId, otp = '8492') => {
    const don = donations.find(d => d.id === donationId);
    const qty = don?.qty_kg || 10;
    const recipId = don?.matched_recipient_id || 1;

    const updatePayload = {
      status: 'delivered',
      delivered_at: new Date().toISOString(),
      delivery_otp_verified: true,
    };

    setDonations(prev => prev.map(d => {
      if (d.id === donationId) {
        return { ...d, ...updatePayload };
      }
      return d;
    }));

    apiFetch(`/donations/${donationId}`, { method: 'PATCH', body: JSON.stringify(updatePayload) });

    // Update shelter received metrics
    setRecipients(prev => prev.map(r => {
      if (r.id === recipId) {
        const updated = {
          ...r,
          meals_received: (r.meals_received || 0) + (don?.est_meals || Math.round(qty * 2)),
          capacity_used_kg: Math.min(r.capacity_kg, (r.capacity_used_kg || 0) + qty),
          need_today_kg: Math.max(0, (r.need_today_kg || 0) - qty),
        };
        apiFetch(`/recipients/${recipId}`, { method: 'PATCH', body: JSON.stringify(updated) });
        return updated;
      }
      return r;
    }));

    // Notify Donor with receipt
    addNotification({
      role: 'donor',
      title: 'Delivery Complete! 80G Receipt Ready 📜',
      body: `${don?.description || 'Donation'} delivered safely. ${don?.est_meals || 20} meals served. Impact verified!`,
    });

    // Notify Recipient
    addNotification({
      role: 'recipient',
      title: 'Intake Verified & Logged',
      body: `${qty} kg food received in good condition. Added to daily shelter audit.`,
    });

    showToast('Delivered successfully! Meals served 🎉', 'celebration');
  }, [donations, addNotification, showToast]);

  // Update shelter capacity / acceptance toggle
  const updateShelter = useCallback((recipientId, updateData) => {
    setRecipients(prev => prev.map(r => r.id === recipientId ? { ...r, ...updateData } : r));
    apiFetch(`/recipients/${recipientId}`, { method: 'PATCH', body: JSON.stringify(updateData) });
    showToast('Shelter profile & intake settings updated', 'check');
  }, [showToast]);

  // Update driver details
  const updateDriver = useCallback((driverId, updateData) => {
    setDrivers(prev => prev.map(d => d.id === driverId ? { ...d, ...updateData } : d));
    apiFetch(`/drivers/${driverId}`, { method: 'PATCH', body: JSON.stringify(updateData) });
    showToast('Rider profile updated', 'check');
  }, [showToast]);

  // Update donor details
  const updateDonor = useCallback((donorId, updateData) => {
    setDonors(prev => prev.map(d => d.id === donorId ? { ...d, ...updateData } : d));
    if (user?.role === 'donor') {
      setUser(prev => ({ ...prev, ...updateData }));
    }
    apiFetch(`/donors/${donorId}`, { method: 'PATCH', body: JSON.stringify(updateData) });
    showToast('Donor profile updated', 'check');
  }, [user, showToast]);

  // Mark notification read
  const markNotificationRead = useCallback((id) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    apiFetch(`/notifications/${id}/read`, { method: 'PATCH' });
  }, []);

  const markAllNotificationsRead = useCallback(() => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  }, []);

  // Reset demo state
  const resetDemoData = useCallback(async () => {
    localStorage.removeItem(STORAGE_KEY + '_user');
    localStorage.removeItem(STORAGE_KEY + '_donations');
    localStorage.removeItem(STORAGE_KEY + '_recipients');
    localStorage.removeItem(STORAGE_KEY + '_drivers');
    localStorage.removeItem(STORAGE_KEY + '_donors');
    localStorage.removeItem(STORAGE_KEY + '_notifications');
    setDonations(DONATIONS);
    setRecipients(RECIPIENTS);
    setDrivers(DRIVERS);
    setDonors(DONORS);
    login('+91 98760 11111', 'donor');
    await apiFetch('/reset', { method: 'POST' });
    showToast('Database reset to clean initial state', 'restart_alt');
  }, [login, showToast]);

  // Dynamic calculated stats based on current state
  const dynamicImpactStats = {
    ...IMPACT_STATS,
    meals_rescued: IMPACT_STATS.meals_rescued + donations.filter(d => d.status === 'delivered').reduce((acc, d) => acc + (d.est_meals || 20), 0) - 100,
    kg_diverted: IMPACT_STATS.kg_diverted + donations.filter(d => d.status === 'delivered').reduce((acc, d) => acc + (d.qty_kg || 10), 0) - 50,
    active_donors: donors.length,
    active_recipients: recipients.filter(r => r.accepting).length,
    active_drivers: drivers.filter(d => d.available).length,
  };

  const unreadCount = notifications.filter(n => !n.read && (n.role === user?.role || !n.role)).length;

  const value = {
    user,
    login,
    logout,
    switchRole,
    donations,
    createDonation,
    acceptOffer,
    declineOffer,
    driverPickup,
    driverDeliver,
    recipients,
    updateShelter,
    drivers,
    updateDriver,
    donors,
    updateDonor,
    impactStats: dynamicImpactStats,
    notifications,
    markNotificationRead,
    markAllNotificationsRead,
    unreadCount,
    toast,
    showToast,
    resetDemoData,
    matchDonation,
    dbStatus,
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
