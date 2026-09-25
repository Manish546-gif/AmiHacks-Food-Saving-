import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { TopBar, BottomNav } from '../../components/Navigation';
import { useVerification } from '../../hooks/useVerification';

// ─── ROLE-SPECIFIC CLASSIFICATION DATA ───────────────────────────────────────

const DONOR_ESTABLISHMENTS = [
  {
    id: 'restaurant',
    name: 'Restaurant & Fine Dining',
    hindi: 'रेस्टोरेंट / होटल भोजनालय',
    icon: 'restaurant',
    priority: 'Fresh Surplus 🟢',
    priorityColor: '#16a34a',
    desc: 'Cooked portions, gravies, breads, and packaged chef specials.',
  },
  {
    id: 'caterer',
    name: 'Commercial Caterer & Banquet',
    hindi: 'कैटरिंग एवं विवाह समारोह',
    icon: 'soup_kitchen',
    priority: 'High Volume 🟢',
    priorityColor: '#16a34a',
    desc: 'Large buffet surplus from weddings, corporate parties & events (50-300+ meals).',
  },
  {
    id: 'hostel_mess',
    name: 'Student Hostel & College Mess',
    hindi: 'छात्र मेस / हॉस्टल रसोई',
    icon: 'lunch_dining',
    priority: 'Daily Regular 🟢',
    priorityColor: '#16a34a',
    desc: 'Standardized daily surplus meals, dals, rice & rotis with high nutritional balance.',
  },
  {
    id: 'grocer',
    name: 'Grocery, Bakery & Supermarket',
    hindi: 'किराना / बेकरी / सुपरमार्केट',
    icon: 'local_grocery_store',
    priority: 'Packaged & Dry 🟢',
    priorityColor: '#16a34a',
    desc: 'Bakery loaves, fresh dairy, fruits, vegetables, and packaged sealed goods.',
  },
  {
    id: 'hotel',
    name: 'Hotel & Corporate Cafeteria',
    hindi: 'होटल एवं कॉर्पोरेट कैंटीन',
    icon: 'apartment',
    priority: 'Standardized 🟢',
    priorityColor: '#16a34a',
    desc: 'Curated breakfast buffets, executive dining, and clean packaged extras.',
  },
];

const RECIPIENT_INSTITUTIONS = [
  {
    id: 'child_care',
    name: 'Child Care Home (CCI)',
    hindi: 'बाल गृह / शिशु केंद्र',
    icon: 'child_care',
    priority: 'Priority 1 🔴',
    priorityColor: '#dc2626',
    desc: 'Registered under Juvenile Justice Act. Immediate highest-priority dispatch.',
  },
  {
    id: 'old_age',
    name: 'Senior Living / Old Age Home',
    hindi: 'वृद्धाश्रम / वरिष्ठ नागरिक केंद्र',
    icon: 'elderly',
    priority: 'Priority 2 🟡',
    priorityColor: '#d97706',
    desc: 'Assisted care for elderly residents. Low-spice nutritious meals preferred.',
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
    name: 'Community Kitchen / Rain Basera',
    hindi: 'रैन बसेरा / सामुदायिक रसोई',
    icon: 'night_shelter',
    priority: 'Priority 2 🟡',
    priorityColor: '#d97706',
    desc: 'Night shelters and homeless community hot-meal distribution.',
  },
  {
    id: 'ngo',
    name: 'Registered NGO / Food Bank',
    hindi: 'पंजीकृत एनजीओ / फूड बैंक',
    icon: 'diversity_3',
    priority: 'Priority 2 🟡',
    priorityColor: '#d97706',
    desc: 'Community food relief distribution networks with volunteer teams.',
  },
];

const RIDER_MODES = [
  {
    id: 'two_wheeler',
    name: 'Rapid Two-Wheeler Volunteer',
    hindi: 'मोटरसाइकिल / स्कूटर (त्वरित राहत)',
    icon: 'two_wheeler',
    priority: 'Hot Flight SLA <30m ⚡',
    priorityColor: '#2563eb',
    desc: 'Ideal for rapid, nimble hot-meal transfers up to 25-40 kg.',
  },
  {
    id: 'e_rickshaw',
    name: 'Bulk Cargo E-Rickshaw / Auto',
    hindi: 'ई-रिक्शा / थ्री-व्हीलर (थोक पार्सल)',
    icon: 'electric_rickshaw',
    priority: 'Heavy Cargo 50-150kg 🟡',
    priorityColor: '#d97706',
    desc: 'High-payload transfers from banquet halls, catering, and hotel events.',
  },
  {
    id: 'cargo_van',
    name: 'Closed Delivery Van / Mini Cargo',
    hindi: 'डिलीवरी वैन / छोटा हाथी',
    icon: 'local_shipping',
    priority: 'Inter-Hub Long Route 🟢',
    priorityColor: '#16a34a',
    desc: 'Multi-stop institutional routes, cold chain boxes, and heavy bulk crates.',
  },
  {
    id: 'bicycle',
    name: 'Eco-Bicycle Neighborhood Courier',
    hindi: 'साइकिल कोरियर (स्थानीय दूरी <2km)',
    icon: 'pedal_bike',
    priority: 'Hyperlocal <2km 🟢',
    priorityColor: '#16a34a',
    desc: 'Zero-emission short-hop food transfers between nearby mess and shelters.',
  },
];

