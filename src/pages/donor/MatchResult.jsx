import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { TopBar } from '../../components/Navigation';
import { TierBadge, VerifiedBadge, ScoreBars } from '../../components/Navigation';
import { CountdownBadge } from '../../components/CountdownRing';
import { matchDonation, RECIPIENTS, DRIVERS } from '../../data/seed';

export default function MatchResult() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { donations, showToast } = useApp();
  const [phase, setPhase] = useState('matching'); // matching | matched | cascading | escalated
  const [result, setResult] = useState(null);
  const [cascadeIndex, setCascadeIndex] = useState(0);
  const [showWhyModal, setShowWhyModal] = useState(false);
  const confettiRef = useRef(null);

  const donation = donations.find(d => d.id === parseInt(id));

  useEffect(() => {
    // Simulate matching
    const t1 = setTimeout(() => {
      if (!donation) { setPhase('escalated'); return; }
      const res = matchDonation(donation, Date.now());
      setResult(res);
      if (res.status === 'ok' && res.candidates.length > 0) {
        setPhase('matched');
        // Confetti
        import('canvas-confetti').then(m => {
          const confetti = m.default;
          confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 }, colors: ['#fc8019', '#ff9a3d', '#006e16', '#7cdc75'] });
        }).catch(() => {});
      } else {
        setPhase('escalated');
      }
    }, 2500);

    return () => clearTimeout(t1);
  }, [donation]);

  if (!donation) {
    return (
      <div style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
        <span className="material-symbols-outlined" style={{ fontSize: 48, color: 'var(--on-surface-variant)' }}>error_outline</span>
        <p className="text-headline-sm">Donation not found</p>
        <button className="btn-primary" onClick={() => navigate('/donor')}>Go Home</button>
      </div>
    );
  }

  const bestMatch = result?.candidates?.[0];
  const recipient = bestMatch?.recipient;
  const driver = bestMatch?.driver;

  return (
    <div style={{ minHeight: '100dvh', background: 'var(--surface)', display: 'flex', flexDirection: 'column' }}>
      <TopBar title={phase === 'matched' ? 'Match Found!' : phase === 'matching' ? 'Finding Match…' : 'Escalated'} showBack />

      <main style={{ flex: 1, paddingTop: 64, paddingBottom: 40, overflowY: 'auto' }}>
        {/* === MATCHING PHASE === */}
        {phase === 'matching' && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 24px', gap: 24 }}>
            <div style={{ position: 'relative', width: 120, height: 120, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {[1,2,3].map(i => (
                <div key={i} style={{
                  position: 'absolute', borderRadius: '50%',
                  border: `2px solid var(--primary-container)`,
                  width: 40 + i * 30, height: 40 + i * 30,
                  opacity: 0,
                  animation: `radar-pulse 2s ease-out ${i * 0.5}s infinite`,
                }} />
              ))}
              <div style={{ width: 60, height: 60, borderRadius: '50%', background: 'linear-gradient(135deg, var(--primary-container), #ff9a3d)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: 'var(--shadow-primary-lg)', zIndex: 1 }}>
                <span className="material-symbols-outlined" style={{ fontSize: 30, color: 'white', fontVariationSettings: "'FILL' 1" }}>radar</span>
              </div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <h2 className="text-headline-md" style={{ margin: '0 0 8px' }}>Matching in progress…</h2>
              <p className="text-body-sm" style={{ color: 'var(--on-surface-variant)', maxWidth: 280 }}>
                Running priority algorithm: checking {RECIPIENTS.length} verified shelters, dietary rules, distance and capacity
              </p>
            </div>

            {/* Priority waterfall visual */}
            <div style={{ width: '100%', maxWidth: 340, display: 'flex', flexDirection: 'column', gap: 6 }}>
              {['Tier 1: Child Care Homes & Old Age Homes', 'Tier 2: Govt Community Kitchens', 'Tier 3: NGOs & Night Shelters'].map((t, i) => (
                <div key={t} style={{ padding: '8px 12px', borderRadius: 12, background: 'var(--surface-container-lowest)', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', display: 'flex', alignItems: 'center', gap: 8, animation: `fadeInUp 0.4s ${i * 0.2}s both` }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: i === 0 ? 'var(--primary-container)' : 'var(--surface-container)', animation: i === 0 ? 'pulse 1s ease-in-out infinite' : 'none' }} />
                  <span className="text-label-md" style={{ color: i === 0 ? 'var(--on-surface)' : 'var(--on-surface-variant)' }}>{t}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* === MATCHED PHASE === */}
        {phase === 'matched' && recipient && (
          <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Success banner */}
            <div style={{
              borderRadius: 20, padding: 20, textAlign: 'center',
              background: 'linear-gradient(135deg, rgba(0,110,22,0.08), rgba(88,182,84,0.06))',
              border: '1px solid rgba(0,110,22,0.15)',
            }} className="animate-fade-in-up">
              <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(0,110,22,0.1)', margin: '0 auto 12px', display: 'flex', alignItems: 'center', justifyContent: 'center', animation: 'float 3s ease-in-out infinite' }}>
                <span className="material-symbols-outlined" style={{ fontSize: 36, color: 'var(--tertiary)', fontVariationSettings: "'FILL' 1" }}>check_circle</span>
              </div>
              <h2 className="text-headline-md" style={{ color: 'var(--tertiary)', margin: '0 0 4px' }}>Perfect Match Found!</h2>
              <p className="text-body-sm" style={{ color: 'var(--on-surface-variant)' }}>
                {donation.description} → {recipient.name}
              </p>
            </div>

            {/* Recipient card */}
            <div className="card animate-fade-in-up delay-1" style={{ padding: 16 }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <TierBadge tier={recipient.tier} />
                    <VerifiedBadge small />
                  </div>
                  <h3 className="text-headline-sm" style={{ margin: '0 0 2px' }}>{recipient.name}</h3>
                  <p className="text-body-sm" style={{ color: 'var(--on-surface-variant)', margin: 0 }}>
                    {recipient.address} • {bestMatch.distanceKm?.toFixed(1) ?? '?'} km away
                  </p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span className="text-headline-sm" style={{ color: 'var(--primary-dark)', fontWeight: 700, display: 'block' }}>
                    {Math.round(bestMatch.score * 100)}%
                  </span>
                  <span className="text-label-sm" style={{ color: 'var(--on-surface-variant)' }}>match score</span>
                </div>
              </div>

              {/* Stats */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 12 }}>
                {[
                  { label: 'Headcount', value: `${recipient.headcount} people` },
                  { label: 'Free Capacity', value: `${recipient.capacity_kg - recipient.capacity_used_kg} kg` },
                  { label: 'Need Tonight', value: `${recipient.need_today_kg} kg` },
                ].map(s => (
                  <div key={s.label} style={{ padding: '8px', borderRadius: 12, background: 'var(--surface-container-low)', textAlign: 'center' }}>
                    <span className="text-body-sm" style={{ color: 'var(--on-surface-variant)', display: 'block', marginBottom: 2 }}>{s.label}</span>
                    <span className="text-label-md" style={{ color: 'var(--on-surface)', fontWeight: 700 }}>{s.value}</span>
                  </div>
                ))}
              </div>

              {/* Why this match chips */}
              <div style={{ marginBottom: 12 }}>
                <span className="text-label-md" style={{ color: 'var(--on-surface-variant)', display: 'block', marginBottom: 6 }}>Why this match:</span>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {bestMatch.explanation?.map(chip => (
                    <span key={chip} style={{
                      padding: '3px 10px', borderRadius: 999,
                      background: 'rgba(152,72,0,0.08)', color: 'var(--primary-dark)',
                      fontSize: 11, fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 4,
                    }}>
                      <span className="material-symbols-outlined" style={{ fontSize: 12, fontVariationSettings: "'FILL' 1" }}>check</span>
                      {chip}
                    </span>
                  ))}
                </div>
              </div>

              <button
                onClick={() => setShowWhyModal(true)}
                style={{ background: 'none', border: 'none', color: 'var(--primary-dark)', fontSize: 12, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, padding: 0 }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 14 }}>bar_chart</span>
                View full score breakdown
              </button>
            </div>

            {/* Driver card */}
            {driver && (
              <div className="card animate-fade-in-up delay-2" style={{ padding: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'var(--primary-fixed)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <span className="material-symbols-outlined" style={{ fontSize: 24, color: 'var(--on-primary-fixed)', fontVariationSettings: "'FILL' 1" }}>two_wheeler</span>
                  </div>
                  <div style={{ flex: 1 }}>
                    <h4 className="text-label-lg" style={{ margin: '0 0 2px', fontWeight: 700 }}>{driver.name}</h4>
                    <p className="text-body-sm" style={{ color: 'var(--on-surface-variant)', margin: 0 }}>{driver.vehicle} • ⭐ {driver.rating}</p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span className="text-label-lg" style={{ color: 'var(--primary-dark)', fontWeight: 700 }}>~12 min</span>
                    <span className="text-body-sm" style={{ color: 'var(--on-surface-variant)', display: 'block' }}>ETA</span>
                  </div>
                </div>
              </div>
            )}

            {/* Actions */}
            <div style={{ display: 'flex', gap: 10 }} className="animate-fade-in-up delay-3">
              <button
                className="btn-primary"
                style={{ flex: 1 }}
                onClick={() => navigate(`/donor/track/${id}`)}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 18, fontVariationSettings: "'FILL' 1" }}>gps_fixed</span>
                Track Live
              </button>
              <button
                className="btn-secondary"
                style={{ height: 52 }}
                onClick={() => navigate('/donor')}
              >
                Done
              </button>
            </div>

            {/* Cascade history */}
            {result?.candidates?.length > 1 && (
              <div className="card animate-fade-in-up delay-4" style={{ padding: 16 }}>
                <span className="text-label-md" style={{ color: 'var(--on-surface-variant)', display: 'block', marginBottom: 8 }}>Offer cascade order:</span>
                {result.candidates.slice(0, 4).map((c, i) => (
                  <div key={c.recipient.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 0', borderBottom: i < 3 ? '1px solid var(--outline-variant)' : 'none' }}>
                    <span style={{
                      width: 22, height: 22, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700,
                      background: i === 0 ? 'var(--primary-container)' : 'var(--surface-container)',
                      color: i === 0 ? 'white' : 'var(--on-surface-variant)',
                    }}>{i + 1}</span>
                    <div style={{ flex: 1 }}>
                      <span className="text-label-md" style={{ color: 'var(--on-surface)' }}>{c.recipient.name}</span>
                      <span className="text-body-sm" style={{ color: 'var(--on-surface-variant)', marginLeft: 8 }}>{c.distanceKm?.toFixed(1)} km</span>
                    </div>
                    <TierBadge tier={c.recipient.tier} />
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* === ESCALATED PHASE === */}
        {phase === 'escalated' && (
          <div style={{ padding: '40px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20 }}>
            <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'rgba(226,55,68,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span className="material-symbols-outlined" style={{ fontSize: 36, color: 'var(--urgent)', fontVariationSettings: "'FILL' 1" }}>warning</span>
            </div>
            <div style={{ textAlign: 'center' }}>
              <h2 className="text-headline-md" style={{ margin: '0 0 8px' }}>No Match Found — Escalated</h2>
              <p className="text-body-sm" style={{ color: 'var(--on-surface-variant)', maxWidth: 300 }}>
                No verified shelters matched all filters. Expanding radius and alerting dispatcher.
              </p>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, width: '100%', maxWidth: 320 }}>
              <button className="btn-primary" onClick={() => showToast('Dispatcher notified — expanding search radius', 'radar')}>
                <span className="material-symbols-outlined" style={{ fontSize: 18 }}>radar</span>
                Expand Radius
              </button>
              <button className="btn-secondary" style={{ height: 52 }} onClick={() => showToast('Routed to compost partner', 'compost')}>
                <span className="material-symbols-outlined" style={{ fontSize: 18 }}>compost</span>
                Send to Compost Partner (Tier 4)
              </button>
              <button className="btn-secondary" style={{ height: 52 }} onClick={() => navigate('/donor')}>
                Back to Home
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Score breakdown modal */}
      {showWhyModal && bestMatch && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(22,27,45,0.5)', display: 'flex', alignItems: 'flex-end' }} onClick={() => setShowWhyModal(false)}>
          <div style={{ width: '100%', background: 'var(--surface-container-lowest)', borderRadius: '28px 28px 0 0', padding: '20px 20px 36px', maxHeight: '80vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
            <div style={{ width: 40, height: 5, borderRadius: 999, background: 'var(--surface-container)', margin: '0 auto 20px' }} />
            <h3 className="text-headline-sm" style={{ margin: '0 0 4px' }}>Why This Match?</h3>
            <p className="text-body-sm" style={{ color: 'var(--on-surface-variant)', margin: '0 0 20px' }}>
              Total score: <strong style={{ color: 'var(--primary-dark)' }}>{Math.round(bestMatch.score * 100)}%</strong>
            </p>
            <ScoreBars breakdown={bestMatch.breakdown} />
            <div style={{ marginTop: 20, padding: 12, borderRadius: 14, background: 'var(--surface-container-low)', fontSize: 11, color: 'var(--on-surface-variant)', lineHeight: 1.6 }}>
              <strong style={{ color: 'var(--on-surface)' }}>Scoring formula:</strong>
              <br />0.30 × Proximity + 0.20 × Capacity Fit + 0.20 × Priority Tier + 0.15 × Time Slack + 0.10 × Need Today + 0.05 × Fairness
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
