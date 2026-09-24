import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { BottomNav } from '../../components/Navigation';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';

const CHART_COLORS = ['#fc8019', '#006e16', '#b7122a', '#2F80ED'];

export default function ImpactDashboard() {
  const navigate = useNavigate();
  const { impactStats, user } = useApp();
  const [range, setRange] = useState('30d');

  const dailyData = impactStats.daily_meals.map((v, i) => ({
    day: i + 1,
    meals: v,
    kg: Math.round(v / 2),
  }));

  const tierData = impactStats.by_tier.map(t => ({
    name: t.tier.split(' ')[0] + ' ' + t.tier.split(' ')[1],
    value: t.meals,
    pct: t.pct,
  }));

  const CO2_FACTOR = 2.5;
  const MEAL_FACTOR = 2; // 1 meal = 0.5 kg ≈ 2 meals per kg

  const STATS = [
    { label: 'Meals Rescued', value: impactStats.meals_rescued.toLocaleString('en-IN'), icon: 'restaurant', color: 'var(--primary-dark)', trend: '+18.4%', sparkline: [60, 72, 65, 80, 88] },
    { label: 'kg Diverted', value: impactStats.kg_diverted.toLocaleString('en-IN'), icon: 'scale', color: 'var(--tertiary)', trend: '+14.2%', sparkline: [50, 60, 55, 70, 78] },
    { label: 'CO₂e Avoided', value: impactStats.co2e_avoided.toLocaleString('en-IN') + ' kg', icon: 'eco', color: '#2F80ED', trend: '+14.2%', sparkline: [45, 58, 52, 65, 74] },
    { label: 'Children Fed', value: impactStats.children_fed.toLocaleString('en-IN'), icon: 'child_care', color: 'var(--secondary)', trend: '+22%', sparkline: [40, 55, 48, 62, 72] },
  ];

  return (
    <div style={{ minHeight: '100dvh', background: 'var(--background)', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <header style={{ position: 'sticky', top: 0, zIndex: 50, background: 'rgba(251,248,255,0.9)', backdropFilter: 'blur(16px)', borderBottom: '1px solid var(--outline-variant)', padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 className="text-headline-sm" style={{ margin: 0 }}>Impact & ESG</h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--tertiary)', animation: 'pulse 2s ease-in-out infinite', display: 'block' }} />
            <span className="text-label-sm" style={{ color: 'var(--tertiary)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Live Telemetry</span>
          </div>
        </div>
        <button style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 12, background: 'var(--primary-dark)', color: 'white', border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 700 }}
          onClick={() => alert('Report export simulated')}>
          <span className="material-symbols-outlined" style={{ fontSize: 15 }}>download</span>
          Export PDF
        </button>
      </header>

      <main style={{ flex: 1, paddingBottom: 96, overflowY: 'auto' }}>
        {/* Range filter */}
        <div style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 4, background: 'var(--surface-container-low)', margin: '12px 16px', borderRadius: 14 }}>
          {[['7d', 'Last 7 Days'], ['30d', 'Last 30 Days'], ['ytd', 'Year to Date']].map(([v, l]) => (
            <button key={v} onClick={() => setRange(v)} style={{
              flex: 1, padding: '6px 0', borderRadius: 10, border: 'none', cursor: 'pointer', fontSize: 11, fontWeight: 600,
              background: range === v ? 'var(--surface-container-lowest)' : 'transparent',
              color: range === v ? 'var(--primary-dark)' : 'var(--on-surface-variant)',
              boxShadow: range === v ? 'var(--shadow-card)' : 'none',
              transition: 'all 160ms',
            }}>{l}</button>
          ))}
        </div>

        {/* KPI tiles */}
        <div style={{ padding: '0 16px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
          {STATS.map((s, i) => (
            <div key={s.label} className={`card animate-fade-in-up delay-${i}`} style={{ padding: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                <span className="text-label-sm" style={{ color: 'var(--on-surface-variant)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{s.label}</span>
                <span style={{ padding: '1px 6px', borderRadius: 999, background: 'rgba(0,110,22,0.1)', color: 'var(--tertiary)', fontSize: 9, fontWeight: 700 }}>↑ {s.trend}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 6 }}>
                <span className="material-symbols-outlined" style={{ fontSize: 18, color: s.color, fontVariationSettings: "'FILL' 1" }}>{s.icon}</span>
                <span style={{ fontSize: 22, fontWeight: 700, color: 'var(--on-surface)', fontFamily: 'var(--font-family)', letterSpacing: '-0.02em', tabularNums: true }}>{s.value}</span>
              </div>
              {/* Mini sparkline */}
              <svg width="100%" height={24} viewBox={`0 0 80 24`}>
                <polyline
                  points={s.sparkline.map((v, i) => `${i * 20},${24 - v * 0.25}`).join(' ')}
                  fill="none"
                  stroke={s.color}
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
          ))}
        </div>

        {/* Area chart */}
        <div className="card" style={{ margin: '0 16px 16px', padding: 16 }}>
          <h3 className="text-headline-sm" style={{ margin: '0 0 4px' }}>Daily Meals Rescued</h3>
          <p className="text-body-sm" style={{ color: 'var(--on-surface-variant)', margin: '0 0 12px' }}>30-day trend (1 meal ≈ 0.5 kg)</p>
          <ResponsiveContainer width="100%" height={160}>
            <AreaChart data={dailyData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="mealGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#fc8019" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#fc8019" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--outline-variant)" />
              <XAxis dataKey="day" tick={{ fontSize: 9, fill: 'var(--on-surface-variant)' }} />
              <YAxis tick={{ fontSize: 9, fill: 'var(--on-surface-variant)' }} />
              <Tooltip
                contentStyle={{ background: 'var(--surface-container-lowest)', border: 'none', borderRadius: 12, boxShadow: 'var(--shadow-elevated)', fontSize: 12 }}
                labelStyle={{ color: 'var(--on-surface)', fontWeight: 700 }}
              />
              <Area type="monotone" dataKey="meals" stroke="#fc8019" strokeWidth={2} fill="url(#mealGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* By tier donut */}
        <div className="card" style={{ margin: '0 16px 16px', padding: 16 }}>
          <h3 className="text-headline-sm" style={{ margin: '0 0 12px' }}>Meals by Priority Tier</h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <PieChart width={120} height={120}>
              <Pie data={tierData} cx={55} cy={55} innerRadius={30} outerRadius={55} dataKey="value" paddingAngle={2}>
                {tierData.map((_, i) => <Cell key={i} fill={CHART_COLORS[i]} />)}
              </Pie>
            </PieChart>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
              {tierData.map((t, i) => (
                <div key={t.name} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ width: 10, height: 10, borderRadius: 2, background: CHART_COLORS[i], flexShrink: 0 }} />
                  <span className="text-body-sm" style={{ flex: 1, color: 'var(--on-surface-variant)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.name}</span>
                  <span className="text-label-md" style={{ color: 'var(--on-surface)', fontWeight: 700 }}>{t.pct}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Top donors leaderboard */}
        <div className="card" style={{ margin: '0 16px 16px', padding: 16 }}>
          <h3 className="text-headline-sm" style={{ margin: '0 0 12px' }}>Top Donors 🏆</h3>
          {impactStats.top_donors.map((d, i) => (
            <div key={d.name} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: i < impactStats.top_donors.length - 1 ? '1px solid var(--outline-variant)' : 'none' }}>
              <span style={{
                width: 28, height: 28, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, flexShrink: 0,
                background: i === 0 ? '#FFD700' : i === 1 ? '#C0C0C0' : i === 2 ? '#CD7F32' : 'var(--surface-container)',
                color: i < 3 ? '#1a1a1a' : 'var(--on-surface-variant)',
              }}>#{i + 1}</span>
              <span className="text-label-md" style={{ flex: 1, color: 'var(--on-surface)', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{d.name}</span>
              <div style={{ textAlign: 'right' }}>
                <span className="text-label-md" style={{ color: 'var(--primary-dark)', fontWeight: 700, display: 'block' }}>{d.meals.toLocaleString('en-IN')} meals</span>
                <span className="text-body-sm" style={{ color: 'var(--on-surface-variant)' }}>{d.kg} kg</span>
              </div>
            </div>
          ))}
        </div>

        {/* Assumptions footer */}
        <div style={{ margin: '0 16px 16px', padding: 14, borderRadius: 16, background: 'var(--surface-container-low)', fontSize: 11, color: 'var(--on-surface-variant)', lineHeight: 1.7 }}>
          <strong style={{ color: 'var(--on-surface)' }}>Assumptions & Methodology:</strong><br />
          • 1 meal = 0.5 kg food served<br />
          • CO₂e factor = 2.5 kg CO₂e per kg food waste avoided (WRAP 2021 estimate)<br />
          • Meals = kg × 2 (estimate; actual servings may vary)<br />
          • Receipts are documentation, not tax advice. Deductibility depends on Indian tax rules.<br />
          <em>Verify CO₂e factor with latest FSSAI or WRAP India guidance before pitching.</em>
        </div>
      </main>

      <BottomNav />
    </div>
  );
}
