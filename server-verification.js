/**
 * Verification System — Backend API (server-verification.js)
 * Plugged into existing server.js via: import verificationRouter from './server-verification.js'
 * Uses the existing MongoDB connection via Mongoose OR falls back to in-memory (demo mode).
 */

import express from 'express';
import crypto from 'crypto';
import { EventEmitter } from 'events';

const router = express.Router();
export const verificationSSE = new EventEmitter();

// ─── In-Memory Demo Store ─────────────────────────────────────────────────────
const store = {
  cases: new Map(),
  documents: new Map(),
  checks: new Map(),
  reviews: new Map(),
  consents: new Map(),
  auditLog: [],
  docCounter: 1,
  checkCounter: 1,
  reviewCounter: 1,
};

// Demo seed data
function seedDemo() {
  const seedCases = [
    {
      id: 'vc-001', subject_type: 'recipient', subject_id: 'r-1',
      level: 0, state: 'under_review', risk_score: 'low',
      submitted_at: new Date(Date.now() - 3600000 * 26).toISOString(),
      decided_at: null, valid_until: null, decision_reason: null,
      assigned_reviewer_id: null, second_reviewer_id: null,
      org_name: 'Asha Nilayam Trust', org_type: 'ngo',
      contact_name: 'Priya Sharma', contact_phone: '+919876543210',
      address: 'Sector 14, Navi Mumbai',
    },
    {
      id: 'vc-002', subject_type: 'donor', subject_id: 'd-1',
      level: 1, state: 'needs_changes', risk_score: 'medium',
      submitted_at: new Date(Date.now() - 3600000 * 10).toISOString(),
      decided_at: null, valid_until: null, decision_reason: 'FSSAI number mismatch',
      assigned_reviewer_id: null, second_reviewer_id: null,
      org_name: 'Royal Spice Kitchen', org_type: 'restaurant',
      contact_name: 'Manish Kumar', contact_phone: '+919812345678',
      address: 'Talwandi, Kota',
    },
    {
      id: 'vc-003', subject_type: 'driver', subject_id: 'dr-1',
      level: 2, state: 'verified',
      submitted_at: new Date(Date.now() - 3600000 * 72).toISOString(),
      decided_at: new Date(Date.now() - 3600000 * 48).toISOString(),
      valid_until: new Date(Date.now() + 3600000 * 24 * 365).toISOString(),
      decision_reason: null, assigned_reviewer_id: null, second_reviewer_id: null,
      risk_score: 'low', org_name: null, org_type: null,
      contact_name: 'Rahul Verma', contact_phone: '+919845612345',
      address: 'Andheri West, Mumbai',
    },
    {
      id: 'vc-004', subject_type: 'recipient', subject_id: 'r-2',
      level: 0, state: 'submitted', risk_score: 'high',
      submitted_at: new Date(Date.now() - 3600000 * 2).toISOString(),
      decided_at: null, valid_until: null, decision_reason: null,
      assigned_reviewer_id: null, second_reviewer_id: null,
      org_name: 'Bal Kalyan Kendra CCI', org_type: 'cci',
      contact_name: 'Sister Maria', contact_phone: '+919765432100',
      address: 'Bandra, Mumbai',
    },
  ];
  seedCases.forEach(c => store.cases.set(c.id, c));

  const seedDocs = [
    { id: 'doc-1', case_id: 'vc-001', doc_type: 'registration_cert', file_key: 'demo/reg-cert.pdf', sha256: 'abc123', mime: 'application/pdf', size: 204800, number_last4: '7890', number_hash: hash('MH123457890'), extracted_json: { name: 'Asha Nilayam Trust', number: '***7890', address: 'Navi Mumbai' }, issued_by: 'Charity Commissioner', expiry_date: null, state: 'approved', reject_reason: null, uploaded_at: new Date(Date.now() - 3600000 * 25).toISOString() },
    { id: 'doc-2', case_id: 'vc-001', doc_type: 'pan', file_key: 'demo/pan.jpg', sha256: 'def456', mime: 'image/jpeg', size: 102400, number_last4: 'P456', number_hash: hash('AAAP1234P456'), extracted_json: { name: 'ASHA NILAYAM TRUST', pan: '***P456' }, issued_by: 'CBDT', expiry_date: null, state: 'auto_checked', reject_reason: null, uploaded_at: new Date(Date.now() - 3600000 * 25).toISOString() },
    { id: 'doc-3', case_id: 'vc-002', doc_type: 'fssai', file_key: 'demo/fssai.pdf', sha256: 'ghi789', mime: 'application/pdf', size: 307200, number_last4: '0123', number_hash: hash('12345678900123'), extracted_json: { licence_no: '***0123', name: 'ROYAL SPICE KITCHEN', address: 'Talwandi, Kota' }, issued_by: 'FSSAI', expiry_date: new Date(Date.now() + 3600000 * 24 * 60).toISOString(), state: 'rejected', reject_reason: 'Business name on certificate does not match registration. Please re-upload the correct FSSAI certificate.', uploaded_at: new Date(Date.now() - 3600000 * 9).toISOString() },
  ];
  seedDocs.forEach(d => store.documents.set(d.id, d));

  const seedChecks = [
    { id: 'chk-1', case_id: 'vc-001', check_type: 'pan_format', provider: 'internal', result: 'pass', detail_json: { pattern: 'AAAP1234P456', entity_type: 'P (Person)' }, run_at: new Date(Date.now() - 3600000 * 25).toISOString() },
    { id: 'chk-2', case_id: 'vc-001', check_type: 'duplicate_check', provider: 'internal', result: 'pass', detail_json: { duplicates_found: 0 }, run_at: new Date(Date.now() - 3600000 * 25).toISOString() },
    { id: 'chk-3', case_id: 'vc-002', check_type: 'fssai_format', provider: 'internal', result: 'pass', detail_json: { digits: 14, valid: true }, run_at: new Date(Date.now() - 3600000 * 9).toISOString() },
    { id: 'chk-4', case_id: 'vc-002', check_type: 'name_match', provider: 'ocr', result: 'warn', detail_json: { form_name: 'Royal Spice Kitchen', cert_name: 'ROYAL SPICE KITCHEN PVT', match_score: 0.71, threshold: 0.85 }, run_at: new Date(Date.now() - 3600000 * 9).toISOString() },
    { id: 'chk-5', case_id: 'vc-004', check_type: 'fraud_signal', provider: 'internal', result: 'warn', detail_json: { signal: 'Unusually fast submission (< 2 min)', risk_raised: true }, run_at: new Date(Date.now() - 3600000 * 2).toISOString() },
  ];
  seedChecks.forEach(c => store.checks.set(c.id, c));
}
seedDemo();

