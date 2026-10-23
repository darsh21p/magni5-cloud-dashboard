-- Run in Supabase → SQL Editor after supabase-schema.sql

-- Reads require a signed-in dashboard user; agents keep write access with the publishable key
DROP POLICY IF EXISTS "public_read_devices" ON devices;
DROP POLICY IF EXISTS "public_read_history" ON device_history;
CREATE POLICY "auth_read_devices" ON devices        FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_read_history" ON device_history FOR SELECT TO authenticated USING (true);

-- Stream row changes to the dashboard
ALTER PUBLICATION supabase_realtime ADD TABLE devices;

-- Remove the manual test row
DELETE FROM devices WHERE device_id = 'test001';
