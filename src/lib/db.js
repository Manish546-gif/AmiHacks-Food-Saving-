/**
 * Surplus-to-Shelter Database Integration Layer
 * 
 * Supports:
 * - Supabase (PostgreSQL + Realtime WebSocket subscriptions)
 * - Neon Serverless Postgres
 * - Local Reactive Synchronized State (Zero latency, persistent across tabs/sessions)
 */

export const DB_CONFIG = {
  provider: localStorage.getItem('surplus_db_type') || 'local', // 'supabase' | 'neon' | 'local'
  url: localStorage.getItem('surplus_db_url') || '',
  apiKey: localStorage.getItem('surplus_db_key') || '',
};

export const SCHEMA_SQL = `
-- ========================================================
-- SURPLUS-TO-SHELTER (KOTA PILOT) DATABASE DDL SCHEMA
-- ========================================================

CREATE TABLE IF NOT EXISTS donors (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  type VARCHAR(64) NOT NULL, -- 'restaurant', 'caterer', 'hostel_mess', 'grocer'
  lat DOUBLE PRECISION NOT NULL,
  lng DOUBLE PRECISION NOT NULL,
  address TEXT NOT NULL,
  contact VARCHAR(32) NOT NULL,
  fssai_no VARCHAR(64) NOT NULL,
  verified BOOLEAN DEFAULT TRUE,
  hygiene_rating NUMERIC(2,1) DEFAULT 4.5,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS recipients (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  type VARCHAR(64) NOT NULL, -- 'old_age_home', 'cci', 'anganwadi', 'govt_kitchen', 'ngo', 'night_shelter'
  tier INT NOT NULL CHECK (tier IN (1, 2, 3, 4)),
  lat DOUBLE PRECISION NOT NULL,
  lng DOUBLE PRECISION NOT NULL,
  address TEXT NOT NULL,
  contact_person VARCHAR(128) NOT NULL,
  contact VARCHAR(32) NOT NULL,
  registration_id VARCHAR(64) NOT NULL,
  headcount INT NOT NULL DEFAULT 50,
  capacity_kg NUMERIC(6,2) NOT NULL DEFAULT 50.0,
  capacity_used_kg NUMERIC(6,2) NOT NULL DEFAULT 0.0,
  need_today_kg NUMERIC(6,2) NOT NULL DEFAULT 20.0,
  has_kitchen BOOLEAN DEFAULT TRUE,
  has_refrigeration BOOLEAN DEFAULT FALSE,
  accepting BOOLEAN DEFAULT TRUE,
  verified BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS drivers (
  id SERIAL PRIMARY KEY,
  name VARCHAR(128) NOT NULL,
  phone VARCHAR(32) NOT NULL,
  vehicle VARCHAR(128) NOT NULL,
  vehicle_capacity_kg NUMERIC(6,2) NOT NULL DEFAULT 30.0,
  has_cooler BOOLEAN DEFAULT FALSE,
  available BOOLEAN DEFAULT TRUE,
  rating NUMERIC(2,1) DEFAULT 4.8,
  lat DOUBLE PRECISION,
  lng DOUBLE PRECISION,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS donations (
  id SERIAL PRIMARY KEY,
  donor_id INT REFERENCES donors(id),
  donor_name VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  category VARCHAR(64) NOT NULL, -- 'cooked', 'dairy', 'produce', 'bakery', 'packaged'
  qty_kg NUMERIC(6,2) NOT NULL,
  est_meals INT NOT NULL,
  ready_at TIMESTAMP WITH TIME ZONE NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  needs_cold_chain BOOLEAN DEFAULT FALSE,
  packaging VARCHAR(128) NOT NULL,
  status VARCHAR(32) NOT NULL DEFAULT 'posted', -- 'posted', 'offered', 'matched', 'picked_up', 'delivered', 'expired', 'escalated'
  matched_recipient_id INT REFERENCES recipients(id),
  driver_id INT REFERENCES drivers(id),
  photo_url TEXT,
  pickup_notes TEXT,
  delivery_otp VARCHAR(8),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS audit_logs (
  id SERIAL PRIMARY KEY,
  donation_id INT REFERENCES donations(id),
  event_type VARCHAR(64) NOT NULL,
  actor_role VARCHAR(32) NOT NULL,
  payload JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
`;

/**
 * Initialize / test database connectivity
 */
export async function testDbConnection({ url, key, provider }) {
  if (!url || !key) {
    return { ok: false, error: 'Database URL and API Key are required.' };
  }

  try {
    if (provider === 'supabase') {
      const resp = await fetch(`${url}/rest/v1/donations?select=id&limit=1`, {
        headers: {
          apikey: key,
          Authorization: `Bearer ${key}`,
        },
      });
      if (resp.ok) {
        return { ok: true, message: 'Connected to Supabase successfully!' };
      }
      return { ok: false, error: `Supabase responded with HTTP ${resp.status}` };
    }

    return { ok: true, message: 'Configured.' };
  } catch (err) {
    return { ok: false, error: err.message };
  }
}
