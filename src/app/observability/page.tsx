"use client";
import { useEffect, useState, useCallback } from "react";
import { supabase, Device, isOnline, scoreColor, relativeTime } from "../../lib/supabase";

// ── Score badge ───────────────────────────────────────────────────────────────
function Badge({ v }: { v: number | null }) {
  if (v === null) return <span style={{ color: "var(--dim)" }}>—</span>;
  const c = scoreColor(v);
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", justifyContent: "center",
      width: 34, height: 34, borderRadius: "50%",
      border: `2px solid ${c}`, background: `${c}18`,
      color: c, fontWeight: 700, fontSize: 12,
    }}>{v}</span>
  );
}

function Num({ v, unit = "" }: { v: number | null; unit?: string }) {
  if (v === null) return <span style={{ color: "var(--dim)" }}>—</span>;
  const c = scoreColor(v);
  return <span style={{ color: c, fontWeight: 600 }}>{v}{unit}</span>;
}

type SortKey = keyof Device;

// ── Page ──────────────────────────────────────────────────────────────────────
export default function ObservabilityPage() {
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(true);
  const [search,  setSearch]  = useState("");
  const [filter,  setFilter]  = useState<"all" | "online" | "offline">("all");
  const [sortKey, setSortKey] = useState<SortKey>("m5_score");
  const [sortAsc, setSortAsc] = useState(false);

  const load = useCallback(async () => {
    const { data, error } = await supabase
      .from("devices")
      .select("*")
      .order("m5_score", { ascending: false });
    if (!error && data) setDevices(data as Device[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
    const iv = setInterval(load, 30_000);
    return () => clearInterval(iv);
  }, [load]);

  const sort = (k: SortKey) => {
    if (k === sortKey) setSortAsc(a => !a);
    else { setSortKey(k); setSortAsc(false); }
  };

  const displayed = devices
    .filter(d => {
      const live = isOnline(d);
      if (filter === "online"  && !live) return false;
      if (filter === "offline" && live)  return false;
      const q = search.toLowerCase();
      return !q || d.hostname.toLowerCase().includes(q)
                || d.location_city.toLowerCase().includes(q)
                || d.ssid.toLowerCase().includes(q);
    })
    .sort((a, b) => {
      const va = a[sortKey] ?? -1;
      const vb = b[sortKey] ?? -1;
      const diff = va < vb ? -1 : va > vb ? 1 : 0;
      return sortAsc ? diff : -diff;
    });

  const online  = devices.filter(isOnline).length;
  const offline = devices.length - online;

  const TH = ({ label, k }: { label: string; k?: SortKey }) => (
    <th onClick={() => k && sort(k)} style={{
      padding: "10px 14px", textAlign: "left",
      fontSize: 11, fontWeight: 600, color: "var(--muted)",
      textTransform: "uppercase", letterSpacing: ".05em",
      cursor: k ? "pointer" : "default",
      background: "var(--card)", borderBottom: "1px solid var(--border)",
      whiteSpace: "nowrap", userSelect: "none",
    }}>
      {label}{k && k === sortKey ? (sortAsc ? " ↑" : " ↓") : ""}
    </th>
  );

  return (
    <div style={{ padding: 24 }}>

      {/* Header */}
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 20, fontWeight: 700, marginBottom: 4 }}>Observability</h1>
        <p style={{ color: "var(--muted)", fontSize: 13 }}>
          {devices.length} devices total · <span style={{ color: "var(--green)" }}>{online} online</span>
          {offline > 0 && <> · <span style={{ color: "var(--red)" }}>{offline} offline</span></>}
          &nbsp;· refreshes every 30 s
        </p>
      </div>

      {/* Toolbar */}
      <div style={{ display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap" }}>
        <input
          placeholder="Search hostname, city, SSID…"
          value={search} onChange={e => setSearch(e.target.value)}
          style={{
            flex: 1, minWidth: 200, padding: "7px 12px",
            background: "var(--card)", border: "1px solid var(--border)",
            borderRadius: 8, color: "var(--text)", fontSize: 13,
          }}
        />
        {(["all","online","offline"] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)} style={{
            padding: "7px 16px", borderRadius: 8, fontSize: 13,
            background: filter === f ? "var(--accent)" : "var(--card)",
            border: `1px solid ${filter === f ? "var(--accent)" : "var(--border)"}`,
            color: filter === f ? "#fff" : "var(--muted)", cursor: "pointer",
          }}>
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {/* Table */}
      {loading ? (
        <p style={{ color: "var(--muted)", padding: 40, textAlign: "center" }}>Loading devices…</p>
      ) : (
        <div style={{ overflowX: "auto", borderRadius: 10, border: "1px solid var(--border)" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr>
                <TH label="Score"      k="m5_score"         />
                <TH label="Hostname"   k="hostname"         />
                <TH label="RS"         k="rs_score"         />
                <TH label="RL"         k="rl_score"         />
                <TH label="SP"         k="sp_score"         />
                <TH label="App Health" k="app_health_score" />
                <TH label="Status"                          />
                <TH label="Network"                         />
                <TH label="Location"   k="location_city"    />
                <TH label="Last seen"  k="last_seen"        />
              </tr>
            </thead>
            <tbody>
              {displayed.length === 0 && (
                <tr><td colSpan={10} style={{ padding: 40, textAlign: "center", color: "var(--muted)" }}>
                  No devices match
                </td></tr>
              )}
              {displayed.map((d, i) => {
                const live = isOnline(d);
                return (
                  <tr key={d.device_id}
                    onClick={() => window.location.href = `/device/${d.device_id}`}
                    style={{
                      borderTop: i > 0 ? "1px solid var(--border)" : "none",
                      cursor: "pointer",
                      background: i % 2 === 0 ? "transparent" : "rgba(255,255,255,.012)",
                    }}
                    onMouseOver={e => (e.currentTarget.style.background = "rgba(91,138,245,.06)")}
                    onMouseOut={e  => (e.currentTarget.style.background = i % 2 === 0 ? "transparent" : "rgba(255,255,255,.012)")}
                  >
                    <td style={{ padding: "10px 14px" }}><Badge v={d.m5_score} /></td>
                    <td style={{ padding: "10px 14px", fontWeight: 600 }}>
                      <span style={{ fontSize: 11, marginRight: 6, opacity: .6 }}>
                        {d.platform === "darwin" ? "" : d.platform === "windows" ? "⊞" : "🐧"}
                      </span>
                      {d.hostname}
                    </td>
                    <td style={{ padding: "10px 14px" }}><Num v={d.rs_score} /></td>
                    <td style={{ padding: "10px 14px" }}><Num v={d.rl_score} /></td>
                    <td style={{ padding: "10px 14px" }}><Num v={d.sp_score} /></td>
                    <td style={{ padding: "10px 14px" }}><Num v={d.app_health_score} /></td>
                    <td style={{ padding: "10px 14px" }}>
                      <span style={{
                        display: "inline-flex", alignItems: "center", gap: 5,
                        padding: "2px 9px", borderRadius: 12, fontSize: 12,
                        background: live ? "rgba(76,175,125,.12)" : "rgba(224,82,82,.12)",
                        color: live ? "var(--green)" : "var(--red)",
                      }}>
                        <span style={{ width: 6, height: 6, borderRadius: "50%",
                          background: live ? "var(--green)" : "var(--red)" }} />
                        {live ? "Connected" : "Offline"}
                      </span>
                    </td>
                    <td style={{ padding: "10px 14px", color: "var(--muted)" }}>
                      {d.ssid || "—"}
                    </td>
                    <td style={{ padding: "10px 14px", color: "var(--muted)" }}>
                      {d.location_city ? `${d.location_city}, ${d.location_country}` : "—"}
                    </td>
                    <td style={{ padding: "10px 14px", color: "var(--muted)", whiteSpace: "nowrap" }}>
                      {relativeTime(d.last_seen)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