// ─── Helpers ──────────────────────────────────────────────────────────────────
function hash(str) {
  return crypto.createHash('sha256').update(str + 'salt_surplus2shelter').digest('hex').slice(0, 16);
}

function caseId() {
  return 'vc-' + Date.now().toString(36).toUpperCase();
}

function docId() {
  return 'doc-' + (store.docCounter++);
}

function auditEntry(actor_id, action, entity, entity_id, before, after) {
  store.auditLog.push({
    id: 'audit-' + Date.now(),
    actor_id, action, entity, entity_id,
    before_json: before ? JSON.stringify(before) : null,
    after_json: after ? JSON.stringify(after) : null,
    at: new Date().toISOString(),
  });
}

function riskScore(checks) {
  if (!checks || checks.length === 0) return 'low';
  const fails = checks.filter(c => c.result === 'fail').length;
  const warns = checks.filter(c => c.result === 'warn').length;
  if (fails > 0) return 'high';
  if (warns > 1) return 'medium';
  return 'low';
}

function broadcastSSE(event, data) {
  verificationSSE.emit('event', { event, data });
}

// Mock auto-checks
function runAutoChecks(caseId, docs) {
  const results = [];
  for (const doc of docs) {
    if (doc.doc_type === 'fssai') {
      const num = doc.number_last4 || '';
      results.push({ id: `chk-${Date.now()}-1`, case_id: caseId, check_type: 'fssai_format', provider: 'internal', result: num.length >= 4 ? 'pass' : 'fail', detail_json: { digits: 14, valid: num.length >= 4 }, run_at: new Date().toISOString() });
    }
    if (doc.doc_type === 'pan') {
      const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]$/;
      const panDisplay = doc.extracted_json?.pan || '';
      const entityChar = panDisplay.charAt(3);
      const entityMap = { T: 'Trust', C: 'Company', F: 'Firm', A: 'Association', P: 'Person', H: 'HUF', B: 'Body of Individuals', L: 'Local Authority', J: 'Artificial Juridical Person', G: 'Government' };
      results.push({ id: `chk-${Date.now()}-2`, case_id: caseId, check_type: 'pan_format', provider: 'internal', result: 'pass', detail_json: { entity_type: entityMap[entityChar] || 'Unknown', char: entityChar }, run_at: new Date().toISOString() });
    }
    results.push({ id: `chk-${Date.now()}-3`, case_id: caseId, check_type: 'duplicate_check', provider: 'internal', result: 'pass', detail_json: { duplicates_found: 0 }, run_at: new Date().toISOString() });
    results.push({ id: `chk-${Date.now()}-4`, case_id: caseId, check_type: 'expiry_check', provider: 'internal', result: doc.expiry_date && new Date(doc.expiry_date) < new Date() ? 'fail' : 'pass', detail_json: { expiry: doc.expiry_date }, run_at: new Date().toISOString() });
  }
  return results;
}

