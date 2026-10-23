-- ============================================================
-- magni5 Cloud Monitoring — Supabase Schema
-- Run this in: Supabase → SQL Editor → New Query
-- ============================================================

CREATE TABLE IF NOT EXISTS devices (
  device_id        TEXT PRIMARY KEY,
  org_id           TEXT NOT NULL DEFAULT 'default',
  hostname         TEXT,
  platform         TEXT,
  ip               TEXT,
  location_city    TEXT,
  location_country TEXT,
  ssid             TEXT,
  m5_score         SMALLINT,
  rs_score         SMALLINT,
  rl_score         SMALLINT,
  sp_score         SMALLINT,
  app_health_score SMALLINT,
  gw_rtt           REAL,
  inet_rtt         REAL,
  loss_pct         REAL,
  download_mbps    REAL,
  upload_mbps      REAL,
  gw_icmp_blocked  BOOLEAN DEFAULT FALSE,
  status           TEXT DEFAULT 'online',
  last_seen        TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS device_history (
  id         BIGSERIAL PRIMARY KEY,
  device_id  TEXT REFERENCES devices(device_id) ON DELETE CASCADE,
  m5_score   SMALLINT,
  rs_score   SMALLINT,
  rl_score   SMALLINT,
  sp_score   SMALLINT,
  ts         TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for fast queries
CREATE INDEX IF NOT EXISTS idx_devices_location ON devices (location_city, location_country);
CREATE INDEX IF NOT EXISTS idx_devices_org      ON devices (org_id);
CREATE INDEX IF NOT EXISTS idx_devices_status   ON devices (status);
CREATE INDEX IF NOT EXISTS idx_history_device   ON device_history (device_id, ts DESC);

-- Row Level Security (allow public reads + device writes)
ALTER TABLE devices        ENABLE ROW LEVEL SECURITY;
ALTER TABLE device_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "public_read_devices"   ON devices        FOR SELECT USING (true);
CREATE POLICY IF NOT EXISTS "device_upsert_devices" ON devices        FOR INSERT WITH CHECK (true);
CREATE POLICY IF NOT EXISTS "device_update_devices" ON devices        FOR UPDATE USING (true);
CREATE POLICY IF NOT EXISTS "public_read_history"   ON device_history FOR SELECT USING (true);
CREATE POLICY IF NOT EXISTS "device_insert_history" ON device_history FOR INSERT WITH CHECK (true);

-- Optional: auto-prune history older than 30 days (requires pg_cron extension)
-- SELECT cron.schedule('prune-history', '0 3 * * *',
--   $$DELETE FROM device_history WHERE ts < NOW() - INTERVAL '30 days'$$);
