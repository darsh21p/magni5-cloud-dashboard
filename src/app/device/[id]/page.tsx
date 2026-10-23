"use client";
import { useEffect, useState } from "react";
import { supabase, Device, DeviceHistory, isOnline, scoreColor, relativeTime } from "../../../lib/supabase";
import { use } from "react";

// ── Gauge ─────────────────────────────────────────────────────────────────────
function Gauge({ label, value }: { label: string; value: number }) {
  const c = scoreColor(value);
  return (
    <div style={{ textAlign: "center" }}>
      <div style={{
        width: 72, height: 72, borderRadius: "50%", margin: "0 auto 8px",
        border: `4px solid ${c}`, background: `${c}14`,
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 20, fontWeight: 700, color: c,
      }}>{value}</div>
      <p style={{ fontSize: 12, color: "var(--muted)" }}>{label}</p>
    </div>
  );
}

// ── Mini history chart ─────────────────────────────────────────────────────────
function SparkLine({ history }: { history: DeviceHistory[] }) {
  if (history.length < 2) return <p style={{ color: "var(--muted)", fontSize: 12 }}>Insufficient history</p>;
  const vals = history.map(h => h.m5_score);
  const min  = Math.min(...vals);
  const max  = Math.max(...vals);
  const W = 500, H = 60;
  const pts = history.map((h, i) => {
    const x = (i / (history.length - 1)) * W;
    const y = H - ((h.m5_score - min) / Math.max(max - min, 1)) * H;
    return `${x},${y}`;
  }).join(" ");
  return (
    <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ display: "block" }}>
      <polyline fill="none" stroke="#4caf7d" strokeWidth="2" points={pts} />
    </svg>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function DeviceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [device,  setDevice]  = useState<Device | null>(null);
  const [history, setHistory] = useState<DeviceHistory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const [{ data: dev }, { data: hist }] = await Promise.all([
        supabase.from("devices").select("*").eq("device_id", id).single(),
        supabase.from("device_history").select("*")
          .eq("device_id", id).order("ts", { ascending: true }).limit(48),
      ]);
      if (dev) setDevice(dev as Device);
      if (hist) setHistory(hist as DeviceHistory[]);
      setLoading(false);
    }
    load();
    const iv = setInterval(load, 30_000);
    return () => clearInterval(iv);
  }, [id]);

  if (loading) return (
    <div style={{ padding: 40, textAlign: "center", color: "var(--muted)" }}>Loading device…</div>
  );
  if (!device) return (
    <div style={{ padding: 40, textAlign: "center", color: "var(--red)" }}>Device not found.</div>
  );

  const live = isOnline(device);

  function Row({ label, value, color }: { label: string; value: string | number; color?: string }) {
    return (
      <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 0",
        borderBottom: "1px solid var(--border)" }}>
        <span style={{ color: "var(--muted)", fontSize: 13 }}>{label}</span>
        <span style={{ fontWeight: 600, color: color || "var(--text)", fontSize: 13 }}>{value}</span>
      </div>
    );
  }

  return (
    <div style={{ padding: 24, maxWidth: 960, margin: "0 auto" }}>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between",
        marginBottom: 24, gap: 16, flexWrap: "wrap" }}>
        <div>
          <a href="/observability" style={{ fontSize: 12, color: "var(--accent)", marginBottom: 8, display: "block" }}>
            ← Back to Observability
          </a>
          <h1 style={{ fontSize: 22, fontWeight: 700 }}>{device.hostname}</h1>
          <p style={{ color: "var(--muted)", fontSize: 13, marginTop: 4 }}>
            {device.location_city ? `${device.location_city}, ${device.location_country}` : "Unknown location"}
            &nbsp;· {device.ssid || "No Wi-Fi"}
            &nbsp;· Last seen {relativeTime(device.last_seen)}
          </p>
        </div>
        <span style={{
          padding: "5px 14px", borderRadius: 12, fontSize: 13, fontWeight: 600,
          background: live ? "rgba(76,175,125,.12)" : "rgba(224,82,82,.12)",
          color: live ? "var(--green)" : "var(--red)",
          border: `1px solid ${live ? "var(--green)" : "var(--red)"}40`,
        }}>
          {live ? "Connected" : "Offline"}
        </span>
      </div>

      {/* Gauges */}
      <div style={{ background: "var(--card)", border: "1px solid var(--border)",
        borderRadius: 12, padding: "20px 32px", marginBottom: 20 }}>
        <div style={{ display: "flex", justifyContent: "space-around", gap: 16 }}>
          <Gauge label="M5 Score"       value={device.m5_score} />
          <Gauge label="Responsiveness" value={device.rs_score} />
          <Gauge label="Reliability"    value={device.rl_score} />
          <Gauge label="Speed"          value={device.sp_score} />
          {device.app_health_score !== null &&
            <Gauge label="App Health" value={device.app_health_score} />}
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 20 }}>

        {/* Network path */}
        <div style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 12, padding: 20 }}>
          <h2 style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>Network Path</h2>
          <Row label="Gateway RTT"
            value={device.gw_icmp_blocked ? "VPN (blocked)" : device.gw_rtt !== null ? `${device.gw_rtt} ms` : "—"}
            color={device.gw_icmp_blocked ? "var(--amber)" : undefined}
          />
          <Row label="Internet RTT"
            value={device.inet_rtt !== null ? `${device.inet_rtt} ms` : "—"}
            color={device.inet_rtt !== null ? scoreColor(device.inet_rtt > 200 ? 40 : device.inet_rtt > 80 ? 70 : 95) : undefined}
          />
          <Row label="Packet Loss"
            value={device.loss_pct !== null ? `${device.loss_pct}%` : "—"}
            color={device.loss_pct !== null && device.loss_pct > 1 ? "var(--red)" : "var(--green)"}
          />
          <Row label="VPN Active" value={device.gw_icmp_blocked ? "Yes" : "No"}
            color={device.gw_icmp_blocked ? "var(--amber)" : "var(--muted)"}
          />
        </div>

        {/* Device info */}
        <div style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 12, padding: 20 }}>
          <h2 style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>Device Info</h2>
          <Row label="Hostname" value={device.hostname} />
          <Row label="Platform" value={device.platform || "—"} />
          <Row label="IP"       value={device.ip || "—"} />
          <Row label="Download" value={device.download_mbps !== null ? `${device.download_mbps} Mbps` : "Not tested"} />
          <Row label="Upload"   value={device.upload_mbps  !== null ? `${device.upload_mbps}  Mbps` : "Not tested"} />
        </div>

      </div>

      {/* M5 history */}
      <div style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 12, padding: 20 }}>
        <h2 style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>
          M5 Score History · last {history.length} snapshots
        </h2>
        <SparkLine history={history} />
        {history.length > 0 && (
          <p style={{ fontSize: 11, color: "var(--muted)", marginTop: 8, textAlign: "right" }}>
            {new Date(history[0].ts).toLocaleString()} → {new Date(history[history.length - 1].ts).toLocaleString()}
          </p>
        )}
      </div>

    </div>
  );
}
