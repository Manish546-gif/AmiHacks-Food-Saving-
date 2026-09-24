import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { TopBar, BottomNav, TierBadge } from '../../components/Navigation';
import { useAdminVerification } from '../../hooks/useVerification';

export default function AdminQueue() {
  const navigate = useNavigate();
  const { donations, recipients, drivers, acceptOffer, declineOffer, showToast } = useApp();

  // Primary mode: 'dispatch' (flight queue) vs 'verification' (legal & KYC desk)
  const [activeMode, setActiveMode] = useState('dispatch');

  // Dispatch Queue State
  const [filter, setFilter] = useState('all');
  const [selectedDonation, setSelectedDonation] = useState(null);
  const [overrideRecipientId, setOverrideRecipientId] = useState(1);
  const [overrideDriverId, setOverrideDriverId] = useState(1);

  // Verification Desk Hook
  const {
    queue: verCases,
    total: verTotal,
    loading: verLoading,
    filters: verFilters,
    setFilters: setVerFilters,
    selectedCase,
    caseDetail,
    deciding,
    openCase,
    decide,
    recheck,
    resetDemo,
  } = useAdminVerification();

  const [inspectModalOpen, setInspectModalOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectInput, setShowRejectInput] = useState(false);

  const filteredDonations = donations.filter(d => {
    if (filter === 'all') return true;
    if (filter === 'active') return ['posted', 'offered', 'matched', 'picked_up'].includes(d.status);
    if (filter === 'escalated') return d.status === 'escalated' || d.status === 'posted';
    if (filter === 'delivered') return d.status === 'delivered';
    return d.status === filter;
  });

  const handleManualDispatch = () => {
    if (!selectedDonation) return;
    acceptOffer(selectedDonation.id, Number(overrideRecipientId));
    showToast(`Manual Dispatch: Routed #${selectedDonation.id} to shelter #${overrideRecipientId}`, 'alt_route');
    setSelectedDonation(null);
  };

  const handleOpenCaseModal = async (id) => {
    await openCase(id);
    setInspectModalOpen(true);
    setShowRejectInput(false);
    setRejectionReason('');
  };

  const handleDecision = async (id, action) => {
    if (action === 'changes' && !rejectionReason.trim()) {
      showToast('Please specify the reason for requesting document changes', 'warning');
      return;
    }
    await decide(id, action, rejectionReason || undefined);
    showToast(
      action === 'approve' ? 'Case approved & verified!' :
      action === 'changes' ? 'Changes requested from institution' :
      'Case rejected',
      action === 'approve' ? 'verified' : 'info'
    );
    setInspectModalOpen(false);
  };

  return (
    <div style={{ minHeight: '100dvh', background: 'var(--surface)', display: 'flex', flexDirection: 'column' }}>
      <TopBar title="Operations & Compliance" subtitle="Surplus-to-Shelter" />

      <main style={{ flex: 1, paddingTop: 68, paddingBottom: 100, overflowY: 'auto' }}>
        {/* Main Section Switcher Tabs */}
        <div style={{ padding: '8px 16px 14px' }}>
          <div style={{
            background: 'var(--surface-container-high)',
            borderRadius: 16,
            padding: 4,
            display: 'flex',
            gap: 4,
          }}>
            <button
              onClick={() => setActiveMode('dispatch')}
              style={{
                flex: 1, height: 42, borderRadius: 12, border: 'none', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                background: activeMode === 'dispatch' ? 'white' : 'transparent',
                color: activeMode === 'dispatch' ? 'var(--on-surface)' : 'var(--on-surface-variant)',
                fontWeight: 800, fontSize: 13,
                boxShadow: activeMode === 'dispatch' ? '0 2px 8px rgba(0,0,0,0.08)' : 'none',
                transition: 'all 200ms ease'
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 18, color: 'var(--primary)' }}>local_shipping</span>
              <span>Dispatch SLA ({donations.filter(d => ['posted', 'offered'].includes(d.status)).length})</span>
            </button>

            <button
              onClick={() => setActiveMode('verification')}
              style={{
                flex: 1, height: 42, borderRadius: 12, border: 'none', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                background: activeMode === 'verification' ? 'white' : 'transparent',
                color: activeMode === 'verification' ? 'var(--on-surface)' : 'var(--on-surface-variant)',
                fontWeight: 800, fontSize: 13,
                boxShadow: activeMode === 'verification' ? '0 2px 8px rgba(0,0,0,0.08)' : 'none',
                transition: 'all 200ms ease'
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 18, color: 'var(--tertiary)' }}>verified_user</span>
              <span>Verification Desk ({verTotal || verCases.length})</span>
            </button>
          </div>
        </div>

        {/* ════════════════════ MODE 1: DISPATCH QUEUE ════════════════════ */}
        {activeMode === 'dispatch' && (
          <>
            {/* Urgent Operations Bar */}
            <div style={{ padding: '0 16px 12px' }}>
              <div style={{
                background: 'linear-gradient(135deg, #161b2d, #2b2f43)',
                color: 'white', borderRadius: 18, padding: 16,
                display: 'flex', justifyContent: 'space-between', alignItems: 'center'
              }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span className="material-symbols-outlined" style={{ color: '#ffb689' }}>emergency</span>
                    <span className="text-label-md" style={{ fontWeight: 800, color: '#ffb689', textTransform: 'uppercase' }}>
                      Live Dispatch SLA
                    </span>
                  </div>
                  <div className="text-headline-sm" style={{ margin: '4px 0 0', color: 'white' }}>
                    {donations.filter(d => ['posted', 'offered'].includes(d.status)).length} Pending Dispatch
                  </div>
                </div>

                <button
                  onClick={() => showToast('Emergency SMS broadcast sent to 4 active Kota riders!', 'campaign')}
                  style={{
                    padding: '8px 14px', borderRadius: 12, border: 'none',
                    background: 'var(--primary)', color: 'white', fontWeight: 800, fontSize: 12,
                    cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
                    boxShadow: '0 4px 12px rgba(252,128,25,0.4)'
                  }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 16 }}>campaign</span>
                  <span>Broadcast SOS</span>
                </button>
              </div>
            </div>

            {/* Filter Pills */}
            <div style={{ display: 'flex', gap: 8, padding: '0 16px 14px', overflowX: 'auto', scrollbarWidth: 'none' }}>
              {[
                { id: 'all', label: 'All Flights' },
                { id: 'active', label: 'Active Pipeline ⚡' },
                { id: 'escalated', label: 'Needs Override ⚠️' },
                { id: 'delivered', label: 'Delivered Log' },
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setFilter(tab.id)}
                  style={{
                    padding: '6px 14px', borderRadius: 999, border: 'none', cursor: 'pointer',
                    whiteSpace: 'nowrap', fontSize: 12, fontWeight: 700,
                    background: filter === tab.id ? 'var(--primary)' : 'var(--surface-container)',
                    color: filter === tab.id ? 'white' : 'var(--on-surface-variant)',
                  }}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Donations Pipeline List */}
            <div style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
              {filteredDonations.map(d => {
                const isEscalated = d.status === 'escalated' || d.status === 'posted';
                return (
                  <div
                    key={d.id}
                    style={{
                      background: 'var(--surface-container-lowest)', borderRadius: 18, padding: 16,
                      boxShadow: 'var(--shadow-card)',
                      border: isEscalated ? '2px solid rgba(226,55,68,0.3)' : '1px solid var(--surface-container)',
                      display: 'flex', flexDirection: 'column', gap: 10
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span className="text-label-lg" style={{ fontWeight: 800 }}>#{d.id} • {d.description}</span>
                          <span style={{
                            padding: '2px 8px', borderRadius: 999,
                            background: d.status === 'delivered' ? 'rgba(0,110,22,0.1)' : isEscalated ? 'rgba(226,55,68,0.1)' : 'rgba(252,128,25,0.1)',
                            color: d.status === 'delivered' ? 'var(--tertiary)' : isEscalated ? 'var(--secondary)' : 'var(--primary)',
                            fontSize: 10, fontWeight: 800, textTransform: 'uppercase'
                          }}>
                            {d.status}
                          </span>
                        </div>
                        <div className="text-body-sm" style={{ color: 'var(--on-surface-variant)', marginTop: 2 }}>
                          From <strong>{d.donor_name}</strong> • Feeds {d.est_meals || Math.round((d.qty_kg || 0) * 2)} people
                        </div>
                      </div>

                      <span className="text-label-sm" style={{ color: 'var(--secondary)', fontWeight: 800 }}>
                        Safe: 21:45 PM
                      </span>
                    </div>

                    {/* Progress bar */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, height: 6, background: 'var(--surface-container)', borderRadius: 999, overflow: 'hidden' }}>
                      <div style={{
                        height: '100%',
                        width: d.status === 'delivered' ? '100%' : d.status === 'picked_up' ? '75%' : d.status === 'matched' ? '50%' : '20%',
                        background: d.status === 'delivered' ? 'var(--tertiary)' : 'var(--primary)',
                        borderRadius: 999, transition: 'width 300ms'
                      }} />
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 4 }}>
                      <span className="text-body-sm" style={{ color: 'var(--on-surface-variant)' }}>
                        Target: {recipients.find(r => r.id === d.matched_recipient_id)?.name || 'Algorithmic Queue'}
                      </span>

                      <div style={{ display: 'flex', gap: 6 }}>
                        <button
                          onClick={() => navigate(`/donor/track/${d.id}`)}
                          style={{ padding: '6px 12px', borderRadius: 10, border: '1px solid var(--outline-variant)', background: 'transparent', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}
                        >
                          Radar View
                        </button>
                        <button
                          onClick={() => setSelectedDonation(d)}
                          style={{ padding: '6px 12px', borderRadius: 10, border: 'none', background: 'var(--primary)', color: 'white', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}
                        >
                          Override
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {/* ════════════════════ MODE 2: VERIFICATION DESK ════════════════════ */}
        {activeMode === 'verification' && (
          <div style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: 14 }}>
            {/* Header Desk Info Bar */}
            <div style={{
              background: 'linear-gradient(135deg, #0f172a, #1e293b)',
              color: 'white', borderRadius: 18, padding: 16,
              display: 'flex', justifyContent: 'space-between', alignItems: 'center'
            }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span className="material-symbols-outlined" style={{ color: '#38bdf8' }}>verified</span>
                  <span className="text-label-md" style={{ fontWeight: 800, color: '#38bdf8', textTransform: 'uppercase' }}>
                    District Verification Desk
                  </span>
                </div>
                <div className="text-headline-sm" style={{ margin: '4px 0 0', color: 'white' }}>
                  {verCases.filter(c => c.state !== 'verified').length} Pending Legal Review
                </div>
              </div>

              <div style={{ display: 'flex', gap: 6 }}>
                <button
                  onClick={resetDemo}
                  style={{
                    padding: '8px 12px', borderRadius: 12, border: '1px solid rgba(255,255,255,0.2)',
                    background: 'rgba(255,255,255,0.1)', color: 'white', fontWeight: 700, fontSize: 12,
                    cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4
                  }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 16 }}>restart_alt</span>
                  <span>Reset Demo</span>
                </button>
                <button
                  onClick={() => navigate('/verification')}
                  style={{
                    padding: '8px 12px', borderRadius: 12, border: 'none',
                    background: 'var(--primary)', color: 'white', fontWeight: 800, fontSize: 12,
                    cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4
                  }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 16 }}>add</span>
                  <span>New Case</span>
                </button>
              </div>
            </div>

            {/* Filter Pills */}
            <div style={{ display: 'flex', gap: 8, overflowX: 'auto', scrollbarWidth: 'none' }}>
              {[
                { id: '', label: 'All Cases' },
                { id: 'submitted', label: 'Submitted ⏳' },
                { id: 'under_review', label: 'Under Review' },
                { id: 'needs_changes', label: 'Needs Changes ⚠️' },
                { id: 'verified', label: 'Verified ✅' },
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setVerFilters(prev => ({ ...prev, state: tab.id }))}
                  style={{
                    padding: '6px 14px', borderRadius: 999, border: 'none', cursor: 'pointer',
                    whiteSpace: 'nowrap', fontSize: 12, fontWeight: 700,
                    background: verFilters.state === tab.id ? '#1e293b' : 'var(--surface-container)',
                    color: verFilters.state === tab.id ? 'white' : 'var(--on-surface-variant)',
                  }}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Cases List */}
            {verLoading ? (
              <div style={{ textAlign: 'center', padding: '30px 0', color: 'var(--on-surface-variant)' }}>
                Loading verification dossiers...
              </div>
            ) : verCases.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 16px', background: 'var(--surface-container-lowest)', borderRadius: 18 }}>
                <span className="material-symbols-outlined" style={{ fontSize: 40, color: 'var(--tertiary)' }}>task_alt</span>
                <h3 className="text-headline-sm" style={{ margin: '8px 0 4px' }}>All Clear!</h3>
                <p className="text-body-sm" style={{ color: 'var(--on-surface-variant)', margin: 0 }}>
                  No pending entity verification cases under this filter.
                </p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {verCases.map(c => {
                  const riskColor = c.risk_score === 'high' ? '#dc2626' : c.risk_score === 'medium' ? '#d97706' : '#16a34a';
                  const stateBadge =
                    c.state === 'verified' ? { bg: '#dcfce7', text: '#166534', label: 'Verified Level ' + (c.level || 2) } :
                    c.state === 'needs_changes' ? { bg: '#fee2e2', text: '#991b1b', label: 'Needs Changes' } :
                    c.state === 'under_review' ? { bg: '#fef3c7', text: '#854d0e', label: 'Under Review' } :
                    { bg: '#e0f2fe', text: '#0369a1', label: 'Submitted' };

                  return (
                    <div
                      key={c.id}
                      style={{
                        background: 'var(--surface-container-lowest)', borderRadius: 18, padding: 16,
                        boxShadow: 'var(--shadow-card)', border: '1px solid var(--surface-container)',
                        display: 'flex', flexDirection: 'column', gap: 10
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <span style={{ fontWeight: 800, fontSize: 15 }}>{c.org_name || c.contact_name || c.id}</span>
                            <span style={{
                              padding: '2px 8px', borderRadius: 999,
                              background: stateBadge.bg, color: stateBadge.text,
                              fontSize: 10, fontWeight: 800, textTransform: 'uppercase'
                            }}>
                              {stateBadge.label}
                            </span>
                          </div>
                          <div className="text-body-sm" style={{ color: 'var(--on-surface-variant)', marginTop: 2 }}>
                            {c.subject_type === 'recipient' ? '🏛️ Shelter / Recipient' : c.subject_type === 'donor' ? '🍽️ Food Donor' : '🛵 Volunteer Rider'}
                            {c.org_type ? ` • ${c.org_type.toUpperCase()}` : ''} • Contact: {c.contact_name} ({c.contact_phone})
                          </div>
                        </div>

                        {/* Risk Pill */}
                        <span style={{
                          padding: '3px 8px', borderRadius: 999,
                          background: `${riskColor}15`, color: riskColor,
                          fontSize: 11, fontWeight: 800
                        }}>
                          {c.risk_score ? `${c.risk_score.toUpperCase()} RISK` : 'LOW RISK'}
                        </span>
                      </div>

                      {/* Meta stats bar */}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--surface-container-low)', padding: '8px 12px', borderRadius: 12, fontSize: 12 }}>
                        <span style={{ color: 'var(--on-surface-variant)' }}>
                          📍 {c.address || 'Kota, Rajasthan'}
                        </span>
                        <div style={{ display: 'flex', gap: 10 }}>
                          <span style={{ fontWeight: 700, color: '#dc2626' }}>
                            ⏳ SLA: {c.sla_hours_remaining ? `${c.sla_hours_remaining}h left` : '< 4h priority'}
                          </span>
                          <span style={{ color: 'var(--on-surface-variant)' }}>
                            📄 {c.doc_count || 1} docs
                          </span>
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, paddingTop: 4 }}>
                        <button
                          onClick={() => handleOpenCaseModal(c.id)}
                          style={{
                            padding: '8px 14px', borderRadius: 10, border: 'none',
                            background: '#0f172a', color: 'white', fontSize: 12, fontWeight: 800,
                            cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6
                          }}
                        >
                          <span className="material-symbols-outlined" style={{ fontSize: 16 }}>visibility</span>
                          <span>Inspect Dossier</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ════════════════════ INSPECT DOSSIER MODAL ════════════════════ */}
        {inspectModalOpen && caseDetail && (
          <div style={{
            position: 'fixed', inset: 0, zIndex: 110, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16
          }}>
            <div style={{
              background: 'white', borderRadius: 24, maxWidth: 520, width: '100%', maxHeight: '90vh',
              overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 16, padding: 20,
              boxShadow: '0 20px 40px rgba(0,0,0,0.3)'
            }}>
              {/* Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <h3 className="text-headline-sm" style={{ margin: 0 }}>
                      {caseDetail.case.org_name || caseDetail.case.contact_name}
                    </h3>
                    <span style={{ fontSize: 11, fontWeight: 800, padding: '2px 8px', borderRadius: 999, background: '#e2e8f0' }}>
                      {caseDetail.case.id}
                    </span>
                  </div>
                  <p className="text-body-sm" style={{ color: 'var(--on-surface-variant)', margin: '2px 0 0' }}>
                    Type: {caseDetail.case.subject_type} • Location: {caseDetail.case.address}
                  </p>
                </div>
                <button onClick={() => setInspectModalOpen(false)} style={{ border: 'none', background: 'none', cursor: 'pointer' }}>
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>

              {/* Automated Engine Checks Result */}
              <div style={{ background: '#0f172a', color: 'white', borderRadius: 16, padding: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <span style={{ fontSize: 11, fontWeight: 800, color: '#38bdf8', textTransform: 'uppercase' }}>
                    Automated Verification Checks
                  </span>
                  <button
                    onClick={() => recheck(caseDetail.case.id)}
                    style={{ background: 'transparent', border: '1px solid #475569', color: '#94a3b8', borderRadius: 8, padding: '2px 8px', fontSize: 10, cursor: 'pointer' }}
                  >
                    Re-run
                  </button>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 12 }}>
                  {(caseDetail.checks && caseDetail.checks.length > 0) ? (
                    caseDetail.checks.map(chk => (
                      <div key={chk.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span>{chk.check_type.replace(/_/g, ' ')}:</span>
                        <span style={{
                          fontWeight: 800,
                          color: chk.result === 'pass' ? '#4ade80' : chk.result === 'warn' ? '#facc15' : '#f87171'
                        }}>
                          {chk.result.toUpperCase()}
                        </span>
                      </div>
                    ))
                  ) : (
                    <div style={{ color: '#94a3b8', fontSize: 11 }}>No automated flags. Clean checksum passed.</div>
                  )}
                </div>
              </div>

              {/* Uploaded Documents */}
              <div>
                <div className="text-label-md" style={{ fontWeight: 800, marginBottom: 8 }}>
                  Submitted Credentials & Documents ({caseDetail.documents?.length || 0})
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {caseDetail.documents?.map(doc => (
                    <div key={doc.id} style={{ background: 'var(--surface-container-low)', padding: 12, borderRadius: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: 13 }}>{doc.doc_type.toUpperCase()}</div>
                        <div style={{ fontSize: 11, color: 'var(--on-surface-variant)' }}>
                          Issued By: {doc.issued_by || 'State Authority'} • Key: {doc.number_last4 ? `***${doc.number_last4}` : 'Verified'}
                        </div>
                      </div>
                      <span style={{
                        fontSize: 10, fontWeight: 800, padding: '2px 8px', borderRadius: 999,
                        background: doc.state === 'approved' ? '#dcfce7' : doc.state === 'rejected' ? '#fee2e2' : '#fef3c7',
                        color: doc.state === 'approved' ? '#166534' : doc.state === 'rejected' ? '#991b1b' : '#854d0e',
                      }}>
                        {doc.state}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Decision reason input if requesting changes */}
              {showRejectInput && (
                <div>
                  <label className="text-label-sm" style={{ display: 'block', marginBottom: 4, color: '#dc2626', fontWeight: 800 }}>
                    Reason for changes / rejection
                  </label>
                  <textarea
                    rows={2}
                    value={rejectionReason}
                    onChange={e => setRejectionReason(e.target.value)}
                    placeholder="e.g. FSSAI business name does not match NGO registration. Please re-upload valid certificate."
                    style={{ width: '100%', padding: 8, borderRadius: 10, border: '1px solid #fca5a5', fontSize: 12 }}
                  />
                </div>
              )}

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                {!showRejectInput ? (
                  <>
                    <button
                      onClick={() => setShowRejectInput(true)}
                      style={{
                        flex: 1, height: 44, borderRadius: 12, border: '1px solid #fca5a5',
                        background: '#fee2e2', color: '#991b1b', fontWeight: 700, fontSize: 12, cursor: 'pointer'
                      }}
                    >
                      Request Changes
                    </button>
                    <button
                      onClick={() => handleDecision(caseDetail.case.id, 'approve')}
                      disabled={deciding}
                      style={{
                        flex: 2, height: 44, borderRadius: 12, border: 'none',
                        background: '#16a34a', color: 'white', fontWeight: 800, fontSize: 13, cursor: 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6
                      }}
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: 18 }}>check_circle</span>
                      <span>Approve & Grant Tier Badge</span>
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => setShowRejectInput(false)}
                      style={{ flex: 1, height: 44, borderRadius: 12, border: '1px solid var(--outline-variant)', background: 'transparent' }}
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => handleDecision(caseDetail.case.id, 'changes')}
                      disabled={deciding}
                      style={{ flex: 1.5, height: 44, borderRadius: 12, border: 'none', background: '#dc2626', color: 'white', fontWeight: 800 }}
                    >
                      Send Notice
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ════════════════════ MANUAL DISPATCH OVERRIDE MODAL ════════════════════ */}
        {selectedDonation && (
          <div style={{
            position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(0,0,0,0.5)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20
          }}>
            <div style={{
              background: 'white', borderRadius: 24, padding: 24, maxWidth: 400, width: '100%',
              display: 'flex', flexDirection: 'column', gap: 16, boxShadow: 'var(--shadow-elevated)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 className="text-headline-sm" style={{ margin: 0 }}>Manual Dispatcher Override</h3>
                <button onClick={() => setSelectedDonation(null)} style={{ border: 'none', background: 'none', cursor: 'pointer' }}>
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>

              <div style={{ background: 'var(--surface-container-low)', padding: 12, borderRadius: 12 }}>
                <div className="text-label-md" style={{ fontWeight: 800 }}>Donation #{selectedDonation.id}: {selectedDonation.description}</div>
                <div className="text-body-sm" style={{ color: 'var(--on-surface-variant)' }}>Feeds {selectedDonation.est_meals || Math.round((selectedDonation.qty_kg || 0) * 2)} people • From {selectedDonation.donor_name}</div>
              </div>

              <div>
                <label className="text-label-md" style={{ display: 'block', marginBottom: 4 }}>Assign Target Shelter</label>
                <select
                  value={overrideRecipientId}
                  onChange={e => setOverrideRecipientId(e.target.value)}
                  style={{ width: '100%', height: 44, padding: '0 12px', borderRadius: 12, border: '1px solid var(--outline-variant)', background: 'white', fontSize: 14 }}
                >
                  {recipients.map(r => (
                    <option key={r.id} value={r.id}>
                      {r.name} (Tier {r.tier} • {r.capacity_kg - r.capacity_used_kg} kg free)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-label-md" style={{ display: 'block', marginBottom: 4 }}>Assign Volunteer Rider</label>
                <select
                  value={overrideDriverId}
                  onChange={e => setOverrideDriverId(e.target.value)}
                  style={{ width: '100%', height: 44, padding: '0 12px', borderRadius: 12, border: '1px solid var(--outline-variant)', background: 'white', fontSize: 14 }}
                >
                  {drivers.map(dr => (
                    <option key={dr.id} value={dr.id}>
                      {dr.name} ({dr.available ? '🟢 Online' : '⚪ Offline'} • {dr.vehicle})
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
                <button
                  onClick={() => setSelectedDonation(null)}
                  style={{ flex: 1, height: 46, borderRadius: 12, border: '1px solid var(--outline-variant)', background: 'transparent', fontWeight: 700 }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleManualDispatch}
                  className="btn-primary"
                  style={{ flex: 1.5, height: 46 }}
                >
                  Apply Override
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  );
}
