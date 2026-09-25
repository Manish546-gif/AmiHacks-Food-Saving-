import { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { TopBar } from '../../components/Navigation';
import { VegDot } from '../../components/DonationCard';

const CATEGORIES = [
  { id: 'cooked', label: 'Cooked Food', icon: 'soup_kitchen', maxHours: 4 },
  { id: 'bakery', label: 'Bakery', icon: 'bakery_dining', maxHours: 8 },
  { id: 'produce', label: 'Fresh Produce', icon: 'eco', maxHours: 6 },
  { id: 'dairy', label: 'Dairy', icon: 'water_drop', maxHours: 3 },
  { id: 'packaged', label: 'Packaged', icon: 'inventory_2', maxHours: 48 },
];

const DIETARY_OPTIONS = [
  { id: 'veg', label: 'Pure Veg', icon: '🟢', color: 'var(--tertiary)' },
  { id: 'non_veg', label: 'Non-Veg', icon: '🔴', color: 'var(--secondary)' },
  { id: 'jain', label: 'Jain', icon: '🟡', color: '#c88000' },
];

const PARSE_EXAMPLES = [
  '40 kg veg biryani, ready 6:30pm, good for 4 hours',
  '18 kg paneer curry & dal, ready now, safe for 3 hours',
  '80 buns and assorted bakery, ready 5pm, good for 8 hours',
];

// Simple NLP parser (frontend demo - real version would call API)
function parseText(text) {
  const lower = text.toLowerCase();
  const kgMatch = lower.match(/(\d+(?:\.\d+)?)\s*(?:kg|kilo|kilos)/);
  const hoursMatch = lower.match(/(\d+(?:\.\d+)?)\s*(?:hour|hr|hours|hrs)/);
  const isVeg = lower.includes('veg') && !lower.includes('non-veg') && !lower.includes('nonveg');
  const isNonVeg = lower.includes('non-veg') || lower.includes('nonveg') || lower.includes('chicken') || lower.includes('mutton') || lower.includes('fish') || lower.includes('egg');

  const timeMatch = lower.match(/(\d{1,2}):?(\d{2})?\s*(am|pm|tonight|now)/);
  let readyAt = null;
  if (timeMatch) {
    const now = new Date();
    let hours = parseInt(timeMatch[1]);
    const mins = parseInt(timeMatch[2] ?? '0');
    if (timeMatch[3] === 'pm' && hours < 12) hours += 12;
    readyAt = new Date(now);
    readyAt.setHours(hours, mins, 0, 0);
    if (readyAt < now) readyAt.setDate(readyAt.getDate() + 1);
  }

  // Guess category
  let category = 'cooked';
  if (lower.includes('bakery') || lower.includes('bread') || lower.includes('bun') || lower.includes('cake')) category = 'bakery';
  if (lower.includes('produce') || lower.includes('vegetable') || lower.includes('fruit')) category = 'produce';
  if (lower.includes('milk') || lower.includes('curd') || lower.includes('paneer') && lower.includes('dairy')) category = 'dairy';
  if (lower.includes('packaged') || lower.includes('sealed') || lower.includes('canned')) category = 'packaged';

  // Guess item name (first part before comma or numbers)
  const parts = text.split(/[,.]|\bready\b|\bgood\b|\bfor\b/i);
  const firstPart = parts[0].replace(/\d+\s*kg/i, '').trim();
  const item = firstPart.slice(0, 60).trim() || 'Surplus Food';

  return {
    item,
    category,
    qty_kg: kgMatch ? parseFloat(kgMatch[1]) : null,
    safe_hours: hoursMatch ? parseFloat(hoursMatch[1]) : (CATEGORIES.find(c => c.id === category)?.maxHours ?? 4),
    dietary_tags: isNonVeg ? ['non_veg'] : ['veg'],
    ready_at: readyAt?.toISOString() ?? new Date().toISOString(),
    confidence: (kgMatch ? 0.4 : 0) + (hoursMatch ? 0.2 : 0) + 0.4,
    needs_cold_chain: false,
  };
}

import { useVerification } from '../../hooks/useVerification';

export default function PostDonation() {
  const navigate = useNavigate();
  const location = useLocation();
  const { createDonation, showToast, user, donors } = useApp();
  const repeatDonation = location.state?.repeat;

  const currentDonor = donors?.find(d => Number(d.id) === Number(user?.id ?? 1));
  const { verCase, state: verState, canDonate, submit: submitVerification } = useVerification(user?.id ? `user-${user.id}` : 'user-1', 'donor');

  const isVerified = (verState === 'verified' || canDonate) || (currentDonor?.verified === true && currentDonor?.verification_status !== 'pending_review' && currentDonor?.verification_status !== 'needs_changes');

  const [step, setStep] = useState('parse'); // parse | confirm | matching
  const [aiText, setAiText] = useState(repeatDonation?.description ?? '');
  const [parsed, setParsed] = useState(null);
  const [showUnverifiedModal, setShowUnverifiedModal] = useState(false);
  const [form, setForm] = useState({
    item: '', category: 'cooked', qty_kg: '', est_meals: '',
    dietary_tags: ['veg'], safe_hours: 4, ready_at: '',
    needs_cold_chain: false, packaging: '', hygiene_done: false,
    fssai_no: 'FSSAI2023001', declaration: false,
    contains_nuts: false,
  });
  const [parsing, setParsing] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [matching, setMatching] = useState(false);
  const [matchResult, setMatchResult] = useState(null);

  // If repeat, pre-fill
  useEffect(() => {
    if (repeatDonation) {
      setForm(prev => ({
        ...prev,
        item: repeatDonation.description,
        category: repeatDonation.category,
        qty_kg: repeatDonation.qty_kg,
        dietary_tags: repeatDonation.dietary_tags,
      }));
      handleParse(repeatDonation.description);
    }
  }, []);

  const handleParse = (text) => {
    if (!text.trim()) return;
    setParsing(true);
    setTimeout(() => {
      const result = parseText(text);
      setParsed(result);
      setForm(prev => ({
        ...prev,
        item: result.item || prev.item,
        category: result.category,
        qty_kg: result.qty_kg ?? prev.qty_kg,
        dietary_tags: result.dietary_tags,
        safe_hours: result.safe_hours,
        ready_at: result.ready_at,
        est_meals: result.qty_kg ? Math.round(result.qty_kg * 2) : prev.est_meals,
      }));
      setParsing(false);
      setStep('confirm');
    }, 800);
  };

  const handleVoice = () => {
    if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
      showToast('Voice not available in this browser', 'warning');
      return;
    }
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    const rec = new SR();
    rec.lang = 'en-IN';
    rec.onresult = (e) => {
      const transcript = e.results[0][0].transcript;
      setAiText(transcript);
      setIsListening(false);
    };
    rec.onerror = () => setIsListening(false);
    rec.onend = () => setIsListening(false);
    setIsListening(true);
    rec.start();
  };

  const handleSubmit = async () => {
    if (!form.declaration) { showToast('Please accept the food safety declaration', 'warning'); return; }
    if (!form.est_meals || parseInt(form.est_meals) <= 0) { showToast('Please enter how many people this can feed', 'warning'); return; }

    if (!isVerified) {
      setShowUnverifiedModal(true);
      showToast('District Desk verification required to broadcast food donations', 'warning');
      return;
    }

    setMatching(true);
    const donation = createDonation({
      description: form.item,
      category: form.category,
      qty_kg: parseFloat(form.qty_kg),
      est_meals: parseInt(form.est_meals) || Math.round(parseFloat(form.qty_kg) * 2),
      dietary_tags: form.dietary_tags,
      safe_hours: form.safe_hours,
      ready_at: form.ready_at || new Date().toISOString(),
      needs_cold_chain: form.needs_cold_chain,
      packaging: form.packaging,
      hygiene_checklist_done: form.hygiene_done,
      photo_url: null,
    });

    // Navigate to match result
    setTimeout(() => {
      navigate(`/donor/match/${donation.id}`);
    }, 1200);
  };

  const handleInstantApproveDemo = async () => {
    await submitVerification(true);
    showToast('Simulation: Verified by District Operations Desk! Publishing donation...', 'verified');
    setShowUnverifiedModal(false);
    setTimeout(() => {
      setMatching(true);
      const donation = createDonation({
        description: form.item,
        category: form.category,
        qty_kg: parseFloat(form.qty_kg),
        est_meals: parseInt(form.est_meals) || Math.round(parseFloat(form.qty_kg) * 2),
        dietary_tags: form.dietary_tags,
        safe_hours: form.safe_hours,
        ready_at: form.ready_at || new Date().toISOString(),
        needs_cold_chain: form.needs_cold_chain,
        packaging: form.packaging,
        hygiene_checklist_done: form.hygiene_done,
        photo_url: null,
      });
      setTimeout(() => {
        navigate(`/donor/match/${donation.id}`);
      }, 1000);
    }, 400);
  };

  const expiryBadgeColor = () => {
    const h = parseFloat(form.safe_hours);
    if (h > 2) return { bg: 'rgba(0,110,22,0.1)', color: 'var(--tertiary)', label: 'Safe window', icon: 'check_circle' };
    if (h > 1) return { bg: 'rgba(245,166,35,0.12)', color: '#c88000', label: 'Short window', icon: 'warning' };
    return { bg: 'rgba(226,55,68,0.1)', color: 'var(--urgent)', label: 'Very short!', icon: 'error' };
  };

  const badge = expiryBadgeColor();

  if (matching) {
    return (
      <div style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'var(--surface)', gap: 24 }}>
        {/* Radar animation */}
        <div style={{ position: 'relative', width: 120, height: 120, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {[1,2,3].map(i => (
            <div key={i} style={{
              position: 'absolute', borderRadius: '50%',
              border: '2px solid var(--primary-container)',
              width: 40 + i * 30, height: 40 + i * 30,
              opacity: 0,
              animation: `radar-pulse 2s ease-out ${i * 0.6}s infinite`,
            }} />
          ))}
          <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'linear-gradient(135deg, var(--primary-container), #ff9a3d)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: 'var(--shadow-primary-lg)', zIndex: 1 }}>
            <span className="material-symbols-outlined" style={{ fontSize: 28, color: 'white', fontVariationSettings: "'FILL' 1" }}>radar</span>
          </div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <h2 className="text-headline-md" style={{ margin: '0 0 4px' }}>Finding Best Match…</h2>
          <p className="text-body-sm" style={{ color: 'var(--on-surface-variant)' }}>Running priority algorithm across {8} verified shelters</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {[1,2,3].map(i => (
            <div key={i} style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--primary-container)', animation: `pulse 1.2s ${i * 0.2}s ease-in-out infinite` }} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100dvh', background: 'var(--surface)', display: 'flex', flexDirection: 'column' }}>
      <TopBar title="Post Surplus" showBack />

      <main style={{ flex: 1, paddingTop: 64, paddingBottom: 32, overflowY: 'auto' }}>
        {/* Expiry risk bar */}
        <div style={{ margin: '12px 16px', padding: '8px 12px', borderRadius: 14, background: badge.bg, display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ position: 'relative', display: 'flex', width: 12, height: 12 }}>
              <span style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: badge.color, opacity: 0.7, animation: 'ping 1s cubic-bezier(0,0,0.2,1) infinite' }} />
              <span style={{ width: 12, height: 12, borderRadius: '50%', background: badge.color }} />
            </span>
            <span className="text-label-md" style={{ color: badge.color, fontWeight: 700 }}>
              {badge.label} • Safe for {form.safe_hours}h
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: badge.color, fontWeight: 700 }}>
            <span className="material-symbols-outlined" style={{ fontSize: 14 }}>timelapse</span>
            <span>{String(Math.floor(form.safe_hours)).padStart(2,'0')}:00:00</span>
          </div>
        </div>

        {/* Verification Status & Compliance Gate Banner */}
        {!isVerified && (
          <div style={{ margin: '0 16px 14px' }}>
            {verState === 'needs_changes' ? (
              <div style={{
                background: 'rgba(245,166,35,0.08)', border: '1.5px solid rgba(245,166,35,0.4)',
                borderRadius: 16, padding: '14px 16px', display: 'flex', gap: 12
              }}>
                <span className="material-symbols-outlined" style={{ color: '#c88000', fontSize: 24, flexShrink: 0, marginTop: 2 }}>warning</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 800, fontSize: 13, color: '#c88000', textTransform: 'uppercase' }}>
                    Verification Changes Requested by District Desk
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--on-surface-variant)', marginTop: 4, lineHeight: 1.4 }}>
                    {verCase?.decision_reason || 'Please update your FSSAI certificate or kitchen hygiene details to unlock donation privileges.'}
                  </div>
                  <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                    <button
                      className="btn-primary"
                      style={{ height: 32, fontSize: 12, padding: '0 12px' }}
                      onClick={() => navigate('/verification')}
                    >
                      Update Dossier →
                    </button>
                    <button
                      className="btn-outline"
                      style={{ height: 32, fontSize: 12, padding: '0 10px' }}
                      onClick={handleInstantApproveDemo}
                    >
                      Instant Approve (Demo)
                    </button>
                  </div>
                </div>
              </div>
            ) : (verState === 'submitted' || verState === 'under_review') ? (
              <div style={{
                background: 'linear-gradient(135deg, rgba(2,132,199,0.08), rgba(59,130,246,0.04))',
                border: '1.5px solid rgba(2,132,199,0.3)', borderRadius: 16, padding: '14px 16px', display: 'flex', gap: 12
              }}>
                <span className="material-symbols-outlined" style={{ color: '#0284c7', fontSize: 24, flexShrink: 0, marginTop: 2, animation: 'pulse 1.5s infinite' }}>hourglass_top</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 800, fontSize: 13, color: '#0284c7', textTransform: 'uppercase' }}>
                    Dossier Under Review at District Verification Desk
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--on-surface-variant)', marginTop: 4, lineHeight: 1.4 }}>
                    Your FSSAI credentials have been submitted for admin compliance verification (turnaround SLA &lt; 4h). Food donations will be broadcasted once approved.
                  </div>
                  <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                    <button
                      className="btn-outline"
                      style={{ height: 32, fontSize: 12, padding: '0 10px', borderColor: '#0284c7', color: '#0284c7' }}
                      onClick={() => navigate('/verification')}
                    >
                      Track Dossier Status →
                    </button>
                    <button
                      className="btn-primary"
                      style={{ height: 32, fontSize: 12, padding: '0 12px' }}
                      onClick={handleInstantApproveDemo}
                    >
                      Approve as Admin (Demo)
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div style={{
                background: 'rgba(226,55,68,0.08)', border: '1.5px solid rgba(226,55,68,0.3)',
                borderRadius: 16, padding: '14px 16px', display: 'flex', gap: 12
              }}>
                <span className="material-symbols-outlined" style={{ color: 'var(--urgent)', fontSize: 24, flexShrink: 0, marginTop: 2 }}>verified_user</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 800, fontSize: 13, color: 'var(--urgent)', textTransform: 'uppercase' }}>
                    Legal Verification Required to Post Food
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--on-surface-variant)', marginTop: 4, lineHeight: 1.4 }}>
                    Under FSSAI guidelines, food businesses must complete District Desk verification before broadcasting surplus food to shelters.
                  </div>
                  <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                    <button
                      className="btn-primary"
                      style={{ height: 32, fontSize: 12, padding: '0 12px' }}
                      onClick={() => navigate('/verification')}
                    >
                      Submit Verification Dossier →
                    </button>
                    <button
                      className="btn-outline"
                      style={{ height: 32, fontSize: 12, padding: '0 10px' }}
                      onClick={handleInstantApproveDemo}
                    >
                      Instant Approve (Demo)
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        <div style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* AI Parser */}
          {step === 'parse' && (
            <div className="card animate-fade-in-up" style={{ padding: 0 }}>
              <div style={{ padding: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span className="text-label-sm" style={{ color: 'var(--primary-dark)', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'flex', alignItems: 'center', gap: 4 }}>
                    <span className="material-symbols-outlined" style={{ fontSize: 14, fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
                    Smart Food Parser
                  </span>
                  <span style={{ padding: '2px 8px', borderRadius: 999, background: 'var(--surface-container)', fontSize: 10, color: 'var(--on-surface-variant)', fontWeight: 600 }}>Natural Speech</span>
                </div>

                <textarea
                  placeholder={PARSE_EXAMPLES[0]}
                  value={aiText}
                  onChange={e => setAiText(e.target.value)}
                  rows={3}
                  style={{ width: '100%', border: 'none', background: 'transparent', outline: 'none', resize: 'none', fontSize: 14, fontFamily: 'var(--font-family)', color: 'var(--on-surface)', lineHeight: 1.5 }}
                  aria-label="Describe your surplus food"
                />

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 8, borderTop: '1px solid var(--outline-variant)' }}>
                  <button
                    onClick={handleVoice}
                    style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 12px', borderRadius: 999, background: 'var(--surface-container-lowest)', border: 'none', cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}
                    aria-label="Voice input"
                  >
                    <span style={{ position: 'relative', width: 14, height: 14, display: 'flex' }}>
                      {isListening && <span style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: 'var(--primary-container)', opacity: 0.5, animation: 'ping 1s cubic-bezier(0,0,0.2,1) infinite' }} />}
                      <span className="material-symbols-outlined" style={{ fontSize: 16, color: 'var(--primary-dark)' }}>mic</span>
                    </span>
                    <span className="text-label-md" style={{ color: 'var(--primary-dark)', fontWeight: 600 }}>{isListening ? 'Listening…' : 'Tap to Speak'}</span>
                    {/* Sound wave */}
                    <span style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      {[8, 14, 6, 12, 8].map((h, i) => (
                        <span key={i} style={{ width: 2, height: h, background: 'var(--primary-dark)', borderRadius: 2, animation: isListening ? `pulse ${0.8 + i * 0.1}s ease-in-out infinite` : 'none' }} />
                      ))}
                    </span>
                  </button>
                  <button
                    onClick={() => handleParse(aiText)}
                    disabled={!aiText.trim() || parsing}
                    style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '6px 14px', borderRadius: 999, background: 'var(--primary-dark)', color: 'white', border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 700, opacity: !aiText.trim() ? 0.5 : 1 }}
                  >
                    {parsing ? <span className="animate-spin material-symbols-outlined" style={{ fontSize: 14 }}>progress_activity</span> : <span className="material-symbols-outlined" style={{ fontSize: 14 }}>bolt</span>}
                    <span>{parsing ? 'Parsing…' : 'Parse'}</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Hint chips */}
          {step === 'parse' && !aiText && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <span className="text-label-md" style={{ color: 'var(--on-surface-variant)' }}>Try an example:</span>
              {PARSE_EXAMPLES.map(ex => (
                <button key={ex} onClick={() => setAiText(ex)} style={{
                  padding: '8px 12px', borderRadius: 12, background: 'var(--surface-container-lowest)',
                  border: '1px solid var(--outline-variant)', cursor: 'pointer', textAlign: 'left',
                  fontSize: 12, color: 'var(--on-surface)', fontFamily: 'var(--font-family)',
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                }}>
                  <span>"{ex}"</span>
                  <span className="material-symbols-outlined" style={{ fontSize: 14, color: 'var(--primary-dark)' }}>arrow_forward</span>
                </button>
              ))}
            </div>
          )}

          {/* Confirm form */}
          {(step === 'confirm' || step === 'parse') && (
            <div className="card animate-fade-in-up" style={{ padding: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <span className="material-symbols-outlined" style={{ fontSize: 20, color: 'var(--primary-dark)', fontVariationSettings: "'FILL' 1" }}>magic_button</span>
                <span className="text-headline-sm">
                  {parsed ? 'Parsed for you — confirm details' : 'Enter details'}
                </span>
                {parsed && (
                  <span style={{ padding: '1px 8px', borderRadius: 999, background: 'rgba(0,110,22,0.1)', color: 'var(--tertiary)', fontSize: 10, fontWeight: 700 }}>
                    {Math.round(parsed.confidence * 100)}% confidence
                  </span>
                )}
              </div>

              <FormField label="Food Item / Description" required>
                <input
                  type="text"
                  value={form.item}
                  onChange={e => setForm(prev => ({ ...prev, item: e.target.value }))}
                  placeholder="Veg Biryani, Dal Makhani, Assorted Buns…"
                  style={inputStyle}
                />
              </FormField>

              {/* Category */}
              <FormField label="Category">
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {CATEGORIES.map(c => (
                    <button
                      key={c.id}
                      onClick={() => setForm(prev => ({ ...prev, category: c.id, safe_hours: c.maxHours }))}
                      style={{
                        padding: '5px 10px', borderRadius: 999, border: 'none', cursor: 'pointer', fontSize: 11, fontWeight: 600,
                        background: form.category === c.id ? 'var(--primary-dark)' : 'var(--surface-container)',
                        color: form.category === c.id ? 'white' : 'var(--on-surface)',
                        display: 'flex', alignItems: 'center', gap: 4, transition: 'all 160ms',
                      }}
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: 13, fontVariationSettings: "'FILL' 1" }}>{c.icon}</span>
                      {c.label}
                    </button>
                  ))}
                </div>
              </FormField>

              {/* People to Feed & Quantity */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <FormField label="People to Feed" required>
                  <input
                    type="number" min="1" step="1"
                    value={form.est_meals}
                    onChange={e => setForm(prev => ({
                      ...prev,
                      est_meals: e.target.value,
                      qty_kg: (parseFloat(e.target.value || 0) / 2).toFixed(1),
                    }))}
                    placeholder="e.g. 50"
                    style={inputStyle}
                  />
                </FormField>
                <FormField label="Weight (kg) — auto">
                  <input
                    type="number" min="0.5" step="0.5"
                    value={form.qty_kg}
                    onChange={e => setForm(prev => ({
                      ...prev,
                      qty_kg: e.target.value,
                      est_meals: Math.round(parseFloat(e.target.value || 0) * 2),
                    }))}
                    placeholder="auto"
                    style={{ ...inputStyle, color: 'var(--on-surface-variant)' }}
                  />
                </FormField>
              </div>

              {/* Dietary */}
              <FormField label="Dietary Type">
                <div style={{ display: 'flex', gap: 8 }}>
                  {DIETARY_OPTIONS.map(d => (
                    <button
                      key={d.id}
                      onClick={() => setForm(prev => ({
                        ...prev,
                        dietary_tags: prev.dietary_tags.includes(d.id)
                          ? prev.dietary_tags.filter(t => t !== d.id)
                          : [d.id]
                      }))}
                      style={{
                        padding: '6px 12px', borderRadius: 999, border: 'none', cursor: 'pointer',
                        display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 600,
                        background: form.dietary_tags.includes(d.id) ? (d.id === 'veg' ? 'rgba(0,110,22,0.1)' : d.id === 'non_veg' ? 'rgba(183,18,42,0.1)' : 'rgba(245,166,35,0.12)') : 'var(--surface-container)',
                        color: form.dietary_tags.includes(d.id) ? d.color : 'var(--on-surface-variant)',
                        outline: form.dietary_tags.includes(d.id) ? `1.5px solid ${d.color}` : 'none',
                        transition: 'all 160ms',
                      }}
                    >
                      <span style={{ fontSize: 12 }}>{d.icon}</span>
                      {d.label}
                    </button>
                  ))}
                </div>
              </FormField>

              {/* Safe-for slider */}
              <FormField label={`Safe For: ${form.safe_hours}h (max: ${CATEGORIES.find(c => c.id === form.category)?.maxHours ?? 4}h for ${form.category})`}>
                <input
                  type="range" min="0.5" max={CATEGORIES.find(c => c.id === form.category)?.maxHours ?? 4} step="0.5"
                  value={form.safe_hours}
                  onChange={e => setForm(prev => ({ ...prev, safe_hours: parseFloat(e.target.value) }))}
                  style={{ width: '100%', accentColor: 'var(--primary-container)', cursor: 'pointer' }}
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--on-surface-variant)' }}>
                  <span>0.5h</span>
                  <span>Max safe window</span>
                </div>
              </FormField>

              {/* Checkboxes */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <CheckRow label="Needs cold chain / refrigeration" checked={form.needs_cold_chain} onChange={v => setForm(prev => ({ ...prev, needs_cold_chain: v }))} />
                <CheckRow label="Contains nuts or major allergens" checked={form.contains_nuts} onChange={v => setForm(prev => ({ ...prev, contains_nuts: v }))} />
                <CheckRow label="✓ Hygiene checklist complete — food prepared in clean conditions" checked={form.hygiene_done} onChange={v => setForm(prev => ({ ...prev, hygiene_done: v }))} />
                <CheckRow
                  label="I declare this food is safe for consumption and prepared within the last 4 hours."
                  checked={form.declaration}
                  onChange={v => setForm(prev => ({ ...prev, declaration: v }))}
                  required
                />
              </div>

              {/* FSSAI */}
              <FormField label="FSSAI License No.">
                <input
                  type="text" value={form.fssai_no}
                  onChange={e => setForm(prev => ({ ...prev, fssai_no: e.target.value }))}
                  placeholder="FSSAI2023XXXXXXXX"
                  style={inputStyle}
                />
              </FormField>

              {/* Submit */}
              <button
                className="btn-primary"
                style={{ width: '100%', marginTop: 4 }}
                onClick={handleSubmit}
                disabled={!form.item || !form.est_meals || !form.declaration}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 20, fontVariationSettings: "'FILL' 1" }}>volunteer_activism</span>
                Find a Match
              </button>

              {parseInt(form.est_meals) > 0 && (
                <div style={{ textAlign: 'center', marginTop: 8 }}>
                  <span className="text-label-md" style={{ color: 'var(--tertiary)' }}>
                    👥 Feeds ~{parseInt(form.est_meals) || 0} people · 🌱 ~{Math.round((parseFloat(form.qty_kg) || 0) * 2.5)} kg CO₂e saved
                  </span>
                </div>
              )}
            </div>
          )}
        </div>
        {/* Unverified Gating Modal */}
        {showUnverifiedModal && (
          <div style={{
            position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(15,23,42,0.65)',
            backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16
          }}>
            <div className="card animate-fade-in-up" style={{
              maxWidth: 440, width: '100%', padding: 24, borderRadius: 24,
              boxShadow: '0 20px 50px rgba(0,0,0,0.3)', background: 'white'
            }}>
              <div style={{
                width: 56, height: 56, borderRadius: '50%', background: 'rgba(226,55,68,0.1)',
                color: 'var(--urgent)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px'
              }}>
                <span className="material-symbols-outlined" style={{ fontSize: 32 }}>verified_user</span>
              </div>

              <h3 className="text-headline-sm" style={{ textAlign: 'center', margin: '0 0 8px' }}>
                District Verification Required
              </h3>

              <p className="text-body-sm" style={{ color: 'var(--on-surface-variant)', textAlign: 'center', margin: '0 0 20px', lineHeight: 1.5 }}>
                Under FSSAI guidelines & surplus safety protocols, your kitchen's registration and hygiene credentials must be verified by the District Operations Desk before food donations can be broadcasted to shelters.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <button
                  className="btn-primary"
                  style={{ width: '100%', height: 48 }}
                  onClick={() => navigate('/verification')}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 18 }}>assignment</span>
                  Open Verification Portal
                </button>

                <button
                  className="btn-outline"
                  style={{ width: '100%', height: 44 }}
                  onClick={handleInstantApproveDemo}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 18 }}>verified</span>
                  Instant Admin Approval (Demo Override)
                </button>

                <button
                  style={{ border: 'none', background: 'none', color: 'var(--on-surface-variant)', fontSize: 13, fontWeight: 600, padding: 8, cursor: 'pointer' }}
                  onClick={() => setShowUnverifiedModal(false)}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

