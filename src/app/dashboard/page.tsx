"use client";
import { useEffect, useState } from "react";
import { supabase, Device, isOnline, scoreColor, scoreLabel } from "../../lib/supabase";

interface LocationStat {
  city:     string;
  country:  string;
  count:    number;
  online:   number;
  avg_m5:   number;
  avg_rs:   number;
  avg_rl:   number;
  avg_sp:   number;
}

function avg(nums: number[]): number {
  return nums.length ? Math.round(nums.reduce((a, b) => a + b, 0) / nums.length) : 0;
}

// ── Summary card ──────────────────────────────────────────────────────────────
function SummaryCard({ icon, label, value }: { icon: string; label: string; value: number }) {
  const c = scoreColor(value);
  return (
    <div style={{
      background: "var(--card)", border: "1px solid var(--border)",
      borderRadius: 12, padding: "20px 24px",
    }}>
      <p style={{ fontSize: 13, color: "var(--muted)", marginBottom: 6 }}>{label}</p>
      <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
        <span style={{ fontSize: 13, color: "var(--muted)" }}>{icon}</span>
        <span style={{ fontSize: 42, fontWeight: 700, color: c, lineHeight: 1 }}>{value}</span>
      </div>
      <p style={{ fontSize: 12, color: "var(--muted)", marginTop: 4 }}>
        {scoreLabel(value)} — Average Score
      </p>
    </div>
  );
}

