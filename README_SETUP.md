# CrewPulse - Shift & Rota Tracking Web App (100% Free Stack)

CrewPulse is an hourly workforce management system built for hospitality, cleaning agencies, and field site crews.

## 1. Project Folder Structure

```
crewpulse/
├── public/
│   ├── manifest.json         # PWA mobile install manifest
│   ├── sw.js                 # Service worker for offline clock-in
│   ├── icon-192.png          # PWA home screen icon (192px)
│   └── icon-512.png          # PWA splash icon (512px)
├── supabase/
│   ├── schema.sql            # Complete DB tables, RLS policies, indexes
│   └── seed.sql              # 1 business, 5 employees, 2 weeks of shifts
├── src/ (or root components)
│   ├── api/
│   │   └── supabaseClient.ts # Supabase client with offline demo fallback
│   ├── components/
│   │   ├── ClockInOutCard.tsx    # Big tactile worker clock-in/out & GPS
│   │   ├── ManualShiftModal.tsx  # Manual shift logger with break & hours math
│   │   ├── ShiftListFeed.tsx     # Chronological filterable shift table
│   │   ├── BusinessProfileModal.tsx # Business settings (address, rate, currency)
│   │   ├── InviteStaffModal.tsx  # Shareable link & code generator
│   │   └── RoleSwitcherBar.tsx   # Instant 1-click test role switcher
│   ├── context/
│   │   └── CrewPulseContext.tsx  # App state, role, multi-business switcher
│   └── types/
│       └── crewpulse.ts          # TypeScript interfaces for all DB entities
├── .env.example              # Environment variables list
└── README_SETUP.md           # Step-by-step free tier guide
```

---

## 2. Step-by-Step Beginner Guide (100% Free Tier Setup)

### Step 1: Create Free Supabase Project
1. Go to [https://supabase.com](https://supabase.com) and click **Start your project** (Free tier gives 500MB database, 50,000 monthly active users, and unlimited API requests).
2. Click **New Project**, choose an organization, and name your project (e.g. `crewpulse-db`).
3. Set a strong database password and select a region close to your business (e.g. `London (eu-west-2)`).
4. Wait 1-2 minutes for provisioning to finish.

### Step 2: Run Database Schema & Seed Data
1. In the Supabase Dashboard, click **SQL Editor** on the left menu.
2. Open the file `supabase/schema.sql` from this repository, copy the entire SQL text, paste it into the SQL editor, and click **Run**.
3. Next, open `supabase/seed.sql`, copy and paste it into a new SQL query, and click **Run**.
4. You now have the full production database ready with 1 demo business, 5 staff members, and real past shifts!

### Step 3: Get Your API Keys
1. In Supabase, click **Project Settings** (gear icon) -> **API**.
2. Copy your **Project URL** (`https://xyz.supabase.co`).
3. Copy your **anon / public** key (`eyJhbGci...`).

### Step 4: Run Locally or Deploy to Vercel
#### Local Development:
```bash
cp .env.example .env
# Paste your Supabase URL and anon key into .env
npm install
npm run dev
```

#### Deploy Free on Vercel:
1. Push your repository to your GitHub account (`git push origin main`).
2. Go to [https://vercel.com](https://vercel.com) and click **Add New** -> **Project**.
3. Import your GitHub repository.
4. In the **Environment Variables** section, add:
   - `VITE_SUPABASE_URL` (or `NEXT_PUBLIC_SUPABASE_URL`) = your Supabase URL
   - `VITE_SUPABASE_ANON_KEY` (or `NEXT_PUBLIC_SUPABASE_ANON_KEY`) = your anon key
   - `RESEND_API_KEY` = your free Resend key (from https://resend.com)
5. Click **Deploy**. Vercel will build and deploy the app with a free HTTPS URL.

### Step 5: Automated Email Reports with Vercel Cron or Supabase pg_cron
To trigger weekly email reports for free:
- In Supabase: Run `SELECT cron.schedule('weekly-report', '0 9 * * 1', $$ SELECT net.http_post(...) $$);`
- Or in Vercel: Add a `vercel.json` with a cron schedule hitting `/api/reports/cron`.