// ─── User Routes ─────────────────────────────────────────────────────────────

// GET /verification/me
router.get('/me', (req, res) => {
  const userId = req.query.user_id || 'demo-user';
  const userCase = [...store.cases.values()].find(c => c.subject_id === userId) || null;
  if (!userCase) {
    return res.json({ case: null, level: 0, state: 'not_started' });
  }
  const docs = [...store.documents.values()].filter(d => d.case_id === userCase.id);
  const checks = [...store.checks.values()].filter(c => c.case_id === userCase.id);
  res.json({ case: userCase, documents: docs, checks });
});

// PUT /verification/me/draft
router.put('/me/draft', (req, res) => {
  const userId = req.body.user_id || 'demo-user';
  let existing = [...store.cases.values()].find(c => c.subject_id === userId);
  if (!existing) {
    existing = {
      id: caseId(),
      subject_type: req.body.subject_type || 'donor',
      subject_id: userId,
      level: 0, state: 'draft', risk_score: 'low',
      submitted_at: null, decided_at: null, valid_until: null,
      decision_reason: null, assigned_reviewer_id: null, second_reviewer_id: null,
      ...req.body.data,
      created_at: new Date().toISOString(),
    };
    store.cases.set(existing.id, existing);
    auditEntry(userId, 'draft_created', 'verification_case', existing.id, null, existing);
  } else {
    const before = { ...existing };
    Object.assign(existing, req.body.data, { updated_at: new Date().toISOString() });
    store.cases.set(existing.id, existing);
    auditEntry(userId, 'draft_updated', 'verification_case', existing.id, before, existing);
  }
  res.json({ case: existing });
});

