import { useApp } from '../../context/AppContext';
import { TopBar, BottomNav } from '../../components/Navigation';
import { useNavigate } from 'react-router-dom';
import { DONATIONS } from '../../data/seed';

export default function ReceiptsPage() {
  const { donations } = useApp();
  const navigate = useNavigate();

  const delivered = donations.filter(d => d.status === 'delivered');

  // Receipt for each delivered donation
  const receipts = delivered.map(d => ({
    id: d.id,
    donation: d,
    receipt_no: `STL-KT-2026-${String(d.id).padStart(4,'0')}`,
    issued_at: d.created_at,
    donor_name: d.donor_name,
    recipient_name: 'Asha Nilayam Old Age Home',
    meals: d.est_meals,
    kg: d.qty_kg,
    co2e: Math.round(d.qty_kg * 2.5),
    fssai_no: 'FSSAI2023001',
  }));

  return (
    <div style={{ minHeight: '100dvh', background: 'var(--surface)', display: 'flex', flexDirection: 'column' }}>
      <TopBar title="Donor Receipts" showBack />
      <main style={{ flex: 1, paddingTop: 64, paddingBottom: 96, overflowY: 'auto' }}>
        <div style={{ padding: '12px 16px 4px' }}>
          <p className="text-body-sm" style={{ color: 'var(--on-surface-variant)' }}>
            Official receipts for all completed rescues. Suitable for CSR documentation.
          </p>
        </div>

        <div style={{ padding: '8px 16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
          {receipts.length === 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '60px 24px', gap: 12 }}>
              <span className="material-symbols-outlined" style={{ fontSize: 48, color: 'var(--on-surface-variant)' }}>receipt_long</span>
              <p className="text-headline-sm" style={{ margin: 0 }}>No receipts yet</p>
              <p className="text-body-sm" style={{ color: 'var(--on-surface-variant)', textAlign: 'center' }}>Complete a donation delivery to generate a receipt</p>
            </div>
          )}
          {receipts.map(r => (
            <div key={r.id} className="card animate-fade-in-up" style={{ padding: 0, overflow: 'hidden' }}>
              {/* Receipt header stripe */}
              <div style={{ padding: '10px 14px', background: 'linear-gradient(135deg, rgba(252,128,25,0.08), transparent)', borderBottom: '1px solid var(--outline-variant)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span className="text-label-sm" style={{ color: 'var(--primary-dark)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    Receipt #{r.receipt_no}
                  </span>
                  <span className="text-label-sm" style={{ color: 'var(--on-surface-variant)' }}>
                    {new Date(r.issued_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </span>
                </div>
              </div>

              <div style={{ padding: '12px 14px' }}>
                <h4 className="text-headline-sm" style={{ margin: '0 0 4px' }}>{r.donation.description}</h4>
                <p className="text-body-sm" style={{ color: 'var(--on-surface-variant)', margin: '0 0 10px' }}>
                  From: <strong style={{ color: 'var(--on-surface)' }}>{r.donor_name}</strong> →{' '}
                  <strong style={{ color: 'var(--on-surface)' }}>{r.recipient_name}</strong>
                </p>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 6, marginBottom: 12 }}>
                  {[
                    { icon: 'restaurant', label: 'Meals', value: r.meals },
                    { icon: 'scale', label: 'kg Saved', value: r.kg },
                    { icon: 'eco', label: 'CO₂e kg', value: r.co2e },
                  ].map(s => (
                    <div key={s.label} style={{ padding: '8px', borderRadius: 10, background: 'var(--surface-container-low)', textAlign: 'center' }}>
                      <span className="material-symbols-outlined" style={{ fontSize: 15, color: 'var(--primary-dark)', fontVariationSettings: "'FILL' 1" }}>{s.icon}</span>
                      <div className="text-label-lg" style={{ fontWeight: 700, margin: '2px 0' }}>{s.value}</div>
                      <div className="text-label-sm" style={{ color: 'var(--on-surface-variant)' }}>{s.label}</div>
                    </div>
                  ))}
                </div>

                <p className="text-label-sm" style={{ color: 'var(--on-surface-variant)', margin: '0 0 10px' }}>
                  FSSAI: {r.fssai_no} · Receipt ID: {r.receipt_no}
                </p>

                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    onClick={() => alert(`Receipt ${r.receipt_no} download triggered`)}
                    style={{ flex: 1, height: 40, borderRadius: 10, background: 'var(--primary-dark)', color: 'white', border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: 16 }}>download</span>
                    Download PDF
                  </button>
                  <button
                    onClick={() => alert(`Sharing receipt ${r.receipt_no}`)}
                    style={{ height: 40, padding: '0 14px', borderRadius: 10, background: 'var(--surface-container)', border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: 16, color: '#25D366' }}>share</span>
                    Share
                  </button>
                </div>
              </div>
            </div>
          ))}

          {/* Yearly summary card */}
          {receipts.length > 0 && (
            <div style={{ padding: 16, borderRadius: 20, background: 'linear-gradient(135deg, var(--primary-container) 0%, #ff9a3d 100%)', color: 'white' }}>
              <h4 className="text-headline-sm" style={{ margin: '0 0 8px' }}>2026 Yearly Summary</h4>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
                {[
                  { label: 'Total Meals', value: receipts.reduce((a, r) => a + r.meals, 0) },
                  { label: 'kg Saved', value: receipts.reduce((a, r) => a + r.kg, 0) },
                  { label: 'CO₂e kg', value: receipts.reduce((a, r) => a + r.co2e, 0) },
                ].map(s => (
                  <div key={s.label} style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 20, fontWeight: 700 }}>{s.value}</div>
                    <div style={{ fontSize: 10, opacity: 0.8 }}>{s.label}</div>
                  </div>
                ))}
              </div>
              <button
                onClick={() => alert('Consolidated receipt downloaded')}
                style={{ marginTop: 12, width: '100%', height: 40, borderRadius: 10, background: 'rgba(255,255,255,0.2)', color: 'white', border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 16 }}>description</span>
                Download Consolidated Receipt
              </button>
            </div>
          )}
        </div>
      </main>
      <BottomNav />
    </div>
  );
}