export default function VerificationPage() {
  const navigate = useNavigate();
  const { user, showToast } = useApp();

  const userRole = user?.role === 'driver' ? 'driver' : user?.role === 'recipient' ? 'recipient' : 'donor';
  const userId = user?.id ? `user-${user.id}` : (userRole === 'driver' ? 'dr-1' : userRole === 'donor' ? 'd-1' : 'r-1');

  const {
    verCase, documents, checks, draft, setDraft,
    loading, saving, submitting, error,
    refresh, saveDraft, uploadDocument, removeDocument, submit,
    level, state, canReceive, canDonate, canDeliver
  } = useVerification(userId, userRole);

  const [step, setStep] = useState(1);

  // Common Fields
  const [contactName, setContactName] = useState(draft.contact_name || (user?.name || (userRole === 'driver' ? 'Rahul Kumar' : userRole === 'donor' ? 'Royal Spice Kitchen' : 'Asha Nilayam Trust')));
  const [contactPhone, setContactPhone] = useState(draft.contact_phone || (user?.phone || '+91 98765 43210'));
  const [address, setAddress] = useState(draft.address || (userRole === 'driver' ? 'Vigyan Nagar & Talwandi, Kota' : 'Talwandi, Kota, Rajasthan'));

  // Donor & Shelter Fields
  const [orgName, setOrgName] = useState(draft.org_name || (user?.name || (userRole === 'donor' ? 'Royal Spice Kitchen' : 'Asha Nilayam Trust')));
  const [selectedType, setSelectedType] = useState(draft.org_type || draft.vehicle_type || (userRole === 'donor' ? 'restaurant' : userRole === 'driver' ? 'two_wheeler' : 'child_care'));
  const [regNumber, setRegNumber] = useState(draft.org_reg_number || 'MAH/2019/00481');
  const [darpanId, setDarpanId] = useState(draft.ngo_darpan_id || 'RJ/2021/029410');
  const [fssaiNumber, setFssaiNumber] = useState(draft.fssai_number || '12023019000452');
  const [hasColdChain, setHasColdChain] = useState(draft.has_cold_chain ?? true);
  const [hasKitchen, setHasKitchen] = useState(draft.has_hygiene_cert ?? true);

  // Rider-Specific Fields
  const [vehicleNumber, setVehicleNumber] = useState(draft.vehicle_number || 'RJ-20-AB-1234');
  const [dlNumber, setDlNumber] = useState(draft.dl_number || 'RJ20 20210012345');
  const [serviceZone, setServiceZone] = useState(draft.service_zone || 'Kota Central & Talwandi');
  const [emergencyContactName, setEmergencyContactName] = useState(draft.emergency_contact_name || 'Sunil Kumar (Brother)');
  const [emergencyContactPhone, setEmergencyContactPhone] = useState(draft.emergency_contact_phone || '+91 98762 99999');
  const [vehicleCapacityKg, setVehicleCapacityKg] = useState(draft.vehicle_capacity_kg || 40);
  const [hasInsulatedBag, setHasInsulatedBag] = useState(draft.has_insulated_bag ?? true);
  const [hasSpillStraps, setHasSpillStraps] = useState(draft.has_spill_proof_straps ?? true);
  const [insuranceValid, setInsuranceValid] = useState(draft.insurance_valid ?? true);

  // Consents & Declarations
  const [consentData, setConsentData] = useState(true);
  const [consentTerms, setConsentTerms] = useState(true);
  const [consentSafety, setConsentSafety] = useState(true);
  const [mockUploading, setMockUploading] = useState(false);

  // Sync draft data when loaded
  useEffect(() => {
    if (draft.org_name) setOrgName(draft.org_name);
    if (draft.contact_name) setContactName(draft.contact_name);
    if (draft.contact_phone) setContactPhone(draft.contact_phone);
    if (draft.org_type || draft.vehicle_type) setSelectedType(draft.org_type || draft.vehicle_type);
    if (draft.fssai_number) setFssaiNumber(draft.fssai_number);
    if (draft.dl_number) setDlNumber(draft.dl_number);
    if (draft.vehicle_number) setVehicleNumber(draft.vehicle_number);
  }, [draft]);

  const handleNext = async () => {
    await saveDraft({
      org_name: orgName,
      contact_name: contactName,
      contact_phone: contactPhone,
      address,
      org_type: selectedType,
      vehicle_type: selectedType,
      org_reg_number: regNumber,
      ngo_darpan_id: darpanId,
      fssai_number: fssaiNumber,
      has_cold_chain: hasColdChain,
      has_hygiene_cert: hasKitchen,
      dl_number: dlNumber,
      vehicle_number: vehicleNumber,
      service_zone: serviceZone,
      emergency_contact_name: emergencyContactName,
      emergency_contact_phone: emergencyContactPhone,
      vehicle_capacity_kg: vehicleCapacityKg,
      has_insulated_bag: hasInsulatedBag,
      has_spill_proof_straps: hasSpillStraps,
      insurance_valid: insuranceValid,
      step,
    });
    if (step < 4) setStep(step + 1);
  };

  const handleSimulatedUpload = async (docType) => {
    setMockUploading(true);
    try {
      const mockMeta = {
        number: docType === 'driving_license' ? dlNumber :
                docType === 'vehicle_rc' ? vehicleNumber :
                docType === 'fssai' ? fssaiNumber :
                docType === 'ngo_darpan' ? darpanId : 'DOC1234567',
        name: userRole === 'driver' ? contactName : orgName,
        issued_by: docType === 'driving_license' ? 'RTO Kota (Transport Dept)' :
                   docType === 'vehicle_rc' ? 'MoRTH Vahan Registry' :
                   docType === 'fssai' ? 'FSSAI Kota Regional Office' :
                   'Charity Commissioner / Govt of Rajasthan',
      };
      await uploadDocument(docType, { type: 'application/pdf', size: 184000 }, mockMeta);
      showToast(`Document uploaded & validated: ${docType.replace(/_/g, ' ').toUpperCase()}`, 'verified');
    } finally {
      setMockUploading(false);
    }
  };

  const handleSubmitCase = async (autoVerify = false) => {
    await saveDraft({
      org_name: orgName,
      contact_name: contactName,
      contact_phone: contactPhone,
      address,
      org_type: selectedType,
      vehicle_type: selectedType,
      org_reg_number: regNumber,
      ngo_darpan_id: darpanId,
      fssai_number: fssaiNumber,
      dl_number: dlNumber,
      vehicle_number: vehicleNumber,
      service_zone: serviceZone,
      has_cold_chain: hasColdChain,
      has_hygiene_cert: hasKitchen,
      has_insulated_bag: hasInsulatedBag,
      consent_data_processing: consentData,
      consent_terms: consentTerms,
      rider_safety_undertaking: consentSafety,
      food_handling_undertaking: consentSafety,
      declaration_signed: true,
    });

    const res = await submit(autoVerify);
    if (autoVerify) {
      showToast(userRole === 'driver' ? 'Simulation: Rescue Rider verified instantly!' : 'Simulation: Profile verified instantly!', 'verified');
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
            <div style={{ fontWeight: 800, fontSize: 13 }}>
              {userRole === 'driver' ? `LEVEL ${level || 2} VERIFIED RESCUE RIDER` :
               userRole === 'donor' ? `LEVEL ${level || 2} VERIFIED FOOD DONOR` :
               `LEVEL ${level || 2} VERIFIED INSTITUTION`}
            </div>
            <div style={{ fontSize: 12, opacity: 0.9 }}>
              {userRole === 'driver' ? 'Cleared for active rapid food rescue dispatches & emergency SOS runs.' :
               userRole === 'donor' ? 'Authorized to publish food surplus under FSSAI Good Samaritan Protocol.' :
               'Authorized for high-volume priority surplus dispatch under FSSAI Good Samaritan Protocol.'}
            </div>
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
            <div style={{ fontSize: 12, opacity: 0.9 }}>
              {userRole === 'driver' ? 'Operations Dispatch Desk verifying Driving License and vehicle safety credentials.' :
               'District Food Safety Inspector reviewing credentials. Turnaround SLA < 4 hours.'}
            </div>
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

  const getRoleHeaderInfo = () => {
    if (userRole === 'driver') {
      return {
        title: 'Rescue Rider Verification',
        subtitle: 'DL, Vehicle & Safety Clearance Desk',
        step1Title: 'Rider Category & Base Zone',
        step1Desc: 'Choose your vehicle class to configure rescue payload and dispatch routing.',
        step2Title: 'Vehicle & Transport Safety Specs',
        step2Desc: 'Verify your driving license and thermal cargo transport gear.',
        step3Title: 'DL & Vehicle Document OCR',
        step3Desc: 'Upload digital copies of your Driving License and Vehicle RC.',
        step4Title: 'Rider Safety Code & Undertaking',
        step4Desc: 'Commitment to upright food transit, thermal discipline & traffic safety.',
      };
    }
    if (userRole === 'donor') {
      return {
        title: 'Commercial Kitchen Verification',
        subtitle: 'FSSAI Food Safety & Good Samaritan Desk',
        step1Title: 'Establishment Classification',
        step1Desc: 'Select your food business category to establish surplus matching and safe shelf life.',
        step2Title: 'FSSAI License & Food Safety',
        step2Desc: 'FSSAI 14-digit registration ensures full Good Samaritan legal immunity.',
        step3Title: 'FSSAI & Business Credentials',
        step3Desc: 'Upload digital copies of FSSAI certificate and commercial GSTIN / PAN.',
        step4Title: 'FSSAI Good Samaritan Declaration',
        step4Desc: 'Legal undertaking affirming hygienic preparation and zero commercial resale.',
      };
    }
    return {
      title: 'Institution Verification',
      subtitle: 'Social Welfare & Food Safety Desk',
      step1Title: 'Institution Classification',
      step1Desc: 'Select your institution category to establish automatic routing priority and hygiene requirements.',
      step2Title: 'Intake Capacity & Facilities',
      step2Desc: 'Verify on-site cold storage, reheating setups, and dietary capacity.',
      step3Title: 'NGO Darpan & Legal Documents',
      step3Desc: 'Upload digital copies of NGO Darpan ID, 12A/80G, and welfare clearances.',
      step4Title: 'Humanitarian Intake Undertaking',
      step4Desc: 'Confirmation of 100% free meal distribution to verified inmates and beneficiaries.',
    };
  };

  const headerInfo = getRoleHeaderInfo();

  return (
    <div style={{ minHeight: '100dvh', background: 'var(--surface)', display: 'flex', flexDirection: 'column' }}>
      <TopBar
        title={headerInfo.title}
        subtitle={headerInfo.subtitle}
        showBack
        onBack={() => navigate(-1)}
      />

      <main style={{ flex: 1, paddingTop: 68, paddingBottom: 90, overflowY: 'auto', paddingLeft: 16, paddingRight: 16 }}>
        {/* Step Indicator Header */}
        <div style={{ margin: '14px 0', background: 'var(--surface-container-lowest)', borderRadius: 20, padding: '16px 18px', boxShadow: 'var(--shadow-card)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <span style={{ fontSize: 11, fontWeight: 800, color: 'var(--primary-dark)', letterSpacing: 0.5, textTransform: 'uppercase' }}>
              Step {step} of 4 • {step === 1 ? 'Classification' : step === 2 ? 'Safety Specs' : step === 3 ? 'Documents' : 'Status & Review'}
            </span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: userRole === 'driver' ? 'rgba(37,99,235,0.1)' : 'rgba(0,110,22,0.1)', color: userRole === 'driver' ? '#2563eb' : 'var(--tertiary)', fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 999 }}>
              <span className="material-symbols-outlined" style={{ fontSize: 14 }}>{userRole === 'driver' ? 'two_wheeler' : 'shield'}</span>
              {userRole === 'driver' ? 'RTO / Road Safety Verified' : 'FSSAI Compliant'}
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

        {/* Status Banner */}
        {getStatusBadge() && <div style={{ marginBottom: 16 }}>{getStatusBadge()}</div>}

        {/* ════════════════════ STEP 1: CLASSIFICATION ════════════════════ */}
        {step === 1 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <h2 className="text-headline-sm" style={{ margin: '0 0 4px' }}>{headerInfo.step1Title}</h2>
              <p className="text-body-sm" style={{ color: 'var(--on-surface-variant)', margin: 0 }}>
                {headerInfo.step1Desc}
              </p>
            </div>

            {/* List of Category Cards */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {(userRole === 'driver' ? RIDER_MODES : userRole === 'donor' ? DONOR_ESTABLISHMENTS : RECIPIENT_INSTITUTIONS).map(type => {
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

            {/* Legal Entity / Identity Info Card */}
            <div style={{ background: 'var(--surface-container-lowest)', borderRadius: 20, padding: 16, display: 'flex', flexDirection: 'column', gap: 12, marginTop: 4 }}>
              <div className="text-label-lg" style={{ color: 'var(--primary-dark)', textTransform: 'uppercase' }}>
                {userRole === 'driver' ? 'Rider Identity & Operating Zone' : userRole === 'donor' ? 'Business Legal Identity' : 'Legal Entity Info'}
              </div>

              {userRole === 'driver' ? (
                <>
                  <div>
                    <label className="text-label-sm" style={{ color: 'var(--on-surface-variant)', display: 'block', marginBottom: 4 }}>
                      Full Legal Name (as on Driving License)
                    </label>
                    <input
                      type="text"
                      value={contactName}
                      onChange={e => setContactName(e.target.value)}
                      style={{ width: '100%', height: 44, padding: '0 12px', borderRadius: 12, border: '1px solid var(--outline-variant)', background: 'var(--surface-container-low)', fontSize: 14, fontWeight: 600 }}
                      placeholder="e.g. Rahul Kumar"
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                    <div>
                      <label className="text-label-sm" style={{ color: 'var(--on-surface-variant)', display: 'block', marginBottom: 4 }}>
                        Rider Mobile Phone
                      </label>
                      <input
                        type="tel"
                        value={contactPhone}
                        onChange={e => setContactPhone(e.target.value)}
                        style={{ width: '100%', height: 44, padding: '0 12px', borderRadius: 12, border: '1px solid var(--outline-variant)', background: 'var(--surface-container-low)', fontSize: 13 }}
                      />
                    </div>
                    <div>
                      <label className="text-label-sm" style={{ color: 'var(--on-surface-variant)', display: 'block', marginBottom: 4 }}>
                        Base Hub / Operating Area
                      </label>
                      <input
                        type="text"
                        value={serviceZone}
                        onChange={e => setServiceZone(e.target.value)}
                        style={{ width: '100%', height: 44, padding: '0 12px', borderRadius: 12, border: '1px solid var(--outline-variant)', background: 'var(--surface-container-low)', fontSize: 13 }}
                        placeholder="e.g. Kota Central & Talwandi"
                      />
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                    <div>
                      <label className="text-label-sm" style={{ color: 'var(--on-surface-variant)', display: 'block', marginBottom: 4 }}>
                        Emergency Contact Person
                      </label>
                      <input
                        type="text"
                        value={emergencyContactName}
                        onChange={e => setEmergencyContactName(e.target.value)}
                        style={{ width: '100%', height: 44, padding: '0 12px', borderRadius: 12, border: '1px solid var(--outline-variant)', background: 'var(--surface-container-low)', fontSize: 13 }}
                        placeholder="e.g. Family member name"
                      />
                    </div>
                    <div>
                      <label className="text-label-sm" style={{ color: 'var(--on-surface-variant)', display: 'block', marginBottom: 4 }}>
                        Emergency Phone
                      </label>
                      <input
                        type="tel"
                        value={emergencyContactPhone}
                        onChange={e => setEmergencyContactPhone(e.target.value)}
                        style={{ width: '100%', height: 44, padding: '0 12px', borderRadius: 12, border: '1px solid var(--outline-variant)', background: 'var(--surface-container-low)', fontSize: 13 }}
                      />
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <label className="text-label-sm" style={{ color: 'var(--on-surface-variant)', display: 'block', marginBottom: 4 }}>
                      {userRole === 'donor' ? 'Establishment / Restaurant Name' : 'Registered Institution / Trust Name'}
                    </label>
                    <input
                      type="text"
                      value={orgName}
                      onChange={e => setOrgName(e.target.value)}
                      style={{ width: '100%', height: 44, padding: '0 12px', borderRadius: 12, border: '1px solid var(--outline-variant)', background: 'var(--surface-container-low)', fontSize: 14, fontWeight: 600 }}
                      placeholder={userRole === 'donor' ? 'e.g. Royal Spice Kitchen' : 'e.g. Asha Nilayam Trust'}
                    />
                  </div>

                  {userRole === 'recipient' && (
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
                  )}

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
                        Official Phone
                      </label>
                      <input
                        type="tel"
                        value={contactPhone}
                        onChange={e => setContactPhone(e.target.value)}
                        style={{ width: '100%', height: 44, padding: '0 12px', borderRadius: 12, border: '1px solid var(--outline-variant)', background: 'var(--surface-container-low)', fontSize: 13 }}
                      />
                    </div>
                  </div>
                </>
              )}
            </div>

            <button
              onClick={handleNext}
              className="btn-primary"
              style={{ width: '100%', marginTop: 8 }}
            >
              <span>Continue to Safety Details</span>
              <span className="material-symbols-outlined">arrow_forward</span>
            </button>
          </div>
        )}

        {/* ════════════════════ STEP 2: SAFETY & FACILITIES ════════════════════ */}
        {step === 2 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <h2 className="text-headline-sm" style={{ margin: '0 0 4px' }}>{headerInfo.step2Title}</h2>
              <p className="text-body-sm" style={{ color: 'var(--on-surface-variant)', margin: 0 }}>
                {headerInfo.step2Desc}
              </p>
            </div>

            {userRole === 'driver' ? (
              <>
                {/* Driver Vehicle & DL Card */}
                <div style={{ background: 'var(--surface-container-lowest)', borderRadius: 20, padding: 18, boxShadow: 'var(--shadow-card)', display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span className="material-symbols-outlined" style={{ color: '#2563eb', fontSize: 28 }}>badge</span>
                    <div>
                      <div style={{ fontWeight: 800, fontSize: 14 }}>Driving License & Vehicle Registration</div>
                      <div style={{ fontSize: 12, color: 'var(--on-surface-variant)' }}>Required for automated RTO transport verification</div>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                    <div>
                      <label className="text-label-sm" style={{ color: 'var(--on-surface-variant)', display: 'block', marginBottom: 4 }}>
                        Driving License (DL) Number
                      </label>
                      <input
                        type="text"
                        value={dlNumber}
                        onChange={e => setDlNumber(e.target.value.toUpperCase())}
                        style={{ width: '100%', height: 44, padding: '0 12px', borderRadius: 12, border: '1px solid var(--outline-variant)', background: 'var(--surface-container-low)', fontSize: 13, fontWeight: 700, letterSpacing: 0.5 }}
                        placeholder="RJ20 20210012345"
                      />
                    </div>
                    <div>
                      <label className="text-label-sm" style={{ color: 'var(--on-surface-variant)', display: 'block', marginBottom: 4 }}>
                        Vehicle RC Number
                      </label>
                      <input
                        type="text"
                        value={vehicleNumber}
                        onChange={e => setVehicleNumber(e.target.value.toUpperCase())}
                        style={{ width: '100%', height: 44, padding: '0 12px', borderRadius: 12, border: '1px solid var(--outline-variant)', background: 'var(--surface-container-low)', fontSize: 13, fontWeight: 700, letterSpacing: 0.5 }}
                        placeholder="RJ-20-AB-1234"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-label-sm" style={{ color: 'var(--on-surface-variant)', display: 'block', marginBottom: 4 }}>
                      Max Food Payload Capacity (kg)
                    </label>
                    <input
                      type="number"
                      value={vehicleCapacityKg}
                      onChange={e => setVehicleCapacityKg(Number(e.target.value))}
                      style={{ width: '100%', height: 44, padding: '0 12px', borderRadius: 12, border: '1px solid var(--outline-variant)', background: 'var(--surface-container-low)', fontSize: 14, fontWeight: 700 }}
                      placeholder="40"
                    />
                  </div>
                </div>

                {/* Rider Gear Checklist */}
                <div style={{ background: 'var(--surface-container-lowest)', borderRadius: 20, padding: 18, display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <div className="text-label-lg" style={{ color: 'var(--primary-dark)', textTransform: 'uppercase' }}>
                    Rider Equipment & Transit Safety
                  </div>

                  <label style={{ display: 'flex', alignItems: 'flex-start', gap: 12, cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={hasInsulatedBag}
                      onChange={e => setHasInsulatedBag(e.target.checked)}
                      style={{ width: 22, height: 22, accentColor: '#2563eb', marginTop: 2 }}
                    />
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 14 }}>Insulated Thermal Delivery Bag / Hot Box</div>
                      <div style={{ fontSize: 12, color: 'var(--on-surface-variant)', lineHeight: 1.4 }}>
                        Maintains food temperature above 60°C or below 8°C throughout the transit flight.
                      </div>
                    </div>
                  </label>

                  <label style={{ display: 'flex', alignItems: 'flex-start', gap: 12, cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={hasSpillStraps}
                      onChange={e => setHasSpillStraps(e.target.checked)}
                      style={{ width: 22, height: 22, accentColor: '#2563eb', marginTop: 2 }}
                    />
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 14 }}>Spill-Proof Cargo Straps & Upright Carrier</div>
                      <div style={{ fontSize: 12, color: 'var(--on-surface-variant)', lineHeight: 1.4 }}>
                        Gravies and cooked trays secured safely against road bumps and sudden braking.
                      </div>
                    </div>
                  </label>

                  <label style={{ display: 'flex', alignItems: 'flex-start', gap: 12, cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={insuranceValid}
                      onChange={e => setInsuranceValid(e.target.checked)}
                      style={{ width: 22, height: 22, accentColor: '#2563eb', marginTop: 2 }}
                    />
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 14 }}>Valid Vehicle Insurance & Helmet / Safety Gear</div>
                      <div style={{ fontSize: 12, color: 'var(--on-surface-variant)', lineHeight: 1.4 }}>
                        Active third-party insurance and ISI certified helmet for all rescue missions.
                      </div>
                    </div>
                  </label>
                </div>
              </>
            ) : (
              <>
                {/* Donor / Recipient FSSAI Card */}
                <div style={{ background: 'var(--surface-container-lowest)', borderRadius: 20, padding: 18, boxShadow: 'var(--shadow-card)', display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span className="material-symbols-outlined" style={{ color: 'var(--tertiary)', fontSize: 28 }}>verified</span>
                    <div>
                      <div style={{ fontWeight: 800, fontSize: 14 }}>14-Digit FSSAI Registration / License</div>
                      <div style={{ fontSize: 12, color: 'var(--on-surface-variant)' }}>
                        {userRole === 'donor' ? 'Mandatory for commercial food donors under FSSAI Surplus Regulations' : 'Required for institutional kitchen inspection and verification'}
                      </div>
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

                {/* Facilities Checklist */}
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
                        Allows storing dairy surplus, salads, and overnight preservation without quality loss.
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
                      <div style={{ fontWeight: 700, fontSize: 14 }}>Commercial Reheating & Food Grade Containers</div>
                      <div style={{ fontSize: 12, color: 'var(--on-surface-variant)', lineHeight: 1.4 }}>
                        Food stored and reheated above 65°C using hygienic food-grade stainless steel or tamper-proof packs.
                      </div>
                    </div>
                  </label>
                </div>
              </>
            )}

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

        {/* ════════════════════ STEP 3: DOCUMENTS & OCR ════════════════════ */}
        {step === 3 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <h2 className="text-headline-sm" style={{ margin: '0 0 4px' }}>{headerInfo.step3Title}</h2>
              <p className="text-body-sm" style={{ color: 'var(--on-surface-variant)', margin: 0 }}>
                {headerInfo.step3Desc}
              </p>
            </div>

            {/* Role-Specific Document Cards */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {userRole === 'driver' ? (
                <>
                  {/* Driving License */}
                  <div style={{ background: 'var(--surface-container-lowest)', borderRadius: 18, padding: 16, boxShadow: 'var(--shadow-card)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 40, height: 40, borderRadius: 10, background: '#dbeafe', color: '#1d4ed8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <span className="material-symbols-outlined">badge</span>
                        </div>
                        <div>
                          <div style={{ fontWeight: 800, fontSize: 14 }}>Driving License (DL - Front & Back)</div>
                          <div style={{ fontSize: 12, color: 'var(--on-surface-variant)' }}>Govt issued RTO valid transport license</div>
                        </div>
                      </div>

                      {documents.some(d => d.doc_type === 'driving_license') ? (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: '#dcfce7', color: '#166534', padding: '4px 10px', borderRadius: 999, fontSize: 11, fontWeight: 700 }}>
                          <span className="material-symbols-outlined" style={{ fontSize: 14 }}>check_circle</span> Verified
                        </span>
                      ) : (
                        <button
                          onClick={() => handleSimulatedUpload('driving_license')}
                          disabled={mockUploading}
                          style={{ padding: '6px 14px', borderRadius: 10, background: 'var(--primary)', color: 'white', border: 'none', fontWeight: 700, fontSize: 12, cursor: 'pointer' }}
                        >
                          {mockUploading ? 'Validating...' : '+ Upload DL'}
                        </button>
                      )}
                    </div>

                    <div style={{ fontSize: 12, color: 'var(--on-surface-variant)', background: 'var(--surface-container-low)', padding: '8px 12px', borderRadius: 10 }}>
                      Linked DL No: <strong>{dlNumber || 'RJ20 20210012345'}</strong> • Sarathi RTO registry check active
                    </div>
                  </div>

                  {/* Vehicle RC */}
                  <div style={{ background: 'var(--surface-container-lowest)', borderRadius: 18, padding: 16, boxShadow: 'var(--shadow-card)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 40, height: 40, borderRadius: 10, background: '#fef3c7', color: '#b45309', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <span className="material-symbols-outlined">directions_car</span>
                        </div>
                        <div>
                          <div style={{ fontWeight: 800, fontSize: 14 }}>Vehicle Registration Certificate (RC)</div>
                          <div style={{ fontSize: 12, color: 'var(--on-surface-variant)' }}>MoRTH Vahan vehicle registration card</div>
                        </div>
                      </div>

                      {documents.some(d => d.doc_type === 'vehicle_rc') ? (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: '#dcfce7', color: '#166534', padding: '4px 10px', borderRadius: 999, fontSize: 11, fontWeight: 700 }}>
                          <span className="material-symbols-outlined" style={{ fontSize: 14 }}>check_circle</span> Verified
                        </span>
                      ) : (
                        <button
                          onClick={() => handleSimulatedUpload('vehicle_rc')}
                          disabled={mockUploading}
                          style={{ padding: '6px 14px', borderRadius: 10, background: 'var(--primary)', color: 'white', border: 'none', fontWeight: 700, fontSize: 12, cursor: 'pointer' }}
                        >
                          {mockUploading ? 'Checking...' : '+ Upload RC'}
                        </button>
                      )}
                    </div>

                    <div style={{ fontSize: 12, color: 'var(--on-surface-variant)', background: 'var(--surface-container-low)', padding: '8px 12px', borderRadius: 10 }}>
                      Plate: <strong>{vehicleNumber || 'RJ-20-AB-1234'}</strong> • Vahan OCR matching enabled
                    </div>
                  </div>

                  {/* ID Proof */}
                  <div style={{ background: 'var(--surface-container-lowest)', borderRadius: 18, padding: 16, boxShadow: 'var(--shadow-card)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 40, height: 40, borderRadius: 10, background: '#e0e7ff', color: '#3730a3', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <span className="material-symbols-outlined">fingerprint</span>
                        </div>
                        <div>
                          <div style={{ fontWeight: 800, fontSize: 14 }}>Aadhaar / Voter ID / Govt ID</div>
                          <div style={{ fontSize: 12, color: 'var(--on-surface-variant)' }}>Rider personal identity confirmation</div>
                        </div>
                      </div>

                      {documents.some(d => d.doc_type === 'id_proof') ? (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: '#dcfce7', color: '#166534', padding: '4px 10px', borderRadius: 999, fontSize: 11, fontWeight: 700 }}>
                          <span className="material-symbols-outlined" style={{ fontSize: 14 }}>check_circle</span> Verified
                        </span>
                      ) : (
                        <button
                          onClick={() => handleSimulatedUpload('id_proof')}
                          disabled={mockUploading}
                          style={{ padding: '6px 14px', borderRadius: 10, background: 'var(--primary)', color: 'white', border: 'none', fontWeight: 700, fontSize: 12, cursor: 'pointer' }}
                        >
                          {mockUploading ? 'Uploading...' : '+ Upload ID'}
                        </button>
                      )}
                    </div>

                    <div style={{ fontSize: 12, color: 'var(--on-surface-variant)', background: 'var(--surface-container-low)', padding: '8px 12px', borderRadius: 10 }}>
                      Rider: <strong>{contactName}</strong> • Automated cross-entity identity verification
                    </div>
                  </div>
                </>
              ) : (
                <>
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
                          {mockUploading ? 'Checking...' : '+ Upload FSSAI'}
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
                          <div style={{ fontWeight: 800, fontSize: 14 }}>
                            {userRole === 'donor' ? 'GSTIN / Business PAN Certificate' : 'Trust Deed / 12A Certificate / PAN'}
                          </div>
                          <div style={{ fontSize: 12, color: 'var(--on-surface-variant)' }}>Govt issued entity verification proof</div>
                        </div>
                      </div>

                      {documents.some(d => d.doc_type === 'pan' || d.doc_type === 'registration_cert' || d.doc_type === 'ngo_darpan') ? (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: '#dcfce7', color: '#166534', padding: '4px 10px', borderRadius: 999, fontSize: 11, fontWeight: 700 }}>
                          <span className="material-symbols-outlined" style={{ fontSize: 14 }}>check_circle</span> Verified
                        </span>
                      ) : (
                        <button
                          onClick={() => handleSimulatedUpload(userRole === 'recipient' ? 'ngo_darpan' : 'pan')}
                          disabled={mockUploading}
                          style={{ padding: '6px 14px', borderRadius: 10, background: 'var(--primary)', color: 'white', border: 'none', fontWeight: 700, fontSize: 12, cursor: 'pointer' }}
                        >
                          {mockUploading ? 'Checking...' : '+ Upload'}
                        </button>
                      )}
                    </div>

                    <div style={{ fontSize: 12, color: 'var(--on-surface-variant)', background: 'var(--surface-container-low)', padding: '8px 12px', borderRadius: 10 }}>
                      Entity: <strong>{orgName}</strong> • Automated cross-registry check
                    </div>
                  </div>
                </>
              )}
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
                {userRole === 'driver' ? (
                  <>
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: '#4ade80' }}>
                      <span>✓ DL Sarathi API validity check:</span>
                      <span>ACTIVE (LMV / MCWG)</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: '#4ade80' }}>
                      <span>✓ MoRTH Vahan RC & Insurance:</span>
                      <span>MATCHED & VALID</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: '#4ade80' }}>
                      <span>✓ Road safety & cargo thermal check:</span>
                      <span>CONFIRMED</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: '#facc15' }}>
                      <span>⏳ Operations Dispatch Desk:</span>
                      <span>QUEUED (&lt;2h Priority Clearance)</span>
                    </div>
                  </>
                ) : (
                  <>
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
                      <span>CONFIDENCE 96%</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: '#facc15' }}>
                      <span>⏳ District Food Inspector Desk:</span>
                      <span>QUEUED (&lt;4h SLA)</span>
                    </div>
                  </>
                )}
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

        {/* ════════════════════ STEP 4: REVIEW & DECLARATION ════════════════════ */}
        {step === 4 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <h2 className="text-headline-sm" style={{ margin: '0 0 4px' }}>{headerInfo.step4Title}</h2>
              <p className="text-body-sm" style={{ color: 'var(--on-surface-variant)', margin: 0 }}>
                {headerInfo.step4Desc}
              </p>
            </div>

            {/* Dossier Summary Card */}
            <div style={{ background: 'var(--surface-container-lowest)', borderRadius: 20, padding: 16, boxShadow: 'var(--shadow-card)', display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div className="text-label-md" style={{ color: 'var(--primary-dark)', fontWeight: 800 }}>
                {userRole === 'driver' ? 'Rider Flight Dossier Summary' : 'Application Dossier Summary'}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, fontSize: 13 }}>
                <div>
                  <span style={{ color: 'var(--on-surface-variant)', display: 'block', fontSize: 11 }}>
                    {userRole === 'driver' ? 'Rider Name:' : 'Entity Name:'}
                  </span>
                  <strong>{userRole === 'driver' ? contactName : orgName}</strong>
                </div>
                <div>
                  <span style={{ color: 'var(--on-surface-variant)', display: 'block', fontSize: 11 }}>Category:</span>
                  <strong>{selectedType.replace(/_/g, ' ').toUpperCase()}</strong>
                </div>
                <div>
                  <span style={{ color: 'var(--on-surface-variant)', display: 'block', fontSize: 11 }}>
                    {userRole === 'driver' ? 'DL & Vehicle RC:' : 'FSSAI Number:'}
                  </span>
                  <strong>{userRole === 'driver' ? `${dlNumber} • ${vehicleNumber}` : (fssaiNumber || '12023019000452')}</strong>
                </div>
                <div>
                  <span style={{ color: 'var(--on-surface-variant)', display: 'block', fontSize: 11 }}>Contact:</span>
                  <strong>{contactPhone}</strong>
                </div>
              </div>
            </div>

            {/* Role-Specific Declarations */}
            <div style={{ background: 'var(--surface-container-lowest)', borderRadius: 20, padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
              {userRole === 'driver' ? (
                <>
                  <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={consentTerms}
                      onChange={e => setConsentTerms(e.target.checked)}
                      style={{ width: 20, height: 20, accentColor: '#2563eb', marginTop: 2 }}
                    />
                    <div style={{ fontSize: 12, lineHeight: 1.4, color: 'var(--on-surface)' }}>
                      I commit to handling all prepared and packaged surplus with strict thermal discipline, upright transit, and zero contamination.
                    </div>
                  </label>

                  <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={consentSafety}
                      onChange={e => setConsentSafety(e.target.checked)}
                      style={{ width: 20, height: 20, accentColor: '#2563eb', marginTop: 2 }}
                    />
                    <div style={{ fontSize: 12, lineHeight: 1.4, color: 'var(--on-surface)' }}>
                      I adhere to all Motor Vehicle Act safety guidelines, helmet/seatbelt rules, and commit to delivering within the designated 45-minute hot-flight window.
                    </div>
                  </label>

                  <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={consentData}
                      onChange={e => setConsentData(e.target.checked)}
                      style={{ width: 20, height: 20, accentColor: '#2563eb', marginTop: 2 }}
                    />
                    <div style={{ fontSize: 12, lineHeight: 1.4, color: 'var(--on-surface)' }}>
                      I authorize the JanSeva Dispatch Desk to verify my Driving License and route emergency food rescue assignments to my device.
                    </div>
                  </label>
                </>
              ) : (
                <>
                  <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={consentTerms}
                      onChange={e => setConsentTerms(e.target.checked)}
                      style={{ width: 20, height: 20, accentColor: 'var(--tertiary)', marginTop: 2 }}
                    />
                    <div style={{ fontSize: 12, lineHeight: 1.4, color: 'var(--on-surface)' }}>
                      I confirm that our establishment adheres to FSSAI safe food handling guidelines and operates on non-commercial humanitarian distribution principles.
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
                </>
              )}
            </div>

            {/* Submit Action Buttons */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 8 }}>
              <button
                onClick={() => handleSubmitCase(false)}
                disabled={submitting || !consentTerms || !consentData || (userRole === 'driver' && !consentSafety)}
                className="btn-primary"
                style={{ width: '100%', height: 50, fontSize: 15 }}
              >
                <span className="material-symbols-outlined">send</span>
                <span>{submitting ? 'Submitting...' : 'Submit to Operations Verification Desk'}</span>
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
