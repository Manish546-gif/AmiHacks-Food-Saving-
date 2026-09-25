import { useState, useEffect, useCallback, useRef } from 'react';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const STORAGE_PREFIX = 'janseva_';

const EMPTY_DRAFT = {
  contact_name: '', designation: '', contact_phone: '', phone_verified: false,
  org_name: '', org_type: '', org_reg_number: '', org_pan: '',
  ngo_darpan_id: '', gstin: '',
  fssai_number: '', fssai_expiry: '', has_cold_chain: false, has_hygiene_cert: false,
  // Rider / Driver specific draft fields
  vehicle_type: 'two_wheeler', vehicle_number: '', dl_number: '',
  emergency_contact_name: '', emergency_contact_phone: '', service_zone: 'Kota Central',
  vehicle_capacity_kg: 50, has_insulated_bag: true, has_spill_proof_straps: true,
  insurance_valid: true, rider_safety_undertaking: false,
  address: '', pin_lat: null, pin_lng: null, premises_photo_key: null,
  consent_data_processing: false, consent_terms: false, food_handling_undertaking: false,
  declaration_signed: false,
  subject_type: 'donor', step: 0,
};

const DEFAULT_SEEDED_CASES = [
  {
    id: 'vc-001', subject_type: 'recipient', subject_id: 'r-1',
    level: 0, state: 'under_review', risk_score: 'low',
    submitted_at: new Date(Date.now() - 3600000 * 26).toISOString(),
    decided_at: null, valid_until: null, decision_reason: null,
    org_name: 'Asha Nilayam Trust', org_type: 'old_age_home',
    contact_name: 'Sister Mary Thomas', contact_phone: '+91 98761 11111',
    address: 'Behind Bus Stand, Kota',
    doc_count: 2, sla_hours_remaining: '22.0',
  },
  {
    id: 'vc-002', subject_type: 'donor', subject_id: 'user-1',
    level: 1, state: 'needs_changes', risk_score: 'medium',
    submitted_at: new Date(Date.now() - 3600000 * 10).toISOString(),
    decided_at: null, valid_until: null, decision_reason: 'FSSAI certificate renewal copy required',
    org_name: 'Royal Spice Kitchen', org_type: 'restaurant',
    contact_name: 'Manish Kumar', contact_phone: '+91 98760 11111',
    address: 'Talwandi, Kota, Rajasthan',
    doc_count: 2, sla_hours_remaining: '38.0',
  },
  {
    id: 'vc-003', subject_type: 'driver', subject_id: 'dr-1',
    level: 2, state: 'verified', risk_score: 'low',
    submitted_at: new Date(Date.now() - 3600000 * 72).toISOString(),
    decided_at: new Date(Date.now() - 3600000 * 48).toISOString(),
    valid_until: new Date(Date.now() + 3600000 * 24 * 365).toISOString(),
    org_name: 'Rahul Kumar (Rescue Rider)', org_type: 'two_wheeler',
    contact_name: 'Rahul Kumar', contact_phone: '+91 98762 11111',
    address: 'Vigyan Nagar, Kota',
    doc_count: 3, sla_hours_remaining: '0.0',
  },
  {
    id: 'vc-004', subject_type: 'recipient', subject_id: 'r-2',
    level: 0, state: 'submitted', risk_score: 'high',
    submitted_at: new Date(Date.now() - 3600000 * 2).toISOString(),
    decided_at: null, valid_until: null, decision_reason: null,
    org_name: 'Shishu Grih Child Care Home', org_type: 'cci',
    contact_name: 'Dr. Ramesh Meena', contact_phone: '+91 98761 22222',
    address: 'Dadabari, Kota',
    doc_count: 3, sla_hours_remaining: '46.0',
  },
];