function FormField({ label, children, required }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <label className="text-label-md" style={{ display: 'block', marginBottom: 6, color: 'var(--on-surface)', fontWeight: 600 }}>
        {label}
        {required && <span style={{ color: 'var(--urgent)', marginLeft: 3 }}>*</span>}
      </label>
      {children}
    </div>
  );
}

function CheckRow({ label, checked, onChange, required }) {
  return (
    <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, cursor: 'pointer', userSelect: 'none' }}>
      <div
        role="checkbox"
        aria-checked={checked}
        tabIndex={0}
        onClick={() => onChange(!checked)}
        onKeyDown={e => e.key === 'Enter' && onChange(!checked)}
        style={{
          width: 20, height: 20, borderRadius: 6, flexShrink: 0, marginTop: 1,
          background: checked ? 'var(--primary-container)' : 'var(--surface-container)',
          border: checked ? 'none' : '1.5px solid var(--outline)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer', transition: 'all 160ms',
        }}
      >
        {checked && <span className="material-symbols-outlined" style={{ fontSize: 13, color: 'white', fontVariationSettings: "'FILL' 1" }}>check</span>}
      </div>
      <span className="text-body-sm" style={{ color: 'var(--on-surface)', lineHeight: 1.5 }}>
        {label}
        {required && <span style={{ color: 'var(--urgent)', marginLeft: 3 }}>*</span>}
      </span>
    </label>
  );
}

const inputStyle = {
  width: '100%', padding: '10px 12px', borderRadius: 12,
  background: 'var(--surface-container-low)', border: 'none',
  outline: 'none', fontSize: 14, fontFamily: 'var(--font-family)',
  color: 'var(--on-surface)', transition: 'box-shadow 200ms',
  boxSizing: 'border-box',
};
