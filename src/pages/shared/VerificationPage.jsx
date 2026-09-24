import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { TopBar, BottomNav } from '../../components/Navigation';
import { useVerification } from '../../hooks/useVerification';

const INSTITUTION_TYPES = [
  {
    id: 'child_care',
    name: 'Child Care Home (CCI)',
    hindi: 'बाल गृह / शिशु केंद्र',
    icon: 'child_care',
    priority: 'Priority 1 🔴',
    priorityColor: '#dc2626',
    desc: 'Children homes registered under Juvenile Justice Act. Immediate high priority routing.',
  },
  {
    id: 'old_age',
    name: 'Senior Living / Old Age Home',
    hindi: 'वृद्धाश्रम / वरिष्ठ नागरिक केंद्र',
    icon: 'elderly',
    priority: 'Priority 2 🟡',
    priorityColor: '#d97706',
    desc: 'Assisted care for seniors. Mild, low-spice nutritious meals preferred.',
  },
  {
    id: 'anganwadi',
    name: 'Anganwadi & Nutrition Hub',
    hindi: 'आंगनवाड़ी / पोषण केंद्र',
    icon: 'soup_kitchen',
    priority: 'Priority 1 🔴',
    priorityColor: '#dc2626',
    desc: 'Women & child development supplementary nutrition centers.',
  },
  {
    id: 'community_kitchen',
    name: 'Community Relief Kitchen / Rain Basera',
    hindi: 'रैन बसेरा / सामुदायिक रसोई',
    icon: 'night_shelter',
    priority: 'Priority 2 🟡',
    priorityColor: '#d97706',
    desc: 'Homeless shelters and disaster relief hot-meal distribution.',
  },
  {
    id: 'restaurant_donor',
    name: 'Commercial Kitchen / Food Business',
    hindi: 'रेस्टोरेंट / कैटरिंग प्रदाता',
    icon: 'restaurant',
    priority: 'Donor Verification 🟢',
    priorityColor: '#16a34a',
    desc: 'Restaurants, hotels & banquet caterers donating safe surplus.',
  },
];