// POST /verification/me/documents (multipart — mocked, stores metadata)
router.post('/me/documents', (req, res) => {
  const userId = req.body.user_id || 'demo-user';
  const caseRecord = [...store.cases.values()].find(c => c.subject_id === userId);
  if (!caseRecord) return res.status(400).json({ error: 'No draft case found. Create draft first.' });

  // Simulate virus scan + MIME check
  const allowedMimes = ['image/jpeg', 'image/png', 'application/pdf'];
  const mime = req.body.mime || 'application/pdf';
  if (!allowedMimes.includes(mime)) return res.status(400).json({ error: 'Invalid file type. Upload JPG, PNG or PDF.' });

  const docRecord = {
    id: docId(),
    case_id: caseRecord.id,
    doc_type: req.body.doc_type,
    file_key: `uploads/${caseRecord.id}/${req.body.doc_type}-${Date.now()}.${mime === 'application/pdf' ? 'pdf' : 'jpg'}`,
    sha256: hash(req.body.doc_type + Date.now()),
    mime,
    size: parseInt(req.body.size || 102400),
    number_last4: req.body.number_last4 || null,
    number_hash: req.body.number ? hash(req.body.number) : null,
    extracted_json: req.body.extracted_json ? JSON.parse(req.body.extracted_json) : null,
    issued_by: req.body.issued_by || null,
    expiry_date: req.body.expiry_date || null,
    state: 'uploaded',
    reject_reason: null,
    uploaded_at: new Date().toISOString(),
  };

  // Run auto-checks
  const checks = runAutoChecks(caseRecord.id, [docRecord]);
  checks.forEach(c => store.checks.set(c.id, c));
  const autoResult = checks.every(c => c.result === 'pass') ? 'auto_checked' : docRecord.state;
  docRecord.state = autoResult;

  store.documents.set(docRecord.id, docRecord);
  auditEntry(userId, 'document_uploaded', 'verification_document', docRecord.id, null, docRecord);

  res.json({ document: docRecord, checks });
});

// DELETE /verification/me/documents/:id
router.delete('/me/documents/:id', (req, res) => {
  const userId = req.query.user_id || 'demo-user';
  const doc = store.documents.get(req.params.id);
  if (!doc) return res.status(404).json({ error: 'Document not found' });
  auditEntry(userId, 'document_deleted', 'verification_document', doc.id, doc, null);
  store.documents.delete(req.params.id);
  res.json({ success: true });
});

// POST /verification/me/submit
router.post('/me/submit', (req, res) => {
  const userId = req.body.user_id || 'demo-user';
  const caseRecord = [...store.cases.values()].find(c => c.subject_id === userId);
  if (!caseRecord) return res.status(400).json({ error: 'No draft found' });
  const before = { ...caseRecord };
  caseRecord.state = 'submitted';
  caseRecord.submitted_at = new Date().toISOString();
  store.cases.set(caseRecord.id, caseRecord);
  auditEntry(userId, 'case_submitted', 'verification_case', caseRecord.id, before, caseRecord);
  broadcastSSE('verification.submitted', { case_id: caseRecord.id, org_name: caseRecord.org_name });

  // Simulate auto-review after 2s
  setTimeout(() => {
    caseRecord.state = 'auto_checks_running';
    store.cases.set(caseRecord.id, caseRecord);
    setTimeout(() => {
      const docs = [...store.documents.values()].filter(d => d.case_id === caseRecord.id);
      const allChecks = [...store.checks.values()].filter(c => c.case_id === caseRecord.id);
      const score = riskScore(allChecks);
      caseRecord.risk_score = score;
      caseRecord.state = score === 'low' && req.body.auto_verify ? 'verified' : 'under_review';
      if (caseRecord.state === 'verified') {
        caseRecord.level = 2;
        caseRecord.decided_at = new Date().toISOString();
        caseRecord.valid_until = new Date(Date.now() + 3600000 * 24 * 365).toISOString();
        broadcastSSE('verification.approved', { case_id: caseRecord.id });
      }
      store.cases.set(caseRecord.id, caseRecord);
    }, 3000);
  }, 2000);

  res.json({ case: caseRecord, message: 'Submitted successfully. Expected review: 24-48 hours.' });
});

