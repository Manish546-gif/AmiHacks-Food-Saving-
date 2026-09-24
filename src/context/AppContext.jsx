import { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';
import { DONATIONS, RECIPIENTS, DRIVERS, DONORS, IMPACT_STATS, matchDonation } from '../data/seed';

const AppContext = createContext(null);

const STORAGE_KEY = 'surplus_to_shelter_state_v1';
let resolvedApiBase = null;

function getCandidateUrls(endpoint) {
  const cleanEp = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const list = [];

  if (resolvedApiBase) {
    list.push(`${resolvedApiBase}${cleanEp}`);
  }

  if (typeof window !== 'undefined') {
    // 1. Relative /api (Proxied seamlessly by Vite dev server across ALL LAN devices, phones, tablets)
    list.push(`/api${cleanEp}`);

    // 2. Direct connection to same host on port 5000 (e.g. http://10.248.209.2:5000/api)
    if (window.location.hostname) {
      list.push(`${window.location.protocol}//${window.location.hostname}:5000/api${cleanEp}`);
    }

    // 3. Environment URL if configured
    const envUrl = import.meta.env.VITE_API_URL;
    if (envUrl) {
      const cleanEnv = envUrl.replace(/\/$/, '');
      const fullUrl = `${cleanEnv}/api${cleanEp}`;
      list.push(fullUrl);
    }

    // 4. Production cloud backend fallback
    list.push(`https://amihacks-food-saving.onrender.com/api${cleanEp}`);
  } else {
    list.push(`http://localhost:5000/api${cleanEp}`);
  }

  return [...new Set(list)];
}

// Resilient API helper with automatic multi-candidate fallback
async function apiFetch(endpoint, options = {}) {
  const candidates = getCandidateUrls(endpoint);
  for (const url of candidates) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3500);
      const res = await fetch(url, {
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        ...options,
      });
      clearTimeout(timeoutId);

      if (res.ok) {
        // Cache working base so future calls are instant
        const match = url.match(/^(https?:\/\/[^/]+(?:\/api)?|\/api)/);
        if (match) {
          resolvedApiBase = match[1].endsWith('/api') ? match[1] : `${match[1]}/api`;
        }
        return await res.json();
      }
    } catch (err) {
      // Continue to next candidate
    }
  }
  return null;
}