export default function VerificationPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, showToast } = useApp();

  const userType = user?.role === 'donor' ? 'donor' : 'recipient';
  const userId = user?.id ? `user-${user.id}` : (userType === 'donor' ? 'd-1' : 'r-1');

  const {
    verCase, documents, checks, draft, setDraft,
    loading, saving, submitting, error,
    refresh, saveDraft, uploadDocument, removeDocument, submit,
    level, state, canReceive, canDonate
  } = useVerification(userId, userType);

  const [step, setStep] = useState(1);
  const [selectedType, setSelectedType] = useState(draft.org_type || (userType === 'donor' ? 'restaurant_donor' : 'child_care'));
  const [orgName, setOrgName] = useState(draft.org_name || (user?.name || 'Asha Nilayam Trust'));
  const [contactName, setContactName] = useState(draft.contact_name || 'Priya Sharma');
  const [contactPhone, setContactPhone] = useState(draft.contact_phone || '+91 98765 43210');
  const [regNumber, setRegNumber] = useState(draft.org_reg_number || 'MAH/2019/00481');
  const [darpanId, setDarpanId] = useState(draft.ngo_darpan_id || 'RJ/2021/029410');
  const [fssaiNumber, setFssaiNumber] = useState(draft.fssai_number || '12023019000452');
  const [hasColdChain, setHasColdChain] = useState(draft.has_cold_chain ?? true);
  const [hasKitchen, setHasKitchen] = useState(draft.has_hygiene_cert ?? true);
  const [consentData, setConsentData] = useState(true);
  const [consentTerms, setConsentTerms] = useState(true);
  const [mockUploading, setMockUploading] = useState(false);

  // Sync draft data when loaded
  useEffect(() => {
    if (draft.org_name) setOrgName(draft.org_name);
    if (draft.contact_name) setContactName(draft.contact_name);
    if (draft.contact_phone) setContactPhone(draft.contact_phone);
    if (draft.org_type) setSelectedType(draft.org_type);
    if (draft.fssai_number) setFssaiNumber(draft.fssai_number);
  }, [draft]);

  const handleNext = async () => {
    await saveDraft({
      org_name: orgName,
      contact_name: contactName,
      contact_phone: contactPhone,
      org_type: selectedType,
      org_reg_number: regNumber,
      ngo_darpan_id: darpanId,
      fssai_number: fssaiNumber,
      has_cold_chain: hasColdChain,
      has_hygiene_cert: hasKitchen,
      step,
    });
    if (step < 4) setStep(step + 1);
  };

  const handleSimulatedUpload = async (docType) => {
    setMockUploading(true);
    try {
      const mockMeta = {
        number: docType === 'fssai' ? fssaiNumber : 'AAAP1234P456',
        name: orgName,
        issued_by: docType === 'fssai' ? 'FSSAI Kota Regional Office' : 'Govt of Rajasthan / Charity Commissioner',
      };
      await uploadDocument(docType, { type: 'application/pdf', size: 184000 }, mockMeta);
      showToast(`Document uploaded & verified: ${docType.toUpperCase()}`, 'verified');
    } finally {
      setMockUploading(false);
    }
  };

  const handleSubmitCase = async (autoVerify = false) => {
    await saveDraft({
      org_name: orgName,
      contact_name: contactName,
      contact_phone: contactPhone,
      org_type: selectedType,
      org_reg_number: regNumber,
      ngo_darpan_id: darpanId,
      fssai_number: fssaiNumber,
      has_cold_chain: hasColdChain,
      has_hygiene_cert: hasKitchen,
      consent_data_processing: consentData,
      consent_terms: consentTerms,
      declaration_signed: true,
    });

    const res = await submit(autoVerify);
    if (autoVerify) {
      showToast('Simulation: Institution verified instantly!', 'verified');
    } else {
      showToast('Application submitted to District Verification Desk (SLA < 4h)', 'schedule_send');
    }
    setStep(4);
  };

  const getStatusBadge = () => {
    if (state === 'verified') {
      return (
        <div style={{ background: '#dcfce7', border: '1px solid #86efac', color: '#166534', padding: '10px 14px', borderRadius: 14, display: 'flex', alignItems: 'center', gap: 10 }}>
          <span className="material-symbols-outlined" style={{ color: '#16a34a', fontSize: 24, fontVariationSettings: "'FILL' 1" }}>verified</span>
          <div>
            <div style={{ fontWeight: 800, fontSize: 13 }}>LEVEL {level || 2} VERIFIED INSTITUTION</div>
            <div style={{ fontSize: 12, opacity: 0.9 }}>Authorized for high-volume priority surplus dispatch under FSSAI Good Samaritan Protocol</div>
          </div>
        </div>
      );
    }
    if (state === 'under_review' || state === 'submitted') {
      return (
        <div style={{ background: '#fef3c7', border: '1px solid #fde047', color: '#854d0e', padding: '10px 14px', borderRadius: 14, display: 'flex', alignItems: 'center', gap: 10 }}>
          <span className="material-symbols-outlined" style={{ color: '#ca8a04', fontSize: 24 }}>hourglass_top</span>
          <div>
            <div style={{ fontWeight: 800, fontSize: 13 }}>APPLICATION UNDER REVIEW (SLA: &lt; 4 HOURS)</div>
            <div style={{ fontSize: 12, opacity: 0.9 }}>District Food Safety Inspector reviewing credentials. Priority institutions hold provisional intake pass.</div>
          </div>
        </div>
      );
    }
    if (state === 'needs_changes') {
      return (
        <div style={{ background: '#fee2e2', border: '1px solid #fca5a5', color: '#991b1b', padding: '10px 14px', borderRadius: 14, display: 'flex', alignItems: 'center', gap: 10 }}>
          <span className="material-symbols-outlined" style={{ color: '#dc2626', fontSize: 24 }}>warning</span>
          <div>
            <div style={{ fontWeight: 800, fontSize: 13 }}>ACTION REQUIRED: DOCUMENT RE-UPLOAD</div>
            <div style={{ fontSize: 12, opacity: 0.9 }}>{verCase?.decision_reason || 'Please upload a clear certificate with matching entity name.'}</div>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div style={{ minHeight: '100dvh', background: 'var(--surface)', display: 'flex', flexDirection: 'column' }}>
      <TopBar
        title="Institution Verification"
        subtitle="Legal & Food Safety Desk"
        showBack
        onBack={() => navigate(-1)}
      />

      <main style={{ flex: 1, paddingTop: 68, paddingBottom: 90, overflowY: 'auto', paddingLeft: 16, paddingRight: 16 }}>
        {/* Step Indicator Header */}
        <div style={{ margin: '14px 0', background: 'var(--surface-container-lowest)', borderRadius: 20, padding: '16px 18px', boxShadow: 'var(--shadow-card)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <span style={{ fontSize: 11, fontWeight: 800, color: 'var(--primary-dark)', letterSpacing: 0.5, textTransform: 'uppercase' }}>
              Step {step} of 4 • {step === 1 ? 'Classification' : step === 2 ? 'Food Safety' : step === 3 ? 'Documents' : 'Status & Review'}
            </span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: 'rgba(0,110,22,0.1)', color: 'var(--tertiary)', fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 999 }}>
              <span className="material-symbols-outlined" style={{ fontSize: 14 }}>shield</span> FSSAI Compliant
            </span>
          </div>

          {/* Stepper Progress Bars */}
          <div style={{ display: 'flex', gap: 6 }}>
            {[1, 2, 3, 4].map(s => (
              <div
                key={s}
                onClick={() => setStep(s)}
                style={{
                  flex: 1,
                  height: 6,
                  borderRadius: 999,
                  background: step >= s ? 'var(--primary)' : 'var(--surface-container-high)',
                  cursor: 'pointer',
                  transition: 'background 200ms ease',
                }}
              />
            ))}
          </div>
        </div>

        {/* Existing Status Banner */}
        {getStatusBadge() && <div style={{ marginBottom: 16 }}>{getStatusBadge()}</div>}

        {/* STEP 1: Institution Classification */}
        {step === 1 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <h2 className="text-headline-sm" style={{ margin: '0 0 4px' }}>Institution Classification</h2>
              <p className="text-body-sm" style={{ color: 'var(--on-surface-variant)', margin: 0 }}>
                Select your institution category to establish automatic routing priority and hygiene requirements.
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {INSTITUTION_TYPES.map(type => {
                const isSelected = selectedType === type.id;
                return (
                  <div
                    key={type.id}
                    onClick={() => setSelectedType(type.id)}
                    style={{
                      padding: 14,
                      borderRadius: 16,
                      background: isSelected ? 'var(--surface-container-lowest)' : 'var(--surface-container-low)',
                      border: `2px solid ${isSelected ? 'var(--primary)' : 'transparent'}`,
                      boxShadow: isSelected ? '0 4px 14px rgba(252,128,25,0.18)' : 'none',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: 12,
                      transition: 'all 180ms ease',
                    }}
                  >
                    <div style={{
                      width: 44, height: 44, borderRadius: 12,
                      background: isSelected ? 'rgba(252,128,25,0.15)' : 'var(--surface-container)',
                      color: isSelected ? 'var(--primary-dark)' : 'var(--on-surface-variant)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                    }}>
                      <span className="material-symbols-outlined" style={{ fontSize: 24 }}>{type.icon}</span>
                    </div>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 2 }}>
                        <span style={{ fontWeight: 800, fontSize: 14, color: 'var(--on-surface)' }}>{type.name}</span>
                        <span style={{
                          fontSize: 10, fontWeight: 800, padding: '2px 8px', borderRadius: 999,
                          background: `${type.priorityColor}15`, color: type.priorityColor
                        }}>
                          {type.priority}
                        </span>
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--on-surface-variant)', marginBottom: 4 }}>{type.hindi}</div>
                      <div style={{ fontSize: 12, color: 'var(--on-surface-variant)', lineHeight: 1.4 }}>{type.desc}</div>
                    </div>

                    <div style={{ marginTop: 2 }}>
                      <span className="material-symbols-outlined" style={{
                        fontSize: 20,
                        color: isSelected ? 'var(--primary)' : 'var(--outline-variant)'
                      }}>
                        {isSelected ? 'radio_button_checked' : 'radio_button_unchecked'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Institution Details */}
            <div style={{ background: 'var(--surface-container-lowest)', borderRadius: 20, padding: 16, display: 'flex', flexDirection: 'column', gap: 12, marginTop: 4 }}>
              <div className="text-label-lg" style={{ color: 'var(--primary-dark)', textTransform: 'uppercase' }}>
                Legal Entity Info
              </div>

              <div>
                <label className="text-label-sm" style={{ color: 'var(--on-surface-variant)', display: 'block', marginBottom: 4 }}>
                  Registered Institution / Organization Name
                </label>
                <input
                  type="text"
                  value={orgName}
                  onChange={e => setOrgName(e.target.value)}
                  style={{ width: '100%', height: 44, padding: '0 12px', borderRadius: 12, border: '1px solid var(--outline-variant)', background: 'var(--surface-container-low)', fontSize: 14, fontWeight: 600 }}
                  placeholder="e.g. Asha Nilayam Trust"
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <label className="text-label-sm" style={{ color: 'var(--on-surface-variant)', display: 'block', marginBottom: 4 }}>
                    NGO Darpan ID (Optional)
                  </label>
                  <input
                    type="text"
                    value={darpanId}
                    onChange={e => setDarpanId(e.target.value)}
                    style={{ width: '100%', height: 44, padding: '0 12px', borderRadius: 12, border: '1px solid var(--outline-variant)', background: 'var(--surface-container-low)', fontSize: 13 }}
                    placeholder="RJ/2021/..."
                  />
                </div>
                <div>
                  <label className="text-label-sm" style={{ color: 'var(--on-surface-variant)', display: 'block', marginBottom: 4 }}>
                    Govt Reg / 12A / 80G No.
                  </label>
                  <input
                    type="text"
                    value={regNumber}
                    onChange={e => setRegNumber(e.target.value)}
                    style={{ width: '100%', height: 44, padding: '0 12px', borderRadius: 12, border: '1px solid var(--outline-variant)', background: 'var(--surface-container-low)', fontSize: 13 }}
                    placeholder="MAH/..."
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <label className="text-label-sm" style={{ color: 'var(--on-surface-variant)', display: 'block', marginBottom: 4 }}>
                    Authorized Contact Person
                  </label>
                  <input
                    type="text"
                    value={contactName}
                    onChange={e => setContactName(e.target.value)}
                    style={{ width: '100%', height: 44, padding: '0 12px', borderRadius: 12, border: '1px solid var(--outline-variant)', background: 'var(--surface-container-low)', fontSize: 13 }}
                  />
                </div>
                <div>
                  <label className="text-label-sm" style={{ color: 'var(--on-surface-variant)', display: 'block', marginBottom: 4 }}>
                    Official Intake Phone
                  </label>
                  <input
                    type="tel"
                    value={contactPhone}
                    onChange={e => setContactPhone(e.target.value)}
                    style={{ width: '100%', height: 44, padding: '0 12px', borderRadius: 12, border: '1px solid var(--outline-variant)', background: 'var(--surface-container-low)', fontSize: 13 }}
                  />
                </div>
              </div>
            </div>

            <button
              onClick={handleNext}
              className="btn-primary"
              style={{ width: '100%', marginTop: 8 }}
            >
              <span>Continue to Food Safety Details</span>
              <span className="material-symbols-outlined">arrow_forward</span>
            </button>
          </div>
        )}

        {/* STEP 2: Food Safety & Facilities */}
        {step === 2 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <h2 className="text-headline-sm" style={{ margin: '0 0 4px' }}>Food Safety & Cold-Chain</h2>
              <p className="text-body-sm" style={{ color: 'var(--on-surface-variant)', margin: 0 }}>
                FSSAI Good Samaritan compliance guarantees safe handling and legal protection under Indian law.
              </p>
            </div>

            {/* FSSAI Registration Card */}
            <div style={{ background: 'var(--surface-container-lowest)', borderRadius: 20, padding: 18, boxShadow: 'var(--shadow-card)', display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span className="material-symbols-outlined" style={{ color: 'var(--tertiary)', fontSize: 28 }}>verified</span>
                <div>
                  <div style={{ fontWeight: 800, fontSize: 14 }}>14-Digit FSSAI Registration / License</div>
                  <div style={{ fontSize: 12, color: 'var(--on-surface-variant)' }}>Required for commercial donors & large-capacity shelters</div>
                </div>
              </div>

              <div>
                <input
                  type="text"
                  maxLength={14}
                  value={fssaiNumber}
                  onChange={e => setFssaiNumber(e.target.value.replace(/\D/g, ''))}
                  style={{
                    width: '100%', height: 48, padding: '0 14px', borderRadius: 14,
                    border: '2px solid var(--outline-variant)', fontSize: 18, fontWeight: 800,
                    letterSpacing: 2, background: 'var(--surface-container-low)', textAlign: 'center'
                  }}
                  placeholder="12023019000452"
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 4, padding: '0 4px' }}>
                  <span style={{ fontSize: 11, color: 'var(--on-surface-variant)' }}>
                    {fssaiNumber.length}/14 digits
                  </span>
                  {fssaiNumber.length === 14 ? (
                    <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--tertiary)', display: 'flex', alignItems: 'center', gap: 4 }}>
                      <span className="material-symbols-outlined" style={{ fontSize: 14 }}>check_circle</span> Valid Format
                    </span>
                  ) : (
                    <span style={{ fontSize: 11, color: '#f59e0b' }}>Enter 14 numerical digits</span>
                  )}
                </div>
              </div>
            </div>

            {/* Storage Checklist */}
            <div style={{ background: 'var(--surface-container-lowest)', borderRadius: 20, padding: 18, display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div className="text-label-lg" style={{ color: 'var(--primary-dark)', textTransform: 'uppercase' }}>
                On-Site Facilities Verification
              </div>

              <label style={{ display: 'flex', alignItems: 'flex-start', gap: 12, cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={hasColdChain}
                  onChange={e => setHasColdChain(e.target.checked)}
                  style={{ width: 22, height: 22, accentColor: 'var(--tertiary)', marginTop: 2 }}
                />
                <div>
                  <div style={{ fontWeight: 700, fontSize: 14 }}>Cold Storage / Refrigerator Available</div>
                  <div style={{ fontSize: 12, color: 'var(--on-surface-variant)', lineHeight: 1.4 }}>
                    Allows accepting dairy surplus, salads, and overnight preservation without quality loss.
                  </div>
                </div>
              </label>

              <label style={{ display: 'flex', alignItems: 'flex-start', gap: 12, cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={hasKitchen}
                  onChange={e => setHasKitchen(e.target.checked)}
                  style={{ width: 22, height: 22, accentColor: 'var(--tertiary)', marginTop: 2 }}
                />
                <div>
                  <div style={{ fontWeight: 700, fontSize: 14 }}>Commercial Reheating & Serving Equipment</div>
                  <div style={{ fontSize: 12, color: 'var(--on-surface-variant)', lineHeight: 1.4 }}>
                    Can reheat warm cooked food above 65°C within 1 hour of rider delivery.
                  </div>
                </div>
              </label>
            </div>

            <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
              <button
                onClick={() => setStep(1)}
                style={{ flex: 1, height: 48, borderRadius: 14, border: '1px solid var(--outline-variant)', background: 'transparent', fontWeight: 700, cursor: 'pointer' }}
              >
                Back
              </button>
              <button
                onClick={handleNext}
                className="btn-primary"
                style={{ flex: 2 }}
              >
                <span>Document Uploads</span>
                <span className="material-symbols-outlined">arrow_forward</span>
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: Documents & Auto-Checks */}
        {step === 3 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <h2 className="text-headline-sm" style={{ margin: '0 0 4px' }}>Document Upload & Validation</h2>
              <p className="text-body-sm" style={{ color: 'var(--on-surface-variant)', margin: 0 }}>
                Upload digital copies. Automated OCR verifies certificate numbers against official state registries.
              </p>
            </div>

            {/* Document Cards */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {/* FSSAI Certificate */}
              <div style={{ background: 'var(--surface-container-lowest)', borderRadius: 18, padding: 16, boxShadow: 'var(--shadow-card)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 40, height: 40, borderRadius: 10, background: '#fef3c7', color: '#b45309', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <span className="material-symbols-outlined">description</span>
                    </div>
                    <div>
                      <div style={{ fontWeight: 800, fontSize: 14 }}>FSSAI Registration Certificate</div>
                      <div style={{ fontSize: 12, color: 'var(--on-surface-variant)' }}>PDF or clear front photo</div>
                    </div>
                  </div>

                  {documents.some(d => d.doc_type === 'fssai') ? (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: '#dcfce7', color: '#166534', padding: '4px 10px', borderRadius: 999, fontSize: 11, fontWeight: 700 }}>
                      <span className="material-symbols-outlined" style={{ fontSize: 14 }}>check_circle</span> Verified
                    </span>
                  ) : (
                    <button
                      onClick={() => handleSimulatedUpload('fssai')}
                      disabled={mockUploading}
                      style={{ padding: '6px 14px', borderRadius: 10, background: 'var(--primary)', color: 'white', border: 'none', fontWeight: 700, fontSize: 12, cursor: 'pointer' }}
                    >
                      {mockUploading ? 'Checking...' : '+ Upload'}
                    </button>
                  )}
                </div>

                <div style={{ fontSize: 12, color: 'var(--on-surface-variant)', background: 'var(--surface-container-low)', padding: '8px 12px', borderRadius: 10 }}>
                  Linked Number: <strong>{fssaiNumber || '12023019000452'}</strong> • OCR verification enabled
                </div>
              </div>

              {/* Legal Registration / PAN */}
              <div style={{ background: 'var(--surface-container-lowest)', borderRadius: 18, padding: 16, boxShadow: 'var(--shadow-card)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 40, height: 40, borderRadius: 10, background: '#e0e7ff', color: '#3730a3', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <span className="material-symbols-outlined">badge</span>
                    </div>
                    <div>
                      <div style={{ fontWeight: 800, fontSize: 14 }}>PAN / Trust Deed / 12A Certificate</div>
                      <div style={{ fontSize: 12, color: 'var(--on-surface-variant)' }}>Govt issued identity proof</div>
                    </div>
                  </div>

                  {documents.some(d => d.doc_type === 'pan' || d.doc_type === 'registration_cert') ? (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: '#dcfce7', color: '#166534', padding: '4px 10px', borderRadius: 999, fontSize: 11, fontWeight: 700 }}>
                      <span className="material-symbols-outlined" style={{ fontSize: 14 }}>check_circle</span> Verified
                    </span>
                  ) : (
                    <button
                      onClick={() => handleSimulatedUpload('pan')}
                      disabled={mockUploading}
                      style={{ padding: '6px 14px', borderRadius: 10, background: 'var(--primary)', color: 'white', border: 'none', fontWeight: 700, fontSize: 12, cursor: 'pointer' }}
                    >
                      {mockUploading ? 'Checking...' : '+ Upload'}
                    </button>
                  )}
                </div>

                <div style={{ fontSize: 12, color: 'var(--on-surface-variant)', background: 'var(--surface-container-low)', padding: '8px 12px', borderRadius: 10 }}>
                  Entity: <strong>{orgName}</strong> • Automated cross-entity fraud check
                </div>
              </div>
            </div>

            {/* Automated Checks Terminal Preview */}
            <div style={{ background: '#161b2d', color: 'white', borderRadius: 18, padding: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
                <span className="material-symbols-outlined" style={{ fontSize: 18, color: '#38bdf8' }}>terminal</span>
                <span style={{ fontSize: 12, fontWeight: 800, color: '#38bdf8', textTransform: 'uppercase' }}>
                  Live Automated Checks Engine
                </span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 12, fontFamily: 'monospace' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#4ade80' }}>
                  <span>✓ FSSAI 14-digit checksum:</span>
                  <span>PASS</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#4ade80' }}>
                  <span>✓ Registry duplicate prevention:</span>
                  <span>PASS (0 collisions)</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#4ade80' }}>
                  <span>✓ Name matching algorithm:</span>
                  <span>CONFIDENCE 94%</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#facc15' }}>
                  <span>⏳ District Food Inspector Desk:</span>
                  <span>QUEUED (&lt;4h SLA)</span>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
              <button
                onClick={() => setStep(2)}
                style={{ flex: 1, height: 48, borderRadius: 14, border: '1px solid var(--outline-variant)', background: 'transparent', fontWeight: 700, cursor: 'pointer' }}
              >
                Back
              </button>
              <button
                onClick={() => setStep(4)}
                className="btn-primary"
                style={{ flex: 2 }}
              >
                <span>Review & Sign</span>
                <span className="material-symbols-outlined">arrow_forward</span>
              </button>
            </div>
          </div>
        )}

        {/* STEP 4: Declarations & Submit / Live SLA */}
        {step === 4 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <h2 className="text-headline-sm" style={{ margin: '0 0 4px' }}>Review & Legal Undertaking</h2>
              <p className="text-body-sm" style={{ color: 'var(--on-surface-variant)', margin: 0 }}>
                Final declarations before district operations review.
              </p>
            </div>

            {/* Summary card */}
            <div style={{ background: 'var(--surface-container-lowest)', borderRadius: 20, padding: 16, boxShadow: 'var(--shadow-card)', display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div className="text-label-md" style={{ color: 'var(--primary-dark)', fontWeight: 800 }}>
                Application Dossier Summary
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, fontSize: 13 }}>
                <div>
                  <span style={{ color: 'var(--on-surface-variant)', display: 'block', fontSize: 11 }}>Entity Name:</span>
                  <strong>{orgName}</strong>
                </div>
                <div>
                  <span style={{ color: 'var(--on-surface-variant)', display: 'block', fontSize: 11 }}>Category:</span>
                  <strong>{INSTITUTION_TYPES.find(t => t.id === selectedType)?.name || selectedType}</strong>
                </div>
                <div>
                  <span style={{ color: 'var(--on-surface-variant)', display: 'block', fontSize: 11 }}>FSSAI Number:</span>
                  <strong>{fssaiNumber || '12023019000452'}</strong>
                </div>
                <div>
                  <span style={{ color: 'var(--on-surface-variant)', display: 'block', fontSize: 11 }}>Contact:</span>
                  <strong>{contactPhone}</strong>
                </div>
              </div>
            </div>

            {/* Legal Undertakings */}
            <div style={{ background: 'var(--surface-container-lowest)', borderRadius: 20, padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
              <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={consentTerms}
                  onChange={e => setConsentTerms(e.target.checked)}
                  style={{ width: 20, height: 20, accentColor: 'var(--tertiary)', marginTop: 2 }}
                />
                <div style={{ fontSize: 12, lineHeight: 1.4, color: 'var(--on-surface)' }}>
                  I confirm that our institution adheres to FSSAI safe food handling guidelines and operates on non-commercial humanitarian distribution principles.
                </div>
              </label>

              <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={consentData}
                  onChange={e => setConsentData(e.target.checked)}
                  style={{ width: 20, height: 20, accentColor: 'var(--tertiary)', marginTop: 2 }}
                />
                <div style={{ fontSize: 12, lineHeight: 1.4, color: 'var(--on-surface)' }}>
                  I authorize Surplus-to-Shelter and the district food inspector to inspect uploaded legal credentials and match verified surplus donations.
                </div>
              </label>
            </div>

            {/* Submit Action Buttons */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 8 }}>
              <button
                onClick={() => handleSubmitCase(false)}
                disabled={submitting || !consentTerms || !consentData}
                className="btn-primary"
                style={{ width: '100%', height: 50, fontSize: 15 }}
              >
                <span className="material-symbols-outlined">send</span>
                <span>{submitting ? 'Submitting...' : 'Submit to District Verification Desk'}</span>
              </button>

              <button
                onClick={() => handleSubmitCase(true)}
                disabled={submitting}
                style={{
                  width: '100%', height: 46, borderRadius: 14, border: '1px dashed var(--tertiary)',
                  background: 'rgba(0,110,22,0.06)', color: 'var(--tertiary)', fontWeight: 800,
                  fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 18 }}>bolt</span>
                <span>Instant Auto-Verify for Demo Simulation</span>
              </button>

              <button
                onClick={() => setStep(1)}
                style={{ height: 40, background: 'transparent', border: 'none', color: 'var(--on-surface-variant)', fontSize: 13, cursor: 'pointer' }}
              >
                Edit Form Details
              </button>
            </div>
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  );
}