// ── Score bar row ─────────────────────────────────────────────────────────────
function ScoreBar({ label, value }: { label: string; value: number }) {
  const c = scoreColor(value);
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      <span style={{ minWidth: 18, fontSize: 11, color: "var(--muted)" }}>{label}</span>
      <div style={{ flex: 1, height: 5, borderRadius: 3, background: "var(--border)", overflow: "hidden" }}>
        <div style={{ width: `${value}%`, height: "100%", background: c, borderRadius: 3 }} />
      </div>
      <span style={{ minWidth: 28, textAlign: "right", color: c, fontWeight: 600, fontSize: 12 }}>{value}</span>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function DashboardPage() {
  const [devices,  setDevices]  = useState<Device[]>([]);
  const [loading,  setLoading]  = useState(true);

  useEffect(() => {
    async function load() {
      const { data, error } = await supabase.from("devices").select("*");
      if (!error && data) setDevices(data as Device[]);
      setLoading(false);
    }
    load();
    const iv = setInterval(load, 60_000);
    return () => clearInterval(iv);
  }, []);

  if (loading) return (
    <div style={{ padding: 40, textAlign: "center", color: "var(--muted)" }}>Loading…</div>
  );

  const online    = devices.filter(isOnline);
  const offline   = devices.length - online.length;
  const allM5     = avg(devices.map(d => d.m5_score));
  const allRS     = avg(devices.map(d => d.rs_score));
  const allRL     = avg(devices.map(d => d.rl_score));
  const allSP     = avg(devices.map(d => d.sp_score));

  // Group by city
  const byCity = new Map<string, Device[]>();
  for (const d of devices) {
    const key = d.location_city || "Unknown";
    if (!byCity.has(key)) byCity.set(key, []);
    byCity.get(key)!.push(d);
  }

  const locationStats: LocationStat[] = Array.from(byCity.entries())
    .map(([city, devs]) => ({
      city,
      country:  devs[0].location_country,
      count:    devs.length,
      online:   devs.filter(isOnline).length,
      avg_m5:   avg(devs.map(d => d.m5_score)),
      avg_rs:   avg(devs.map(d => d.rs_score)),
      avg_rl:   avg(devs.map(d => d.rl_score)),
      avg_sp:   avg(devs.map(d => d.sp_score)),
    }))
    .sort((a, b) => b.avg_m5 - a.avg_m5);

  // Worst 5 devices
  const worst5 = [...devices].sort((a, b) => a.m5_score - b.m5_score).slice(0, 5);

  return (
    <div style={{ padding: 24, maxWidth: 1200 }}>

      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 20, fontWeight: 700, marginBottom: 4 }}>Dashboard</h1>
        <p style={{ color: "var(--muted)", fontSize: 13 }}>
          {devices.length} devices · <span style={{ color: "var(--green)" }}>{online.length} online</span>
          {offline > 0 && <> · <span style={{ color: "var(--red)" }}>{offline} offline</span></>}
        </p>
      </div>

      {/* Summary cards — mirrors ORB layout */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 28 }}>
        <SummaryCard icon="M5" label="Average M5 Score"      value={allM5} />
        <SummaryCard icon="RS" label="Responsiveness Avg"    value={allRS} />
        <SummaryCard icon="RL" label="Reliability Avg"       value={allRL} />
        <SummaryCard icon="SP" label="Speed Avg"             value={allSP} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 20 }}>

        {/* Location breakdown */}
        <div>
          <h2 style={{ fontSize: 15, fontWeight: 600, marginBottom: 14 }}>Score by Location</h2>
          <div style={{ border: "1px solid var(--border)", borderRadius: 10, overflow: "hidden" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr style={{ background: "var(--card)", borderBottom: "1px solid var(--border)" }}>
                  {["City", "Devices", "Online", "M5", "RS", "RL", "SP"].map(h => (
                    <th key={h} style={{ padding: "9px 14px", textAlign: h === "City" ? "left" : "center",
                      fontSize: 11, fontWeight: 600, color: "var(--muted)",
                      textTransform: "uppercase", letterSpacing: ".05em" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {locationStats.map((ls, i) => (
                  <tr key={ls.city} style={{
                    borderTop: i > 0 ? "1px solid var(--border)" : "none",
                    background: i % 2 === 0 ? "transparent" : "rgba(255,255,255,.015)",
                  }}>
                    <td style={{ padding: "10px 14px" }}>
                      <span style={{ fontWeight: 600 }}>{ls.city}</span>
                      <span style={{ color: "var(--muted)", marginLeft: 6, fontSize: 11 }}>{ls.country}</span>
                    </td>
                    <td style={{ padding: "10px 14px", textAlign: "center", color: "var(--muted)" }}>{ls.count}</td>
                    <td style={{ padding: "10px 14px", textAlign: "center", color: "var(--green)" }}>{ls.online}</td>
                    {[ls.avg_m5, ls.avg_rs, ls.avg_rl, ls.avg_sp].map((v, j) => (
                      <td key={j} style={{ padding: "10px 14px", textAlign: "center",
                        fontWeight: 600, color: scoreColor(v) }}>{v}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Worst performers */}
        <div>
          <h2 style={{ fontSize: 15, fontWeight: 600, marginBottom: 14 }}>Needs Attention</h2>
          <div style={{ background: "var(--card)", border: "1px solid var(--border)",
            borderRadius: 10, overflow: "hidden" }}>
            {worst5.map((d, i) => (
              <a key={d.device_id} href={`/device/${d.device_id}`} style={{
                display: "block", padding: "12px 16px",
                borderTop: i > 0 ? "1px solid var(--border)" : "none",
                cursor: "pointer",
              }}
              onMouseOver={e => (e.currentTarget.style.background = "rgba(91,138,245,.06)")}
              onMouseOut={e  => (e.currentTarget.style.background = "transparent")}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <p style={{ fontWeight: 600, marginBottom: 2 }}>{d.hostname}</p>
                    <p style={{ fontSize: 11, color: "var(--muted)" }}>
                      {d.location_city || "Unknown"} · {d.ssid || "—"}
                    </p>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <p style={{ fontSize: 22, fontWeight: 700, color: scoreColor(d.m5_score) }}>
                      {d.m5_score}
                    </p>
                    <p style={{ fontSize: 11, color: "var(--muted)" }}>M5</p>
                  </div>
                </div>
                <div style={{ marginTop: 8, display: "flex", flexDirection: "column", gap: 3 }}>
                  <ScoreBar label="RS" value={d.rs_score} />
                  <ScoreBar label="RL" value={d.rl_score} />
                  <ScoreBar label="SP" value={d.sp_score} />
                </div>
              </a>
            ))}
            {worst5.length === 0 && (
              <p style={{ padding: 24, color: "var(--muted)", textAlign: "center" }}>
                All devices healthy
              </p>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