export function AppProvider({ children }) {
  const [dbStatus, setDbStatus] = useState({ connected: false, provider: 'Connecting to Cloud...' });

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

  // Sync data from cloud backend (used across all devices)
  const syncFromCloud = useCallback(async () => {
    try {
      const [cloudDonations, cloudNotifs, cloudRecipients] = await Promise.all([
        apiFetch('/donations'),
        apiFetch('/notifications'),
        apiFetch('/recipients'),
      ]);

      if (cloudDonations && Array.isArray(cloudDonations)) {
        setDonations(cloudDonations);
      }
      if (cloudNotifs && Array.isArray(cloudNotifs)) {
        setNotifications(cloudNotifs);
      }
      if (cloudRecipients && Array.isArray(cloudRecipients)) {
        setRecipients(cloudRecipients);
      }
    } catch (e) {
      console.warn('Sync error:', e);
    }
  }, []);

  // Check backend health & initial sync from MongoDB on mount
  useEffect(() => {
    async function initDbSync() {
      const health = await apiFetch('/health');
      if (health && health.connected) {
        setDbStatus({ connected: true, provider: 'MongoDB Atlas (Live Sync)', host: health.host });

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
      } else {
        setDbStatus({ connected: false, provider: 'Local Reactive Sync' });
      }
    }
    initDbSync();
  }, []);

  // Poll MongoDB every 2.5s to keep all devices live-synced
  useEffect(() => {
    const pollInterval = setInterval(syncFromCloud, 2500);

    // Instant refresh when device screen turns on or user switches tabs
    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        syncFromCloud();
      }
    };
    const onFocus = () => syncFromCloud();

    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', onVisibilityChange);

    return () => {
      clearInterval(pollInterval);
      window.removeEventListener('focus', onFocus);
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  }, [syncFromCloud]);

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

  // Expire an offer when 1/4th safe window elapses without acceptance
  const expireOffer = useCallback((donationId, reason = 'Offer window expired (1/4th safe window elapsed)') => {
    let affectedDonation = null;

    setDonations(prev => {
      const next = prev.map(d => {
        if (d.id === donationId && d.status === 'offered') {
          affectedDonation = {
            ...d,
            status: 'escalated',
            escalated_reason: reason,
            escalated_at: new Date().toISOString(),
          };
          return affectedDonation;
        }
        return d;
      });
      try {
        localStorage.setItem(STORAGE_KEY + '_donations', JSON.stringify(next));
      } catch (e) {}
      return next;
    });

    // Remove the notification of food from recipient offer section
    setNotifications(prev => {
      const filtered = prev.filter(n => !(n.role === 'recipient' && n.donation_id === donationId));
      try {
        localStorage.setItem(STORAGE_KEY + '_notifications', JSON.stringify(filtered));
      } catch (e) {}
      return filtered;
    });

    apiFetch(`/donations/${donationId}`, {
      method: 'PATCH',
      body: JSON.stringify({ status: 'escalated', escalated_reason: reason }),
    });

    const target = affectedDonation || donations.find(d => d.id === donationId);
    const windowDesc = target?.offer_window_hours ? `${target.offer_window_hours}h` : '1h';

    // Notify donor that no shelter accepted within 1/4th window
    const expiryNotif = {
      id: Date.now() + Math.random(),
      donation_id: donationId,
      role: 'donor',
      title: 'No Shelter Accepted — Escalated ⚠️',
      body: `No shelter accepted "${target?.description || 'food'}" within the 1/4th safe window (${windowDesc}). Escalated to city emergency dispatch & compost partner.`,
      read: false,
      created_at: new Date().toISOString(),
    };
    setNotifications(prev => [expiryNotif, ...prev]);
    apiFetch('/notifications', { method: 'POST', body: JSON.stringify(expiryNotif) });

    showToast(`1/4th safe window ended — offer escalated to dispatcher`, 'warning');
  }, [donations, showToast]);

  // Demo helper: fast-forward timer to test timeout without waiting full duration
  const fastForwardOfferTimer = useCallback((donationId, secondsRemaining = 5) => {
    const newExpiresAt = new Date(Date.now() + secondsRemaining * 1000).toISOString();
    setDonations(prev => prev.map(d => {
      if (d.id === donationId) {
        return { ...d, offer_expires_at: newExpiresAt };
      }
      return d;
    }));
    showToast(`Fast-forwarded to ${secondsRemaining}s remaining (Demo)`, 'fast_forward');
  }, [showToast]);

  // Create Donation flow (immediately displayed on Shelter, Rider, and Admin dashboards)
  const createDonation = useCallback((donationData) => {
    const now = new Date();
    const readyAt = donationData.ready_at ? new Date(donationData.ready_at) : now;
    const safeHours = Number(donationData.safe_hours ?? 4);
    const expiresAt = new Date(readyAt.getTime() + safeHours * 3600000);

    // 1/4th of max safe time of food for matching & acceptance window
    const offerWindowHours = donationData.offer_window_hours ?? (safeHours / 4);
    const offerWindowMs = offerWindowHours * 3600000;
    const offerExpiresAt = donationData.offer_expires_at
      ? new Date(donationData.offer_expires_at)
      : new Date(now.getTime() + offerWindowMs);

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
      safe_hours: safeHours,
      expires_at: expiresAt.toISOString(),
      offer_window_hours: offerWindowHours,
      offer_expires_at: offerExpiresAt.toISOString(),
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

    const windowLabel = offerWindowHours >= 1 ? `${offerWindowHours}h` : `${Math.round(offerWindowHours * 60)}m`;

    // Notify shelter with expiration time attached
    addNotification({
      role: 'recipient',
      donation_id: newId,
      expires_at: offerExpiresAt.toISOString(),
      title: `New Food Offer (${targetShelter.name})`,
      body: `${newDonation.description} (feeds ${peopleFed} people) offered by ${newDonation.donor_name}. Safe for ${safeHours}h • Acceptance window: ${windowLabel}.`,
    });

    // Notify driver
    addNotification({
      role: 'driver',
      donation_id: newId,
      title: 'Rescue Mission Available ⚡',
      body: `Pickup ${newDonation.description} (feeds ${peopleFed} people) for ${targetShelter.name}.`,
    });

    showToast(`Surplus posted! Broadcasted to shelters (Acceptance window: ${windowLabel})`, 'volunteer_activism');

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
    const don = donations.find(d => d.id === donationId);
    if (!don) return false;

    // Check if offer has expired (1/4th safe window elapsed)
    if (don.status === 'escalated' || don.status === 'expired') {
      showToast('This offer has expired and can no longer be accepted.', 'error');
      return false;
    }
    if (don.offer_expires_at && Date.now() > new Date(don.offer_expires_at).getTime()) {
      expireOffer(donationId, 'Offer window elapsed (1/4th safe time expired before acceptance)');
      showToast('Offer window has ended (1/4th safe time elapsed). Offer expired.', 'error');
      return false;
    }

    const updatePayload = {
      status: 'matched',
      matched_recipient_id: recipientId,
      driver_id: 1,
      matched_at: new Date().toISOString(),
    };

    setDonations(prev => {
      const next = prev.map(d => {
        if (d.id === donationId) {
          return { ...d, ...updatePayload };
        }
        return d;
      });
      try {
        localStorage.setItem(STORAGE_KEY + '_donations', JSON.stringify(next));
      } catch (e) {}
      return next;
    });

    // Remove active offer notification for recipient since it has been accepted
    setNotifications(prev => {
      const filtered = prev.filter(n => !(n.role === 'recipient' && n.donation_id === donationId));
      try {
        localStorage.setItem(STORAGE_KEY + '_notifications', JSON.stringify(filtered));
      } catch (e) {}
      return filtered;
    });

    apiFetch(`/donations/${donationId}`, { method: 'PATCH', body: JSON.stringify(updatePayload) });

    const recip = recipients.find(r => r.id === recipientId) || recipients[0];

    // Notify Driver
    addNotification({
      role: 'driver',
      donation_id: donationId,
      title: 'Rescue Mission Assigned! ⚡',
      body: `Pickup ${don?.qty_kg || ''} kg from ${don?.donor_name || 'Donor'} to ${recip?.name || 'Shelter'}. Route ready.`,
    });

    // Notify Donor: Show donor the notification that acceptor accepted the food!
    addNotification({
      role: 'donor',
      donation_id: donationId,
      title: 'Offer Accepted! 🎉',
      body: `${recip?.name || 'Shelter'} accepted your ${don?.description || 'food'} donation! Volunteer rider dispatched for pickup.`,
    });

    showToast(`${recip?.name || 'Shelter'} accepted your offer! Volunteer rider assigned.`, 'check_circle');
    return true;
  }, [donations, recipients, addNotification, showToast, expireOffer]);

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

  // Auto-expire offers whose 1/4th safe window has elapsed without acceptance
  useEffect(() => {
    const timer = setInterval(() => {
      const now = Date.now();
      donations.forEach(d => {
        if (d.status === 'offered' && d.offer_expires_at) {
          if (now >= new Date(d.offer_expires_at).getTime()) {
            expireOffer(d.id, '1/4th safe time window ended with no shelter acceptance');
          }
        }
      });

      // Clean up expired recipient notifications
      setNotifications(prev => {
        const filtered = prev.filter(n => {
          if (n.role === 'recipient' && n.expires_at && now >= new Date(n.expires_at).getTime()) {
            return false;
          }
          return true;
        });
        if (filtered.length !== prev.length) {
          try {
            localStorage.setItem(STORAGE_KEY + '_notifications', JSON.stringify(filtered));
          } catch (e) {}
          return filtered;
        }
        return prev;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [donations, expireOffer]);

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
    expireOffer,
    fastForwardOfferTimer,
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
    refreshData: syncFromCloud,
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
