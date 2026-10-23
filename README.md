# magni5 Cloud Dashboard

Remote monitoring for 4,000–5,000 magni5 devices. Free tier: Supabase + Vercel.

## Quick Start

### 1. Supabase (backend — free)
1. Create project at [supabase.com](https://supabase.com)
2. Open **SQL Editor** → paste `supabase-schema.sql` → Run
3. Copy **Project URL** and **anon public key** from Settings → API

### 2. Configure devices
In `~/.m5monitor/settings.json` on each device (or distribute via MDM):
```json
{
  "cloud_push_enabled": true,
  "cloud_supabase_url": "https://YOUR-PROJECT-ID.supabase.co",
  "cloud_supabase_key": "YOUR-ANON-KEY",
  "cloud_org_id": "your-org-name",
  "cloud_push_iv": 300
}
```
Devices start pushing metrics within 5 minutes of relaunch.

### 3. Run dashboard locally
```bash
cp .env.local.example .env.local
# fill in NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY
npm install
npm run dev
# → http://localhost:3000
```

### 4. Deploy to Vercel (free)
```bash
git init && git add . && git commit -m "initial"
# Push to GitHub, then import at vercel.com
# Add env vars: NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY
```

## Pages

| Page | URL | Description |
|------|-----|-------------|
| Observability | `/observability` | Full device list — search, filter, sort |
| Dashboard     | `/dashboard`     | Summary by location + worst performers  |
| Device Detail | `/device/[id]`   | Individual device metrics + history     |

## Free Tier Limits (comfortable headroom)

| Resource | Used | Free limit |
|----------|------|------------|
| DB storage | ~10 MB (5K rows) | 500 MB |
| Monthly bandwidth | ~2.2 GB | 5 GB |
| Vercel bandwidth | ~1.5 GB | 100 GB |
