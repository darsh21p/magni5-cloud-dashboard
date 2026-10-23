-- Run in Supabase → SQL Editor
-- Devices write through this function only; the publishable key gets no direct table access.

CREATE OR REPLACE FUNCTION public.push_device(p jsonb, with_history boolean DEFAULT false)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF coalesce(p->>'device_id', '') = '' THEN
    RAISE EXCEPTION 'device_id required';
  END IF;

  INSERT INTO devices (
    device_id, org_id, hostname, platform, ip, location_city, location_country, ssid,
    m5_score, rs_score, rl_score, sp_score, app_health_score,
    gw_rtt, inet_rtt, loss_pct, download_mbps, upload_mbps, gw_icmp_blocked, status, last_seen
  ) VALUES (
    p->>'device_id', coalesce(p->>'org_id', 'default'), p->>'hostname', p->>'platform', p->>'ip',
    p->>'location_city', p->>'location_country', p->>'ssid',
    (p->>'m5_score')::smallint, (p->>'rs_score')::smallint, (p->>'rl_score')::smallint,
    (p->>'sp_score')::smallint, (p->>'app_health_score')::smallint,
    (p->>'gw_rtt')::real, (p->>'inet_rtt')::real, (p->>'loss_pct')::real,
    (p->>'download_mbps')::real, (p->>'upload_mbps')::real,
    coalesce((p->>'gw_icmp_blocked')::boolean, false), 'online', now()
  )
  ON CONFLICT (device_id) DO UPDATE SET
    org_id           = excluded.org_id,
    hostname         = coalesce(excluded.hostname,         devices.hostname),
    platform         = coalesce(excluded.platform,         devices.platform),
    ip               = coalesce(excluded.ip,               devices.ip),
    location_city    = coalesce(nullif(excluded.location_city, ''),    devices.location_city),
    location_country = coalesce(nullif(excluded.location_country, ''), devices.location_country),
    ssid             = coalesce(excluded.ssid,             devices.ssid),
    m5_score         = coalesce(excluded.m5_score,         devices.m5_score),
    rs_score         = coalesce(excluded.rs_score,         devices.rs_score),
    rl_score         = coalesce(excluded.rl_score,         devices.rl_score),
    sp_score         = coalesce(excluded.sp_score,         devices.sp_score),
    app_health_score = coalesce(excluded.app_health_score, devices.app_health_score),
    gw_rtt           = coalesce(excluded.gw_rtt,           devices.gw_rtt),
    inet_rtt         = coalesce(excluded.inet_rtt,         devices.inet_rtt),
    loss_pct         = coalesce(excluded.loss_pct,         devices.loss_pct),
    download_mbps    = coalesce(excluded.download_mbps,    devices.download_mbps),
    upload_mbps      = coalesce(excluded.upload_mbps,      devices.upload_mbps),
    gw_icmp_blocked  = excluded.gw_icmp_blocked,
    status           = 'online',
    last_seen        = now();

  IF with_history THEN
    INSERT INTO device_history (device_id, m5_score, rs_score, rl_score, sp_score)
    VALUES (p->>'device_id', (p->>'m5_score')::smallint, (p->>'rs_score')::smallint,
            (p->>'rl_score')::smallint, (p->>'sp_score')::smallint);
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.push_device(jsonb, boolean) FROM public;
GRANT EXECUTE ON FUNCTION public.push_device(jsonb, boolean) TO anon, authenticated;

-- Remove direct write access for the publishable key
DROP POLICY IF EXISTS "device_upsert_devices" ON devices;
DROP POLICY IF EXISTS "device_update_devices" ON devices;
DROP POLICY IF EXISTS "device_insert_history" ON device_history;

-- Clean up probe/test rows
DELETE FROM devices WHERE device_id IN ('probe', 'probe2', 'test001');
