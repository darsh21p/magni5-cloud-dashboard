import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(url, key);

// ── Types ─────────────────────────────────────────────────────────────────────

export interface Device {
  device_id:        string;
  org_id:           string;
  hostname:         string;
  platform:         string;
  ip:               string;
  location_city:    string;
  location_country: string;
  ssid:             string;
  m5_score:         number;
  rs_score:         number;
  rl_score:         number;
  sp_score:         number;
  app_health_score: number | null;
  gw_rtt:           number | null;
  inet_rtt:         number | null;
  loss_pct:         number | null;
  download_mbps:    number | null;
  upload_mbps:      number | null;
  gw_icmp_blocked:  boolean;
  status:           "online" | "offline";
  last_seen:        string;
}

export interface DeviceHistory {
  id:        number;
  device_id: string;
  m5_score:  number;
  rs_score:  number;
  rl_score:  number;
  sp_score:  number;
  ts:        string;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

/** A device is considered offline if it hasn't pushed in > 10 minutes */
export function isOnline(device: Device): boolean {
  const last = new Date(device.last_seen).getTime();
  return Date.now() - last < 10 * 60 * 1000;
}

export function scoreColor(s: number): string {
  if (s >= 80) return "#4caf7d";
  if (s >= 60) return "#e0a840";
  return "#e05252";
}

export function scoreLabel(s: number): string {
  if (s >= 90) return "Excellent";
  if (s >= 80) return "Great";
  if (s >= 70) return "Good";
  if (s >= 60) return "Fair";
  if (s >= 50) return "Poor";
  return "Bad";
}

export function relativeTime(iso: string): string {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (diff < 60)  return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}
