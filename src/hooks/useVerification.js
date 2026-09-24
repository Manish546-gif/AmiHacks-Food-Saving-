/**
 * useVerification — hook for all verification state management
 * Used by wizard steps, status screens and admin queue.
 */
import { useState, useEffect, useCallback, useRef } from 'react';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const EMPTY_DRAFT = {
  // Step 1 – Identity
  contact_name: '', designation: '', contact_phone: '', phone_verified: false,
  // Step 2 – Organisation
  org_name: '', org_type: '', org_reg_number: '', org_pan: '',
  ngo_darpan_id: '', gstin: '',
  // Step 3 – Documents (tracked separately via /documents API)
  // Step 4 – Food Safety
  fssai_number: '', fssai_expiry: '', has_cold_chain: false, has_hygiene_cert: false,
  // Step 5 – Location
  address: '', pin_lat: null, pin_lng: null, premises_photo_key: null,
  // Step 6 – Declarations
  consent_data_processing: false, consent_terms: false, food_handling_undertaking: false,
  declaration_signed: false,
  // Meta
  subject_type: 'donor', step: 0,
};

export function useVerification(userId = 'demo-user', subjectType = 'donor') {
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
    try {
      const r = await fetch(`${API}/api/verification/me?user_id=${userId}`);
      if (!r.ok) throw new Error('Failed to load verification status');
      const data = await r.json();
      if (data.case) {
        setVerCase(data.case);
        setDraft(prev => ({ ...prev, ...data.case }));
      }
      setDocuments(data.documents || []);
      setChecks(data.checks || []);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => { refresh(); }, [refresh]);

  // SSE listener for real-time updates
  useEffect(() => {
    sseRef.current = new EventSource(`${API}/api/verification/events`);
    const handleEvent = (e) => {
      const data = JSON.parse(e.data);
      if (data.case_id === verCase?.id) refresh();
    };
    ['verification.approved', 'verification.changes_requested', 'verification.rejected', 'verification.suspended'].forEach(ev => {
      sseRef.current.addEventListener(ev, handleEvent);
    });
    return () => sseRef.current?.close();
  }, [verCase?.id, refresh]);

  // Save draft
  const saveDraft = useCallback(async (updates = {}) => {
    setSaving(true);
    try {
      const merged = { ...draft, ...updates };
      setDraft(merged);
      await fetch(`${API}/api/verification/me/draft`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId, subject_type: subjectType, data: merged }),
      });
    } catch (e) { setError(e.message); }
    finally { setSaving(false); }
  }, [draft, userId, subjectType]);

  // Upload document (simulated for demo)
  const uploadDocument = useCallback(async (docType, file, meta = {}) => {
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
      const r = await fetch(`${API}/api/verification/me/documents`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await r.json();
      setDocuments(prev => [...prev.filter(d => d.doc_type !== docType), data.document]);
      setChecks(prev => [...prev, ...(data.checks || [])]);
      return data;
    } catch (e) { setError(e.message); }
  }, [userId]);

  const removeDocument = useCallback(async (docId) => {
    await fetch(`${API}/api/verification/me/documents/${docId}?user_id=${userId}`, { method: 'DELETE' });
    setDocuments(prev => prev.filter(d => d.id !== docId));
  }, [userId]);

  // Submit
  const submit = useCallback(async (autoVerify = false) => {
    setSubmitting(true);
    try {
      const r = await fetch(`${API}/api/verification/me/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId, auto_verify: autoVerify }),
      });
      const data = await r.json();
      setVerCase(data.case);
      return data;
    } catch (e) { setError(e.message); }
    finally { setSubmitting(false); }
  }, [userId]);

  const withdrawConsent = useCallback(async () => {
    await fetch(`${API}/api/verification/me/withdraw-consent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: userId }),
    });
  }, [userId]);

  const fileAppeal = useCallback(async (reason) => {
    await fetch(`${API}/api/verification/me/appeal`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: userId, reason }),
    });
  }, [userId]);

  // Computed values
  const level = verCase?.level ?? 0;
  const state = verCase?.state ?? 'not_started';
  const canReceive = level >= 2 && state === 'verified';
  const canDonate = level >= 1 && state === 'verified';

  return {
    verCase, documents, checks, draft, setDraft,
    loading, saving, submitting, error,
    refresh, saveDraft, uploadDocument, removeDocument, submit,
    withdrawConsent, fileAppeal,
    level, state, canReceive, canDonate,
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
    try {
      const params = new URLSearchParams(Object.fromEntries(Object.entries(filters).filter(([, v]) => v)));
      const r = await fetch(`${API}/api/admin/verification/admin/queue?${params}`);
      const data = await r.json();
      setQueue(data.cases || []);
      setTotal(data.total || 0);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [filters]);

  useEffect(() => { fetchQueue(); }, [fetchQueue]);

  const openCase = useCallback(async (id) => {
    setSelectedCase(id);
    const r = await fetch(`${API}/api/admin/verification/admin/${id}`);
    const data = await r.json();
    setCaseDetail(data);
  }, []);

  const decide = useCallback(async (id, action, reason, docDecisions = {}) => {
    setDeciding(true);
    try {
      await fetch(`${API}/api/admin/verification/admin/${id}/decision`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, reason, doc_decisions: docDecisions, reviewer_id: 'admin-1' }),
      });
      await fetchQueue();
      if (selectedCase === id) await openCase(id);
    } finally { setDeciding(false); }
  }, [fetchQueue, openCase, selectedCase]);

  const recheck = useCallback(async (id) => {
    await fetch(`${API}/api/admin/verification/admin/${id}/recheck`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ reviewer_id: 'admin-1' }) });
    if (selectedCase === id) await openCase(id);
  }, [openCase, selectedCase]);

  const resetDemo = useCallback(async () => {
    await fetch(`${API}/api/admin/verification/admin/reset-demo`, { method: 'POST' });
    await fetchQueue();
    setCaseDetail(null);
    setSelectedCase(null);
  }, [fetchQueue]);

  return { queue, total, loading, filters, setFilters, selectedCase, caseDetail, deciding, openCase, decide, recheck, resetDemo, fetchQueue };
}
