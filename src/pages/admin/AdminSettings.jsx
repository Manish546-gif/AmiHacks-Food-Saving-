import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { TopBar, BottomNav } from '../../components/Navigation';

export default function AdminSettings() {
  const navigate = useNavigate();
  const { showToast, resetDemoData } = useApp();

  // Algorithm Weights
  const [proximityWeight, setProximityWeight] = useState(30);
  const [priorityWeight, setPriorityWeight] = useState(20);
  const [capacityWeight, setCapacityWeight] = useState(20);
  const [timeSlackWeight, setTimeSlackWeight] = useState(15);
  const [needTodayWeight, setNeedTodayWeight] = useState(10);
  const [fairnessWeight, setFairnessWeight] = useState(5);

  // Category Safe Hours
  const [cookedHours, setCookedHours] = useState(4);
  const [dairyHours, setDairyHours] = useState(3);
  const [produceHours, setProduceHours] = useState(6);
  const [bakeryHours, setBakeryHours] = useState(8);

  // Database Keys
  const [dbUrl, setDbUrl] = useState(() => localStorage.getItem('surplus_db_url') || '');
  const [dbKey, setDbKey] = useState(() => localStorage.getItem('surplus_db_key') || '');
  const [dbType, setDbType] = useState(() => localStorage.getItem('surplus_db_type') || 'supabase');

  const handleSaveWeights = (e) => {
    e.preventDefault();
    showToast('Matching algorithm weights updated across dispatch nodes!', 'tune');
  };

  const handleSaveDb = (e) => {
    e.preventDefault();
    localStorage.setItem('surplus_db_url', dbUrl);
    localStorage.setItem('surplus_db_key', dbKey);
    localStorage.setItem('surplus_db_type', dbType);
    showToast('Database configuration credentials saved!', 'database');
  };

  return (
    <div style={{ minHeight: '100dvh', background: 'var(--surface)', display: 'flex', flexDirection: 'column' }}>
      <TopBar title="System Settings" subtitle="Surplus-to-Shelter" />

      <main style={{ flex: 1, paddingTop: 68, paddingBottom: 100, overflowY: 'auto', paddingLeft: 16, paddingRight: 16 }}>
        {/* Database Key Configuration Panel */}
        <div style={{
          background: 'linear-gradient(135deg, #161b2d, #2b2f43)',
          color: 'white', borderRadius: 20, padding: 18, margin: '12px 0 16px',
          boxShadow: 'var(--shadow-card)', border: '1px solid rgba(255,255,255,0.1)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span className="material-symbols-outlined" style={{ color: '#ffb689' }}>database</span>
              <h3 className="text-headline-sm" style={{ margin: 0, color: 'white', fontSize: 16 }}>
                Database & Cloud Sync
              </h3>
            </div>
            <span style={{
              padding: '3px 8px', borderRadius: 999,
              background: dbUrl && dbKey ? 'rgba(0,110,22,0.3)' : 'rgba(255,182,137,0.2)',
              color: dbUrl && dbKey ? '#7cdc75' : '#ffb689',
              fontSize: 10, fontWeight: 800, textTransform: 'uppercase'
            }}>
              {dbUrl && dbKey ? '🟢 Cloud DB Configured' : '⚡ Local Reactive Sync Active'}
            </span>
          </div>

          <p className="text-body-sm" style={{ color: 'rgba(255,255,255,0.8)', margin: '0 0 14px' }}>
            The app currently uses persistent zero-latency reactive state. You can plug in your <strong>Supabase</strong>, <strong>PostgreSQL / Neon</strong>, or <strong>REST API</strong> credentials below at any time!
          </p>

          <form onSubmit={handleSaveDb} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div>
              <label className="text-label-sm" style={{ color: 'rgba(255,255,255,0.7)', display: 'block', marginBottom: 4 }}>
                Database Provider
              </label>
              <select
                value={dbType}
                onChange={e => setDbType(e.target.value)}
                style={{
                  width: '100%', height: 40, borderRadius: 10, border: '1px solid rgba(255,255,255,0.2)',
                  background: 'rgba(255,255,255,0.1)', color: 'white', padding: '0 10px', fontSize: 13
                }}
              >
                <option value="supabase" style={{ color: 'black' }}>Supabase (PostgreSQL + Realtime)</option>
                <option value="neon" style={{ color: 'black' }}>Neon Serverless Postgres</option>
                <option value="custom" style={{ color: 'black' }}>Custom REST / Node API Backend</option>
              </select>
            </div>

            <div>
              <label className="text-label-sm" style={{ color: 'rgba(255,255,255,0.7)', display: 'block', marginBottom: 4 }}>
                Database URL / Host Endpoint
              </label>
              <input
                type="text"
                placeholder="e.g. https://your-project.supabase.co or postgresql://..."
                value={dbUrl}
                onChange={e => setDbUrl(e.target.value)}
                style={{
                  width: '100%', height: 40, borderRadius: 10, border: '1px solid rgba(255,255,255,0.2)',
                  background: 'rgba(255,255,255,0.1)', color: 'white', padding: '0 10px', fontSize: 13
                }}
              />
            </div>

            <div>
              <label className="text-label-sm" style={{ color: 'rgba(255,255,255,0.7)', display: 'block', marginBottom: 4 }}>
                API Key / Secret Token
              </label>
              <input
                type="password"
                placeholder="Paste API Key or JWT token"
                value={dbKey}
                onChange={e => setDbKey(e.target.value)}
                style={{
                  width: '100%', height: 40, borderRadius: 10, border: '1px solid rgba(255,255,255,0.2)',
                  background: 'rgba(255,255,255,0.1)', color: 'white', padding: '0 10px', fontSize: 13
                }}
              />
            </div>

            <button
              type="submit"
              style={{
                height: 42, borderRadius: 10, border: 'none', background: 'var(--primary)',
                color: 'white', fontWeight: 800, fontSize: 13, cursor: 'pointer', marginTop: 4,
                boxShadow: '0 4px 12px rgba(252,128,25,0.4)'
              }}
            >
              Save Database Credentials
            </button>
          </form>
        </div>

        {/* Matching Algorithm Weights */}
        <div style={{ background: 'var(--surface-container-lowest)', borderRadius: 20, padding: 18, boxShadow: 'var(--shadow-card)', marginBottom: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <h3 className="text-label-lg" style={{ margin: 0, color: 'var(--primary-dark)', textTransform: 'uppercase' }}>
              Matching Engine Weights (Sum: {proximityWeight + priorityWeight + capacityWeight + timeSlackWeight + needTodayWeight + fairnessWeight}%)
            </h3>
            <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--tertiary)' }}>Live Optimization</span>
          </div>

          <form onSubmit={handleSaveWeights} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span className="text-label-md">Proximity / Distance (30%)</span>
                <span className="text-label-md" style={{ fontWeight: 800 }}>{proximityWeight}%</span>
              </div>
              <input type="range" min={0} max={60} value={proximityWeight} onChange={e => setProximityWeight(Number(e.target.value))} style={{ width: '100%', accentColor: 'var(--primary)' }} />
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span className="text-label-md">Tier 1 Priority (Children & Elderly) (20%)</span>
                <span className="text-label-md" style={{ fontWeight: 800 }}>{priorityWeight}%</span>
              </div>
              <input type="range" min={0} max={50} value={priorityWeight} onChange={e => setPriorityWeight(Number(e.target.value))} style={{ width: '100%', accentColor: 'var(--primary)' }} />
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span className="text-label-md">Capacity Fit (20%)</span>
                <span className="text-label-md" style={{ fontWeight: 800 }}>{capacityWeight}%</span>
              </div>
              <input type="range" min={0} max={50} value={capacityWeight} onChange={e => setCapacityWeight(Number(e.target.value))} style={{ width: '100%', accentColor: 'var(--primary)' }} />
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span className="text-label-md">Time Slack to Expiry (15%)</span>
                <span className="text-label-md" style={{ fontWeight: 800 }}>{timeSlackWeight}%</span>
              </div>
              <input type="range" min={0} max={40} value={timeSlackWeight} onChange={e => setTimeSlackWeight(Number(e.target.value))} style={{ width: '100%', accentColor: 'var(--primary)' }} />
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span className="text-label-md">Fairness & Rotation (5%)</span>
                <span className="text-label-md" style={{ fontWeight: 800 }}>{fairnessWeight}%</span>
              </div>
              <input type="range" min={0} max={25} value={fairnessWeight} onChange={e => setFairnessWeight(Number(e.target.value))} style={{ width: '100%', accentColor: 'var(--primary)' }} />
            </div>

            <button type="submit" className="btn-secondary" style={{ width: '100%' }}>
              Save Tuning Configuration
            </button>
          </form>
        </div>

        {/* Food Safety Thresholds */}
        <div style={{ background: 'var(--surface-container-lowest)', borderRadius: 20, padding: 18, boxShadow: 'var(--shadow-card)', marginBottom: 16 }}>
          <h3 className="text-label-lg" style={{ margin: '0 0 12px', color: 'var(--primary-dark)', textTransform: 'uppercase' }}>
            Category Safe-Window Thresholds (Hours)
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
            <div>
              <label className="text-label-sm" style={{ color: 'var(--on-surface-variant)' }}>Cooked Food</label>
              <input
                type="number"
                value={cookedHours}
                onChange={e => setCookedHours(Number(e.target.value))}
                style={{ width: '100%', height: 40, borderRadius: 10, border: '1px solid var(--outline-variant)', padding: '0 10px', marginTop: 4, fontWeight: 700 }}
              />
            </div>
            <div>
              <label className="text-label-sm" style={{ color: 'var(--on-surface-variant)' }}>Dairy & Milk</label>
              <input
                type="number"
                value={dairyHours}
                onChange={e => setDairyHours(Number(e.target.value))}
                style={{ width: '100%', height: 40, borderRadius: 10, border: '1px solid var(--outline-variant)', padding: '0 10px', marginTop: 4, fontWeight: 700 }}
              />
            </div>
            <div>
              <label className="text-label-sm" style={{ color: 'var(--on-surface-variant)' }}>Fresh Produce</label>
              <input
                type="number"
                value={produceHours}
                onChange={e => setProduceHours(Number(e.target.value))}
                style={{ width: '100%', height: 40, borderRadius: 10, border: '1px solid var(--outline-variant)', padding: '0 10px', marginTop: 4, fontWeight: 700 }}
              />
            </div>
            <div>
              <label className="text-label-sm" style={{ color: 'var(--on-surface-variant)' }}>Bakery & Bread</label>
              <input
                type="number"
                value={bakeryHours}
                onChange={e => setBakeryHours(Number(e.target.value))}
                style={{ width: '100%', height: 40, borderRadius: 10, border: '1px solid var(--outline-variant)', padding: '0 10px', marginTop: 4, fontWeight: 700 }}
              />
            </div>
          </div>
        </div>

        {/* Clean Reset Button */}
        <div style={{ marginBottom: 20 }}>
          <button
            onClick={resetDemoData}
            style={{
              width: '100%', padding: '14px', borderRadius: 14, border: 'none',
              background: 'rgba(226,55,68,0.08)', color: 'var(--secondary)',
              fontWeight: 800, fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 20 }}>restart_alt</span>
            <span>Reset Demo Simulation State to Factory Default</span>
          </button>
        </div>
      </main>

      <BottomNav />
    </div>
  );
}