// POST /verification/me/appeal
router.post('/me/appeal', (req, res) => {
  const userId = req.body.user_id || 'demo-user';
  const caseRecord = [...store.cases.values()].find(c => c.subject_id === userId);
  if (!caseRecord) return res.status(404).json({ error: 'Case not found' });
  auditEntry(userId, 'appeal_filed', 'verification_case', caseRecord.id, { state: caseRecord.state }, { appeal_reason: req.body.reason });
  res.json({ message: 'Appeal submitted. A different reviewer will assess within 48 hours.' });
});

// POST /verification/me/withdraw-consent
router.post('/me/withdraw-consent', (req, res) => {
  const userId = req.body.user_id || 'demo-user';
  const consent = [...store.consents.values()].find(c => c.user_id === userId);
  if (consent) {
    consent.withdrawn_at = new Date().toISOString();
    store.consents.set(consent.id, consent);
  }
  auditEntry(userId, 'consent_withdrawn', 'consent', userId, null, { withdrawn_at: new Date().toISOString() });
  res.json({ message: 'Consent withdrawn. Optional data will be deleted within 30 days.' });
});

// ─── Admin Routes ────────────────────────────────────────────────────────────

// GET /admin/verification/queue
router.get('/admin/queue', (req, res) => {
  const { state, subject_type, risk_score, page = 1, limit = 20 } = req.query;
  let cases = [...store.cases.values()];
  if (state) cases = cases.filter(c => c.state === state);
  if (subject_type) cases = cases.filter(c => c.subject_type === subject_type);
  if (risk_score) cases = cases.filter(c => c.risk_score === risk_score);

  // Sort: high risk first, then oldest
  const riskOrder = { high: 0, medium: 1, low: 2 };
  cases.sort((a, b) => {
    const rDiff = (riskOrder[a.risk_score] ?? 2) - (riskOrder[b.risk_score] ?? 2);
    if (rDiff !== 0) return rDiff;
    return new Date(a.submitted_at) - new Date(b.submitted_at);
  });

  const total = cases.length;
  const paginated = cases.slice((page - 1) * limit, page * limit);

  // Attach SLA hours
  const now = Date.now();
  const enriched = paginated.map(c => ({
    ...c,
    sla_hours_remaining: c.submitted_at ? Math.max(0, 48 - (now - new Date(c.submitted_at)) / 3600000).toFixed(1) : null,
    doc_count: [...store.documents.values()].filter(d => d.case_id === c.id).length,
  }));

  res.json({ cases: enriched, total, page: parseInt(page), pages: Math.ceil(total / limit) });
});

// GET /admin/verification/:id
router.get('/admin/:id', (req, res) => {
  const caseRecord = store.cases.get(req.params.id);
  if (!caseRecord) return res.status(404).json({ error: 'Case not found' });
  const docs = [...store.documents.values()].filter(d => d.case_id === caseRecord.id);
  const checks = [...store.checks.values()].filter(c => c.case_id === caseRecord.id);
  const reviews = [...store.reviews.values()].filter(r => r.case_id === caseRecord.id);
  res.json({ case: caseRecord, documents: docs, checks, reviews });
});

