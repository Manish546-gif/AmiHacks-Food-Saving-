import { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';
import { matchDonation } from '../data/seed';

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
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [donations, setDonations] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY + '_donations');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [recipients, setRecipients] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY + '_recipients');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [drivers, setDrivers] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY + '_drivers');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [donors, setDonors] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY + '_donors');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [notifications, setNotifications] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY + '_notifications');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
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

  // Instant cross-tab sync via storage events and verification sync
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
      if ((e.key === STORAGE_KEY + '_donors' || e.key === 'janseva_donors') && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          if (Array.isArray(parsed)) setDonors(parsed);
        } catch (err) {}
      }
      if ((e.key === STORAGE_KEY + '_recipients' || e.key === 'janseva_recipients') && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          if (Array.isArray(parsed)) setRecipients(parsed);
        } catch (err) {}
      }
    };

    const handleVerificationSync = (e) => {
      try {
        const cases = e?.detail || JSON.parse(localStorage.getItem('janseva_verification_cases') || '[]');
        if (Array.isArray(cases)) {
          setDonors(prev => prev.map(d => {
            const match = cases.find(c => c.subject_type === 'donor' && (c.subject_id === `user-${d.id}` || c.subject_id === String(d.id) || d.id === 1));
            if (match) {
              const isApp = match.state === 'verified';
              return { ...d, verified: isApp, verification_status: isApp ? 'approved' : match.state };
            }
            return d;
          }));
          setRecipients(prev => prev.map(r => {
            const match = cases.find(c => c.subject_type === 'recipient' && (c.subject_id === `r-${r.id}` || c.subject_id === `recipient-${r.id}` || c.subject_id === String(r.id) || r.id === 1));
            if (match) {
              const isApp = match.state === 'verified';
              return { ...r, verified: isApp, verification_status: isApp ? 'approved' : match.state };
            }
            return r;
          }));
        }
      } catch (err) {}
    };

    window.addEventListener('storage', handleStorage);
    window.addEventListener('janseva_verification_sync', handleVerificationSync);
    // Initial evaluation
    handleVerificationSync();

    return () => {
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener('janseva_verification_sync', handleVerificationSync);
    };
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

  // Verification status check helpers
  const isDonorVerified = useCallback((donorId) => {
    const dId = donorId || user?.id || 1;
    const current = donors.find(d => Number(d.id) === Number(dId));
    try {
      const cases = JSON.parse(localStorage.getItem('janseva_verification_cases') || '[]');
      const match = cases.find(c => c.subject_type === 'donor' && (c.subject_id === `user-${dId}` || c.subject_id === String(dId) || dId === 1));
      if (match) {
        return match.state === 'verified';
      }
    } catch (e) {}
    return current?.verified === true && current?.verification_status !== 'needs_changes' && current?.verification_status !== 'pending_review';
  }, [donors, user]);

  const isRecipientVerified = useCallback((recipientId) => {
    const rId = recipientId || 1;
    const current = recipients.find(r => Number(r.id) === Number(rId));
    try {
      const cases = JSON.parse(localStorage.getItem('janseva_verification_cases') || '[]');
      const match = cases.find(c => c.subject_type === 'recipient' && (c.subject_id === `r-${rId}` || c.subject_id === `recipient-${rId}` || c.subject_id === String(rId) || rId === 1));
      if (match) {
        return match.state === 'verified';
      }
    } catch (e) {}
    return current?.verified === true && current?.verification_status !== 'needs_changes' && current?.verification_status !== 'under_review' && current?.verification_status !== 'submitted' && current?.verification_status !== 'pending_review';
  }, [recipients]);

  // Create Donation flow (immediately displayed on Shelter, Rider, and Admin dashboards)
  const createDonation = useCallback((donationData) => {
    const donorId = user?.id ?? 1;
    if (!isDonorVerified(donorId)) {
      showToast('Admin verification required before broadcasting surplus food.', 'warning');
      return null;
    }

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
      donor_id: donorId,
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
      driver_id: null,
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
      const next = [newDonation, ...prev.filter(d => Number(d.id) !== Number(newId))];
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
  }, [donations, recipients, user, isDonorVerified, showToast, addNotification]);

  // Recipient accepts offer
  const acceptOffer = useCallback((donationId, recipientId) => {
    const targetId = Number(donationId);
    const don = donations.find(d => Number(d.id) === targetId);
    if (!don) return false;

    // Check recipient verification
    const recipId = Number(recipientId || 1);
    if (!isRecipientVerified(recipId)) {
      showToast('Shelter verification required by Admin before accepting food rescue.', 'warning');
      return false;
    }

    // Check if offer has expired (1/4th safe window elapsed)
    if (don.status === 'escalated' || don.status === 'expired') {
      showToast('This offer has expired and can no longer be accepted.', 'error');
      return false;
    }
    if (don.offer_expires_at && Date.now() > new Date(don.offer_expires_at).getTime()) {
      expireOffer(targetId, 'Offer window elapsed (1/4th safe time expired before acceptance)');
      showToast('Offer window has ended (1/4th safe time elapsed). Offer expired.', 'error');
      return false;
    }

    const updatePayload = {
      status: 'shelter_accepted',
      matched_recipient_id: Number(recipientId),
      driver_id: null,
      shelter_accepted_at: new Date().toISOString(),
    };

    setDonations(prev => {
      const next = prev.map(d => {
        if (Number(d.id) === targetId) {
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
      const filtered = prev.filter(n => !(n.role === 'recipient' && Number(n.donation_id) === targetId));
      try {
        localStorage.setItem(STORAGE_KEY + '_notifications', JSON.stringify(filtered));
      } catch (e) {}
      return filtered;
    });

    apiFetch(`/donations/${targetId}`, { method: 'PATCH', body: JSON.stringify(updatePayload) });

    const recip = recipients.find(r => Number(r.id) === Number(recipientId)) || recipients[0];

    // Notify Driver: New rescue mission broadcast available to accept
    addNotification({
      role: 'driver',
      donation_id: targetId,
      title: 'New Rescue Mission Available! ⚡',
      body: `${recip?.name || 'Shelter'} accepted ${don?.qty_kg || ''} kg from ${don?.donor_name || 'Donor'}. Tap to accept mission.`,
    });

    // Notify Donor: Shelter accepted! Now finding volunteer rider.
    addNotification({
      role: 'donor',
      donation_id: targetId,
      title: 'Offer Accepted! 🎉',
      body: `${recip?.name || 'Shelter'} accepted your ${don?.description || 'food'} donation! Alerting nearby volunteer riders for pickup.`,
    });

    // Notify Recipient: Intake confirmed
    addNotification({
      role: 'recipient',
      donation_id: targetId,
      title: 'Intake Confirmed! 🍽️',
      body: `You accepted food from ${don?.donor_name || 'Donor'}. Alerting nearby volunteer riders for pickup.`,
    });

    showToast(`${recip?.name || 'Shelter'} accepted! Alerting nearby volunteer riders...`, 'check_circle');
    return true;
  }, [donations, recipients, addNotification, showToast, expireOffer]);

  // Driver accepts rescue mission
  const driverAcceptMission = useCallback((donationId, driverId = 1) => {
    const targetId = Number(donationId);
    const don = donations.find(d => Number(d.id) === targetId);
    if (!don) return false;

    const assignedDriver = drivers.find(d => Number(d.id) === Number(driverId)) || drivers[0];
    const updatePayload = {
      status: 'matched',
      driver_id: Number(driverId),
      driver_accepted_at: new Date().toISOString(),
      matched_at: new Date().toISOString(),
    };

    setDonations(prev => {
      const next = prev.map(d => {
        if (Number(d.id) === targetId) {
          return { ...d, ...updatePayload };
        }
        return d;
      });
      try {
        localStorage.setItem(STORAGE_KEY + '_donations', JSON.stringify(next));
      } catch (e) {}
      return next;
    });

    apiFetch(`/donations/${targetId}`, { method: 'PATCH', body: JSON.stringify(updatePayload) });

    // Notify Donor: Rider is assigned!
    addNotification({
      role: 'donor',
      donation_id: targetId,
      title: 'Volunteer Rider Assigned! 🛵',
      body: `${assignedDriver?.name || 'Volunteer rider'} accepted the pickup from your kitchen. Arriving in ~12 mins.`,
    });

    // Notify Shelter: Rider is assigned!
    addNotification({
      role: 'recipient',
      donation_id: targetId,
      title: 'Rider Heading for Pickup! 🛵',
      body: `${assignedDriver?.name || 'Volunteer rider'} accepted mission and is heading to ${don.donor_name || 'Donor'} for pickup.`,
    });

    showToast(`Rescue mission accepted! Heading to ${don?.donor_name || 'kitchen'} for pickup.`, 'two_wheeler');
    return true;
  }, [donations, drivers, addNotification, showToast]);

  // Recipient declines offer
  const declineOffer = useCallback((donationId, recipientId, reason = 'Capacity full') => {
    const targetId = Number(donationId);
    const nextRecip = recipients.find(r => Number(r.id) !== Number(recipientId) && r.accepting) || recipients[1];
    const updatePayload = {
      status: 'offered',
      matched_recipient_id: nextRecip?.id || null,
      driver_id: null,
    };

    setDonations(prev => {
      const next = prev.map(d => {
        if (Number(d.id) === targetId) {
          return { ...d, ...updatePayload };
        }
        return d;
      });
      try {
        localStorage.setItem(STORAGE_KEY + '_donations', JSON.stringify(next));
      } catch (e) {}
      return next;
    });

    apiFetch(`/donations/${targetId}`, { method: 'PATCH', body: JSON.stringify(updatePayload) });

    addNotification({
      role: 'admin',
      title: 'Offer Cascaded',
      body: `Shelter declined (#${targetId}): ${reason}. Rerouted to next available recipient.`,
    });

    showToast(`Declined. Automatically rerouted to next shelter.`, 'arrow_forward');
  }, [recipients, addNotification, showToast]);

  // Driver picks up
  const driverPickup = useCallback((donationId, notes = '') => {
    const targetId = Number(donationId);
    const updatePayload = {
      status: 'picked_up',
      picked_up_at: new Date().toISOString(),
      pickup_notes: notes
    };

    setDonations(prev => {
      const next = prev.map(d => {
        if (Number(d.id) === targetId) {
          return { ...d, ...updatePayload };
        }
        return d;
      });
      try {
        localStorage.setItem(STORAGE_KEY + '_donations', JSON.stringify(next));
      } catch (e) {}
      return next;
    });

    apiFetch(`/donations/${targetId}`, { method: 'PATCH', body: JSON.stringify(updatePayload) });

    const don = donations.find(d => Number(d.id) === targetId);
    addNotification({
      role: 'donor',
      donation_id: targetId,
      title: 'Food Picked Up! 🛵',
      body: `Rider collected ${don?.description || 'food'}. En route to shelter.`,
    });
    addNotification({
      role: 'recipient',
      donation_id: targetId,
      title: 'Rider In Transit! 📦',
      body: `Food has been picked up from ${don?.donor_name || 'donor'}. Arriving at gate shortly.`,
    });

    showToast('Pickup confirmed! Navigation to shelter active.', 'local_shipping');
  }, [donations, addNotification, showToast]);

  // Driver delivers food
  const driverDeliver = useCallback((donationId, otp = '8492') => {
    const targetId = Number(donationId);
    const don = donations.find(d => Number(d.id) === targetId);
    const qty = don?.qty_kg || 10;
    const recipId = don?.matched_recipient_id || 1;

    const updatePayload = {
      status: 'delivered',
      delivered_at: new Date().toISOString(),
      delivery_otp_verified: true,
      delivery_otp: otp || don?.delivery_otp || '8492',
    };

    setDonations(prev => {
      const next = prev.map(d => {
        if (Number(d.id) === targetId) {
          return { ...d, ...updatePayload };
        }
        return d;
      });
      try {
        localStorage.setItem(STORAGE_KEY + '_donations', JSON.stringify(next));
      } catch (e) {}
      return next;
    });

    apiFetch(`/donations/${targetId}`, { method: 'PATCH', body: JSON.stringify(updatePayload) });

    // Update shelter received metrics
    setRecipients(prev => {
      const nextRecips = prev.map(r => {
        if (Number(r.id) === Number(recipId)) {
          return {
            ...r,
            meals_received: (r.meals_received || 0) + (don?.est_meals || Math.round(qty * 2)),
            capacity_used_kg: Math.min(r.capacity_kg, (r.capacity_used_kg || 0) + qty),
            need_today_kg: Math.max(0, (r.need_today_kg || 0) - qty),
          };
        }
        return r;
      });
      try {
        localStorage.setItem(STORAGE_KEY + '_recipients', JSON.stringify(nextRecips));
      } catch (e) {}
      return nextRecips;
    });

    apiFetch(`/recipients/${recipId}`, { method: 'PATCH', body: JSON.stringify({
      meals_received: (don?.est_meals || Math.round(qty * 2)),
      capacity_used_kg: qty,
    }) });

    // Notify Donor with receipt
    addNotification({
      role: 'donor',
      donation_id: targetId,
      title: 'Delivery Complete! 80G Receipt Ready 📜',
      body: `${don?.description || 'Donation'} delivered safely. ${don?.est_meals || 20} meals served. Impact verified!`,
    });

    // Notify Recipient
    addNotification({
      role: 'recipient',
      donation_id: targetId,
      title: 'Intake Verified & Logged',
      body: `${qty} kg food received in good condition. Added to daily shelter audit.`,
    });

    showToast('Delivered successfully! Meals served 🎉', 'celebration');
    return true;
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
    setUser(null);
    setDonations([]);
    setRecipients([]);
    setDrivers([]);
    setDonors([]);
    setNotifications([]);
    await apiFetch('/reset', { method: 'POST' });
    showToast('App reset to empty state', 'restart_alt');
  }, [showToast]);

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
    meals_rescued: donations.filter(d => d.status === 'delivered').reduce((acc, d) => acc + (d.est_meals || 0), 0),
    kg_diverted: donations.filter(d => d.status === 'delivered').reduce((acc, d) => acc + (d.qty_kg || 0), 0),
    co2e_avoided: 0,
    children_fed: 0,
    daily_meals: [0, 0, 0, 0, 0, 0, 0],
    by_tier: [
      { tier: 'Tier 1', meals: 0, pct: 0 },
      { tier: 'Tier 2', meals: 0, pct: 0 },
      { tier: 'Tier 3', meals: 0, pct: 0 },
    ],
    top_donors: [],
    top_recipients: [],
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
    driverAcceptMission,
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
    isDonorVerified,
    isRecipientVerified,
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
