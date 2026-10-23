import type { Metadata } from "next";

export const metadata: Metadata = {
  title:       "magni5 Monitor — Cloud Dashboard",
  description: "Remote monitoring for all magni5 devices",
};

const NAV = [
  { href: "/observability", label: "Observability" },
  { href: "/dashboard",     label: "Dashboard"      },
];

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <style>{`
          *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
          :root {
            --bg:      #0d0e14;
            --surface: #161820;
            --card:    #1e2029;
            --border:  #2c2e3a;
            --text:    #e4e5f0;
            --muted:   #888ba0;
            --dim:     #555768;
            --accent:  #5b8af5;
            --green:   #4caf7d;
            --amber:   #e0a840;
            --red:     #e05252;
          }
          html, body { background: var(--bg); color: var(--text);
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
            font-size: 14px; line-height: 1.6; min-height: 100vh; }
          a { color: inherit; text-decoration: none; }
        `}</style>
      </head>
      <body>
        {/* Top nav */}
        <nav style={{
          display: "flex", alignItems: "center", gap: 0,
          padding: "0 24px", height: 52,
          background: "var(--surface)", borderBottom: "1px solid var(--border)",
          position: "sticky", top: 0, zIndex: 100,
        }}>
          <a href="/observability" style={{ fontWeight: 700, fontSize: 15, marginRight: 32 }}>
            magni5 Cloud
          </a>
          {NAV.map(n => (
            <a key={n.href} href={n.href} style={{
              padding: "0 16px", height: "100%",
              display: "flex", alignItems: "center",
              fontSize: 13, color: "var(--muted)",
              borderBottom: "2px solid transparent",
            }}
            onMouseOver={e => (e.currentTarget.style.color = "var(--text)")}
            onMouseOut={e  => (e.currentTarget.style.color = "var(--muted)")}>
              {n.label}
            </a>
          ))}
        </nav>
        <main style={{ minHeight: "calc(100vh - 52px)" }}>{children}</main>
      </body>
    </html>
  );
}