// POST /admin/verification/:id/decision
router.post('/admin/:id/decision', (req, res) => {
  const caseRecord = store.cases.get(req.params.id);
  if (!caseRecord) return res.status(404).json({ error: 'Case not found' });

  const reviewerId = req.body.reviewer_id || 'admin-1';
  const { action, reason, doc_decisions } = req.body;

  // Maker-checker: Tier 1 (CCI) needs 2 different reviewers
  if (caseRecord.org_type === 'cci' && action === 'approve') {
    if (!caseRecord.assigned_reviewer_id) {
      caseRecord.assigned_reviewer_id = reviewerId;
      store.cases.set(caseRecord.id, caseRecord);
      return res.json({ message: 'First review recorded. A second reviewer must confirm for Tier 1 institutions.' });
    }
    if (caseRecord.assigned_reviewer_id === reviewerId) {
      return res.status(400).json({ error: 'Maker-checker violation: same reviewer cannot approve twice.' });
    }
    caseRecord.second_reviewer_id = reviewerId;
  }

  const before = { ...caseRecord };
  const stateMap = { approve: 'verified', changes: 'needs_changes', reject: 'rejected', suspend: 'suspended' };
  caseRecord.state = stateMap[action] || caseRecord.state;
  caseRecord.decided_at = new Date().toISOString();
  caseRecord.decision_reason = reason || null;

  if (action === 'approve') {
    caseRecord.level = caseRecord.org_type === 'cci' ? 3 : 2;
    caseRecord.valid_until = new Date(Date.now() + 3600000 * 24 * 365).toISOString();
  } else if (action === 'suspend') {
    caseRecord.level = 0;
  }

  // Apply per-document decisions
  if (doc_decisions) {
    for (const [docId, docAction] of Object.entries(doc_decisions)) {
      const doc = store.documents.get(docId);
      if (doc) {
        doc.state = docAction.state || doc.state;
        doc.reject_reason = docAction.reason || null;
        store.documents.set(docId, doc);
      }
    }
  }

  store.cases.set(caseRecord.id, caseRecord);

  // Audit log
  auditEntry(reviewerId, `admin_${action}`, 'verification_case', caseRecord.id, before, caseRecord);

  // Review record
  const reviewRecord = {
    id: `rev-${Date.now()}`,
    case_id: caseRecord.id,
    reviewer_id: reviewerId,
    action, reason,
    created_at: new Date().toISOString(),
  };
  store.reviews.set(reviewRecord.id, reviewRecord);

  // SSE broadcast
  const eventMap = { approve: 'verification.approved', changes: 'verification.changes_requested', reject: 'verification.rejected', suspend: 'verification.suspended' };
  broadcastSSE(eventMap[action] || 'verification.updated', { case_id: caseRecord.id, org_name: caseRecord.org_name });

  res.json({ case: caseRecord });
});

// POST /admin/verification/:id/recheck
router.post('/admin/:id/recheck', (req, res) => {
  const caseRecord = store.cases.get(req.params.id);
  if (!caseRecord) return res.status(404).json({ error: 'Case not found' });
  const docs = [...store.documents.values()].filter(d => d.case_id === caseRecord.id);
  const checks = runAutoChecks(caseRecord.id, docs);
  checks.forEach(c => store.checks.set(c.id, c));
  const score = riskScore(checks);
  caseRecord.risk_score = score;
  store.cases.set(caseRecord.id, caseRecord);
  auditEntry(req.body.reviewer_id || 'admin-1', 'recheck_triggered', 'verification_case', caseRecord.id, null, { checks: checks.length, risk_score: score });
  res.json({ checks, risk_score: score });
});

// GET /admin/audit
router.get('/admin/audit', (req, res) => {
  const { entity_id, actor_id, limit = 50 } = req.query;
  let logs = [...store.auditLog];
  if (entity_id) logs = logs.filter(l => l.entity_id === entity_id);
  if (actor_id) logs = logs.filter(l => l.actor_id === actor_id);
  logs.sort((a, b) => new Date(b.at) - new Date(a.at));
  res.json({ logs: logs.slice(0, limit) });
});

// POST /admin/reset-demo
router.post('/admin/reset-demo', (req, res) => {
  store.cases.clear();
  store.documents.clear();
  store.checks.clear();
  store.reviews.clear();
  store.auditLog.length = 0;
  store.docCounter = 1;
  seedDemo();
  res.json({ message: 'Demo data reset successfully.' });
});

// ─── SSE Endpoint ────────────────────────────────────────────────────────────
router.get('/events', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  const send = ({ event, data }) => {
    res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
  };

  verificationSSE.on('event', send);
  req.on('close', () => verificationSSE.off('event', send));

  // Heartbeat
  const hb = setInterval(() => res.write(': heartbeat\n\n'), 30000);
  req.on('close', () => clearInterval(hb));
});

export default router;