function getLocalCases() {
  try {
    const raw = localStorage.getItem(STORAGE_PREFIX + 'verification_cases');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {}
  return DEFAULT_SEEDED_CASES;
}

function saveLocalCases(cases) {
  try {
    localStorage.setItem(STORAGE_PREFIX + 'verification_cases', JSON.stringify(cases));
    window.dispatchEvent(new CustomEvent('janseva_verification_sync', { detail: cases }));
  } catch (e) {}
}

export function syncOrgStorage(type, orgName, isApproved, status) {
  const plural = type === 'donor' ? 'donors' : type === 'recipient' ? 'recipients' : 'drivers';
  const keys = [
    STORAGE_PREFIX + plural,
    'surplus_to_shelter_state_v1_' + plural
  ];
  keys.forEach(key => {
    try {
      const raw = localStorage.getItem(key);
      if (raw) {
        const list = JSON.parse(raw);
        const next = list.map(item =>
          (item.name === orgName || item.id === 1 || item.id === '1')
            ? { ...item, verified: isApproved, verification_status: status }
            : item
        );
        localStorage.setItem(key, JSON.stringify(next));
      }
    } catch (e) {}
  });
  window.dispatchEvent(new Event('storage'));
}

export function approveCaseInstantDemo(caseId = 'vc-001') {
  const cases = getLocalCases();
  const target = cases.find(c => c.id === caseId || c.subject_id === caseId || (caseId === 'donor' && c.subject_type === 'donor') || (caseId === 'recipient' && c.subject_type === 'recipient'));
  if (!target) return false;

  const updatedCases = cases.map(c => {
    if (c.id === target.id) {
      return {
        ...c,
        state: 'verified',
        level: c.org_type === 'cci' ? 3 : 2,
        decision_reason: 'Approved by District Verification Operations Desk (Instant Demo)',
        decided_at: new Date().toISOString(),
        valid_until: new Date(Date.now() + 3600000 * 24 * 365).toISOString(),
      };
    }
    return c;
  });

  saveLocalCases(updatedCases);
  syncOrgStorage(target.subject_type, target.org_name, true, 'approved');
  addSystemNotification(
    target.subject_type,
    'Verification Approved! 🎉',
    `Congratulations! ${target.org_name} has been verified by the District Operations Desk. Food rescue & donation privileges are now active!`
  );
  return true;
}

function addSystemNotification(role, title, body, donationId = null) {
  try {
    const raw = localStorage.getItem(STORAGE_PREFIX + 'notifications');
    const list = raw ? JSON.parse(raw) : [];
    const newNotif = {
      id: Date.now() + Math.random(),
      role,
      title,
      body,
      donation_id: donationId,
      read: false,
      created_at: new Date().toISOString()
    };
    const updated = [newNotif, ...list];
    localStorage.setItem(STORAGE_PREFIX + 'notifications', JSON.stringify(updated));
    localStorage.setItem('surplus_to_shelter_state_v1_notifications', JSON.stringify(updated));
    window.dispatchEvent(new Event('storage'));
  } catch (e) {}
}

export function useVerification(userId = 'user-1', subjectType = 'donor') {
  const [verCase, setVerCase] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [checks, setChecks] = useState([]);
  const [draft, setDraft] = useState({ ...EMPTY_DRAFT, subject_type: subjectType });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const sseRef = useRef(null);

  // Fetch current state
  const refresh = useCallback(async () => {
    let cloudFound = false;
    try {
      const r = await fetch(`${API}/api/verification/me?user_id=${userId}`, { signal: AbortSignal.timeout(2000) });
      if (r.ok) {
        const data = await r.json();
        if (data.case) {
          setVerCase(data.case);
          setDraft(prev => ({ ...prev, ...data.case }));
          cloudFound = true;
        }
        setDocuments(data.documents || []);
        setChecks(data.checks || []);
      }
    } catch (e) {
      // Offline fallback
    }

    if (!cloudFound) {
      const allCases = getLocalCases();
      const local = allCases.find(c =>
        c.subject_id === userId ||
        c.subject_id === `user-${userId}` ||
        c.subject_id === `r-${userId}` ||
        c.subject_id === `dr-${userId}` ||
        c.subject_id === `driver-${userId}` ||
        c.subject_id === `recipient-${userId}` ||
        c.id === userId ||
        (subjectType === 'donor' && c.subject_type === 'donor') ||
        (subjectType === 'recipient' && c.subject_type === 'recipient') ||
        (subjectType === 'driver' && c.subject_type === 'driver')
      );
      if (local) {
        setVerCase(local);
        setDraft(prev => ({ ...prev, ...local }));
      }
    }
    setLoading(false);
  }, [userId, subjectType]);

  useEffect(() => {
    refresh();
    const handleSync = () => refresh();
    window.addEventListener('janseva_verification_sync', handleSync);
    return () => window.removeEventListener('janseva_verification_sync', handleSync);
  }, [refresh]);

  // SSE listener for real-time updates
  useEffect(() => {
    try {
      sseRef.current = new EventSource(`${API}/api/verification/events`);
      const handleEvent = (e) => {
        try {
          const data = JSON.parse(e.data);
          if (data.case_id === verCase?.id) refresh();
        } catch (err) {}
      };
      ['verification.approved', 'verification.changes_requested', 'verification.rejected', 'verification.suspended', 'verification.submitted'].forEach(ev => {
        sseRef.current.addEventListener(ev, handleEvent);
      });
      return () => sseRef.current?.close();
    } catch (e) {}
  }, [verCase?.id, refresh]);

  // Save draft
  const saveDraft = useCallback(async (updates = {}) => {
    setSaving(true);
    try {
      const merged = { ...draft, ...updates };
      setDraft(merged);
      try {
        await fetch(`${API}/api/verification/me/draft`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ user_id: userId, subject_type: subjectType, data: merged }),
          signal: AbortSignal.timeout(2000)
        });
      } catch (err) {}
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  }, [draft, userId, subjectType]);

  // Upload document
  const uploadDocument = useCallback(async (docType, file, meta = {}) => {
    const defaultIssuedBy = docType === 'driving_license'
      ? 'State Transport Authority (RTO Rajasthan)'
      : docType === 'vehicle_rc'
      ? 'Ministry of Road Transport & Highways'
      : docType === 'fssai'
      ? 'FSSAI Regional Office'
      : 'Govt of Rajasthan / Charity Commissioner';

    const docRecord = {
      id: `doc-${Date.now()}`,
      case_id: verCase?.id || `vc-${Date.now()}`,
      doc_type: docType,
      mime: file.type || 'application/pdf',
      size: file.size || 102400,
      number_last4: meta.number ? meta.number.slice(-4) : '1234',
      number: meta.number || null,
      expiry_date: meta.expiry_date || new Date(Date.now() + 3600000 * 24 * 365).toISOString(),
      issued_by: meta.issued_by || defaultIssuedBy,
      state: 'auto_checked',
      uploaded_at: new Date().toISOString(),
    };

    setDocuments(prev => [...prev.filter(d => d.doc_type !== docType), docRecord]);

    try {
      const body = {
        user_id: userId,
        doc_type: docType,
        mime: file.type || 'application/pdf',
        size: file.size || 102400,
        number_last4: meta.number ? meta.number.slice(-4) : null,
        number: meta.number || null,
        expiry_date: meta.expiry_date || null,
        issued_by: meta.issued_by || null,
        extracted_json: JSON.stringify({ name: meta.name || '', number: meta.number ? `***${meta.number.slice(-4)}` : '' }),
      };
      await fetch(`${API}/api/verification/me/documents`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(2000)
      });
    } catch (e) {}

    return { document: docRecord };
  }, [userId, verCase?.id]);

  const removeDocument = useCallback(async (docId) => {
    setDocuments(prev => prev.filter(d => d.id !== docId));
    try {
      await fetch(`${API}/api/verification/me/documents/${docId}?user_id=${userId}`, { method: 'DELETE', signal: AbortSignal.timeout(2000) });
    } catch (e) {}
  }, [userId]);

  // Submit to District Desk
  const submit = useCallback(async (autoVerify = false) => {
    setSubmitting(true);
    try {
      const now = new Date();
      const updatedCase = {
        id: verCase?.id || `vc-${Date.now().toString(36).toUpperCase()}`,
        subject_id: userId,
        subject_type: subjectType,
        org_name: draft.org_name || draft.contact_name || (subjectType === 'donor' ? 'Royal Spice Kitchen' : subjectType === 'driver' ? 'Rescue Volunteer Rider' : 'Asha Nilayam Trust'),
        org_type: draft.org_type || draft.vehicle_type || (subjectType === 'donor' ? 'restaurant' : subjectType === 'driver' ? 'two_wheeler' : 'old_age_home'),
        contact_name: draft.contact_name || 'Manish Kumar',
        contact_phone: draft.contact_phone || '+91 98760 11111',
        address: draft.address || 'Talwandi, Kota, Rajasthan',
        fssai_number: subjectType === 'donor' ? (draft.fssai_number || '12023019000452') : undefined,
        dl_number: subjectType === 'driver' ? (draft.dl_number || 'RJ20 20210012345') : undefined,
        vehicle_number: subjectType === 'driver' ? (draft.vehicle_number || 'RJ-20-AB-1234') : undefined,
        risk_score: 'low',
        state: autoVerify ? 'verified' : 'submitted',
        level: autoVerify ? 2 : 0,
        submitted_at: now.toISOString(),
        decided_at: autoVerify ? now.toISOString() : null,
        valid_until: autoVerify ? new Date(now.getTime() + 3600000 * 24 * 365).toISOString() : null,
        sla_hours_remaining: subjectType === 'driver' ? '2.0' : '48.0',
        doc_count: documents.length || (subjectType === 'driver' ? 3 : 2),
      };

      setVerCase(updatedCase);

      // 1. Update local cases list
      const allCases = getLocalCases();
      const nextCases = [updatedCase, ...allCases.filter(c => c.id !== updatedCase.id && c.subject_id !== userId)];
      saveLocalCases(nextCases);

      // 2. Notify Admin Queue
      addSystemNotification(
        'admin',
        'New Verification Dossier Submitted 📑',
        `${updatedCase.org_name} (${updatedCase.org_type}) submitted ${subjectType === 'driver' ? 'Driving License & RC' : subjectType === 'donor' ? 'KYC & FSSAI' : 'NGO Darpan & Welfare'} credentials for approval.`
      );

      // 3. Notify Applicant
      addSystemNotification(
        subjectType,
        'Dossier Under Review ⏳',
        `Your ${subjectType === 'driver' ? 'Rider verification' : 'verification'} documents were submitted to the Operations Desk. Turnaround SLA < 4 hours.`
      );

      // 4. Update Donor / Recipient / Driver verified status in local storage
      syncOrgStorage(subjectType, updatedCase.org_name, autoVerify, autoVerify ? 'approved' : 'pending_review');

      // 5. Try Cloud API in background
      try {
        await fetch(`${API}/api/verification/me/submit`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ user_id: userId, auto_verify: autoVerify }),
          signal: AbortSignal.timeout(2000)
        });
      } catch (e) {}

      return { case: updatedCase };
    } catch (e) {
      setError(e.message);
    } finally {
      setSubmitting(false);
    }
  }, [draft, userId, subjectType, verCase, documents.length]);

  const withdrawConsent = useCallback(async () => {
    try {
      await fetch(`${API}/api/verification/me/withdraw-consent`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId }),
        signal: AbortSignal.timeout(2000)
      });
    } catch (e) {}
  }, [userId]);

  const fileAppeal = useCallback(async (reason) => {
    try {
      await fetch(`${API}/api/verification/me/appeal`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId, reason }),
        signal: AbortSignal.timeout(2000)
      });
    } catch (e) {}
  }, [userId]);

  // Computed values
  const level = verCase?.level ?? 0;
  const state = verCase?.state ?? 'not_started';
  const canReceive = level >= 2 && state === 'verified';
  const canDonate = level >= 1 && state === 'verified';
  const canDeliver = level >= 1 && state === 'verified';

  return {
    verCase, documents, checks, draft, setDraft,
    loading, saving, submitting, error,
    refresh, saveDraft, uploadDocument, removeDocument, submit,
    withdrawConsent, fileAppeal,
    level, state, canReceive, canDonate, canDeliver,
  };
}

// Admin hook
export function useAdminVerification() {
  const [queue, setQueue] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ state: '', subject_type: '', risk_score: '' });
  const [selectedCase, setSelectedCase] = useState(null);
  const [caseDetail, setCaseDetail] = useState(null);
  const [deciding, setDeciding] = useState(false);

  const fetchQueue = useCallback(async () => {
    setLoading(true);
    let cases = getLocalCases();
    try {
      const params = new URLSearchParams(Object.fromEntries(Object.entries(filters).filter(([, v]) => v)));
      const r = await fetch(`${API}/api/admin/verification/admin/queue?${params}`, { signal: AbortSignal.timeout(2000) });
      if (r.ok) {
        const data = await r.json();
        if (data.cases && data.cases.length) {
          const remoteIds = new Set(data.cases.map(c => c.id));
          const localOnly = cases.filter(c => !remoteIds.has(c.id));
          cases = [...data.cases, ...localOnly];
        }
      }
    } catch (e) {}

    // Apply local filters
    if (filters.state) cases = cases.filter(c => c.state === filters.state);
    if (filters.subject_type) cases = cases.filter(c => c.subject_type === filters.subject_type);
    if (filters.risk_score) cases = cases.filter(c => c.risk_score === filters.risk_score);

    setQueue(cases);
    setTotal(cases.length);
    setLoading(false);
  }, [filters]);

  useEffect(() => {
    fetchQueue();
    const handleSync = () => fetchQueue();
    window.addEventListener('janseva_verification_sync', handleSync);
    return () => window.removeEventListener('janseva_verification_sync', handleSync);
  }, [fetchQueue]);

  const openCase = useCallback(async (id) => {
    setSelectedCase(id);
    const allCases = getLocalCases();
    const found = allCases.find(c => c.id === id);

    let mockDocs = [];
    let mockChecks = [];

    if (found?.subject_type === 'driver') {
      mockDocs = [
        { id: 'doc-1', doc_type: 'driving_license', file_key: 'demo/dl.pdf', number_last4: '2345', issued_by: 'RTO Kota Rajasthan', expiry_date: new Date(Date.now() + 3600000 * 24 * 730).toISOString(), state: 'approved', uploaded_at: new Date(Date.now() - 3600000 * 2).toISOString() },
        { id: 'doc-2', doc_type: 'vehicle_rc', file_key: 'demo/rc.jpg', number_last4: '1234', issued_by: 'MoRTH Vahan Registry', expiry_date: null, state: 'approved', uploaded_at: new Date(Date.now() - 3600000 * 2).toISOString() },
        { id: 'doc-3', doc_type: 'id_proof', file_key: 'demo/aadhaar.pdf', number_last4: '8890', issued_by: 'UIDAI', expiry_date: null, state: 'approved', uploaded_at: new Date(Date.now() - 3600000 * 2).toISOString() },
      ];
      mockChecks = [
        { id: 'chk-1', check_type: 'dl_validity', provider: 'sarathi_api', result: 'pass', detail_json: { valid: true, lmv_mcwg: true } },
        { id: 'chk-2', check_type: 'vahan_rc_match', provider: 'vahan_ocr', result: 'pass', detail_json: { match_score: 0.98, active_insurance: true } },
        { id: 'chk-3', check_type: 'road_safety_undertaking', provider: 'internal', result: 'pass', detail_json: { signed: true } },
      ];
    } else if (found?.subject_type === 'donor') {
      mockDocs = [
        { id: 'doc-1', doc_type: 'fssai', file_key: 'demo/fssai.pdf', number_last4: '0452', issued_by: 'FSSAI Kota Regional Office', expiry_date: new Date(Date.now() + 3600000 * 24 * 180).toISOString(), state: 'approved', uploaded_at: new Date(Date.now() - 3600000 * 4).toISOString() },
        { id: 'doc-2', doc_type: 'pan', file_key: 'demo/pan.jpg', number_last4: 'P456', issued_by: 'Income Tax Dept', expiry_date: null, state: 'approved', uploaded_at: new Date(Date.now() - 3600000 * 4).toISOString() },
      ];
      mockChecks = [
        { id: 'chk-1', check_type: 'fssai_format', provider: 'internal', result: 'pass', detail_json: { digits: 14, valid: true } },
        { id: 'chk-2', check_type: 'name_match', provider: 'ocr', result: 'pass', detail_json: { match_score: 0.96 } },
      ];
    } else {
      mockDocs = [
        { id: 'doc-1', doc_type: 'ngo_darpan', file_key: 'demo/darpan.pdf', number_last4: '9410', issued_by: 'NITI Aayog NGO Darpan', expiry_date: null, state: 'approved', uploaded_at: new Date(Date.now() - 3600000 * 6).toISOString() },
        { id: 'doc-2', doc_type: 'registration_cert', file_key: 'demo/12a.pdf', number_last4: '0481', issued_by: 'Govt of Rajasthan / Charity Commissioner', expiry_date: null, state: 'approved', uploaded_at: new Date(Date.now() - 3600000 * 6).toISOString() },
      ];
      mockChecks = [
        { id: 'chk-1', check_type: 'darpan_id_validity', provider: 'niti_aayog', result: 'pass', detail_json: { status: 'active', verified: true } },
        { id: 'chk-2', check_type: 'capacity_ratio', provider: 'internal', result: 'pass', detail_json: { headcount: 65, storage_ok: true } },
      ];
    }

    const mockDetail = {
      case: found,
      documents: mockDocs,
      checks: mockChecks,
      reviews: []
    };

    try {
      const r = await fetch(`${API}/api/admin/verification/admin/${id}`, { signal: AbortSignal.timeout(2000) });
      if (r.ok) {
        const data = await r.json();
        setCaseDetail(data);
        return;
      }
    } catch (e) {}

    setCaseDetail(mockDetail);
  }, []);

  const decide = useCallback(async (id, action, reason, docDecisions = {}) => {
    setDeciding(true);
    try {
      const allCases = getLocalCases();
      const targetCase = allCases.find(c => c.id === id);
      const stateMap = { approve: 'verified', changes: 'needs_changes', reject: 'rejected', suspend: 'suspended' };
      const nextState = stateMap[action] || 'verified';
      const isApproved = action === 'approve';

      const updatedCases = allCases.map(c => {
        if (c.id === id) {
          return {
            ...c,
            state: nextState,
            level: isApproved ? (c.org_type === 'cci' ? 3 : 2) : 0,
            decision_reason: reason || (isApproved ? 'Approved by District Verification Desk' : null),
            decided_at: new Date().toISOString(),
            valid_until: isApproved ? new Date(Date.now() + 3600000 * 24 * 365).toISOString() : null,
          };
        }
        return c;
      });

      saveLocalCases(updatedCases);

      // Update donor/recipient verified status in AppContext storage
      if (targetCase) {
        syncOrgStorage(targetCase.subject_type, targetCase.org_name, isApproved, isApproved ? 'approved' : nextState);

        // Notify applicant about decision
        addSystemNotification(
          targetCase.subject_type || 'donor',
          isApproved ? 'Verification Approved! 🎉' : action === 'changes' ? 'Verification Changes Requested ⚠️' : 'Verification Rejected ❌',
          isApproved
            ? `Congratulations! ${targetCase.org_name} has been verified by the District Operations Desk. Surplus donation and rescue privileges are now fully activated!`
            : `District Desk Notice: ${reason || 'Please review and re-upload required credentials in the verification portal.'}`
        );
      }

      try {
        await fetch(`${API}/api/admin/verification/admin/${id}/decision`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action, reason, doc_decisions: docDecisions, reviewer_id: 'admin-1' }),
          signal: AbortSignal.timeout(2000)
        });
      } catch (e) {}

      await fetchQueue();
      if (selectedCase === id) await openCase(id);
    } finally {
      setDeciding(false);
    }
  }, [fetchQueue, openCase, selectedCase]);

  const recheck = useCallback(async (id) => {
    try {
      await fetch(`${API}/api/admin/verification/admin/${id}/recheck`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reviewer_id: 'admin-1' }),
        signal: AbortSignal.timeout(2000)
      });
    } catch (e) {}
    if (selectedCase === id) await openCase(id);
  }, [openCase, selectedCase]);

  const resetDemo = useCallback(async () => {
    saveLocalCases(DEFAULT_SEEDED_CASES);
    try {
      await fetch(`${API}/api/admin/verification/admin/reset-demo`, { method: 'POST', signal: AbortSignal.timeout(2000) });
    } catch (e) {}
    await fetchQueue();
    setCaseDetail(null);
    setSelectedCase(null);
  }, [fetchQueue]);

  return { queue, total, loading, filters, setFilters, selectedCase, caseDetail, deciding, openCase, decide, recheck, resetDemo, fetchQueue };
}
