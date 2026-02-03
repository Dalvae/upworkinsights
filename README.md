# Upwork Insights

A personal analytics dashboard that captures and visualizes job data from your Upwork browsing activity.

## What is Upwork Insights?

Upwork Insights helps you analyze and understand the Upwork freelance marketplace by capturing job data from your own manual browsing. As you search and browse jobs on Upwork, the browser extension saves the jobs you see. Then explore them through an interactive dashboard with trends, skills demand, competition analysis, and personalized job matching.

**Important:** This is not scraping. The browser extension only captures data from pages you manually visit on Upwork. It works like a bookmark manager that saves metadata about what you browse.

## How It Works

The system has three main parts:

**Browser Extension** - Runs in Firefox or Chrome and captures job data as you browse Upwork in two ways:
- Intercepts GraphQL API responses from the Upwork feed and recommendations
- Extracts server-rendered HTML data from search results pages

When you visit Upwork, the extension sends captured job data to your backend (no data is stored on external servers without your control).

**Backend API** - A Hono + TypeScript server that:
- Ingests job data from the extension
- Normalizes and deduplicates job records
- Calculates job snapshots to track proposal velocity and competition
- Computes match scores based on your profile
- Serves data to the dashboard

**Dashboard** - A server-rendered HTML + vanilla TypeScript interface that shows:
- Job trends, skill demand, and tier breakdowns
- Sortable/filterable jobs table with search
- Individual job details with proposal evolution tracking
- Competition analysis (proposal velocity by tier, hottest jobs)
- Budget and hourly rate distributions
- Personalized job matching scores

## Features

**Dashboard & Analytics**
- Overview stats: total jobs, jobs added today, average budgets, fixed vs. hourly ratio
- 30-day job trend line chart
- Top skills demand bar chart
- Tier breakdown doughnut chart
- Geographic distribution of clients
- Budget and hourly distributions with time-period filters (7/30/90 days)
- Proposal velocity analysis by tier
- Tier trends over time

**Jobs Table**
- Sortable columns (title, budget, tier, date, proposals, etc.)
- Text search across job titles and descriptions
- Filters: tier (entry/intermediate/expert), job type (fixed/hourly), country, budget range
- Pagination with customizable page size
- Click any job title to view full details

**Job Details**
- Full job description and requirements
- Proposal evolution chart (shows how proposals accumulate over time)
- Client quality metrics: reviews, feedback, payment verification
- Match score calculation (personalized fit algorithm)
- Quick links to job on Upwork

**Competition Analysis**
- Proposal velocity: median proposals per hour by tier
- Proposal distribution: percentage of jobs in each proposal volume bracket
- Hottest jobs ranking: jobs with highest proposal velocity
- Shows which job tiers have the most competition

**Match Scoring Algorithm**
- 40% Skills overlap: how many of your skills are required
- 20% Tier preference: matches your preferred tier
- 20% Budget fit: within your hourly rate or budget range
- 20% Client quality: based on payment verification, reviews, and feedback

## Tech Stack

- **Backend**: Hono 4 + TypeScript + Bun
- **Database**: Supabase (PostgreSQL)
- **Frontend**: Server-side rendered HTML + vanilla TypeScript + Chart.js
- **Styling**: TailwindCSS 4
- **Browser Extension**: WebExtension API (Firefox/Chrome compatible)
- **Build**: Vite
- **Deployment**: Cloudflare Workers

## Project Structure

```
src/
  index.ts              # Hono server entry point
  types.ts              # TypeScript interfaces
  routes/
    ingest.ts           # API endpoint for extension data ingestion
    jobs.ts             # Job search, filter, list API
    analytics.ts        # Analytics data endpoints
    profile.ts          # User profile management
    pages.ts            # SSR page routes
  views/
    dashboard.ts        # Dashboard page template
    jobs.ts             # Jobs table page
    job-detail.ts       # Individual job detail page
    analytics.ts        # Analytics page with charts
    profile.ts          # User profile form
    layout.ts           # Base HTML layout
  lib/
    normalize.ts        # Normalize raw Upwork jobs to database schema
    matching.ts         # Job matching algorithm
    scoring.ts          # Match score calculations
    constants.ts        # Constants (tiers, job types, etc.)
  middleware/
    auth.ts             # API key authentication
  db/
    client.ts           # Supabase client initialization

extension/
  manifest.json         # WebExtension manifest v2
  content.js            # Content script (dual-mode: fetch + SSR capture)
  background.js         # Background service worker (data relay)
  popup.html/js         # Extension popup UI
  icon.png              # Extension icon

scripts/
  migration.sql         # Database schema and triggers
  rls.sql               # Row-level security policies
  import.ts             # Bulk import utility for historical data

client/
  dashboard.ts          # Dashboard client script (Chart.js)
  analytics.ts          # Analytics page client script
  jobs.ts               # Jobs table client script
  job-detail.ts         # Job detail page client script
  profile.ts            # Profile form client script
  lib/
    api.ts              # API client utilities
    charts.ts           # Chart.js configuration utilities
```

## Getting Started

### Prerequisites
- Node.js/Bun (project uses Bun)
- Supabase account (for PostgreSQL database)
- Firefox or Chrome browser

### Installation

1. Clone the repository
```bash
git clone https://github.com/Dalvae/upworkinsights.git
cd upworkinsights
```

2. Install dependencies
```bash
bun install
```

3. Create a Supabase project at https://supabase.com

4. Run the database migration
   - In Supabase SQL Editor, paste contents of `scripts/migration.sql`
   - Optionally apply RLS policies from `scripts/rls.sql`

5. Create `.env` with your Supabase credentials
```
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_KEY=your-service-key  # optional, for admin operations
```

6. Start the development server
```bash
bun run dev
```
The server starts at `http://localhost:8787`

### Loading the Browser Extension

**Firefox:**
1. Navigate to `about:debugging#/runtime/this-firefox`
2. Click "Load Temporary Add-on"
3. Select `extension/manifest.json`

**Chrome:**
1. Navigate to `chrome://extensions`
2. Enable "Developer mode" (top right)
3. Click "Load unpacked"
4. Select the `extension/` directory

### First Run

1. Open the Upwork Insights popup in your browser toolbar
2. Enter your Supabase URL and anon key (from `.env`)
3. Browse Upwork as normal - the extension captures jobs you see
4. Visit `http://localhost:8787` to view the dashboard

## Development

### Running Locally

```bash
bun run dev           # Start development server
bun run build:client  # Build frontend assets
bun run build         # Full build (client + backend)
```

The server includes hot reloading for both backend and frontend assets.

### Building for Production

```bash
bun run build
```

Outputs:
- Frontend assets in `dist/client/`
- Backend in `dist/index.js`

## Deployment

### Cloudflare Workers

This project is configured for Cloudflare Workers deployment.

1. Install Wrangler
```bash
npm install -g wrangler
```

2. Configure `wrangler.toml` with your Supabase credentials

3. Deploy
```bash
bun run deploy
```

### Self-Hosted

You can run the built server on any Node/Bun-compatible host:

```bash
bun dist/index.js
```

Set environment variables:
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_KEY` (optional)
- `INGEST_API_KEY` (optional, for extension auth)

## Bulk Import

To import historical Upwork job data:

```bash
bun run scripts/import.ts < jobs.jsonl
```

Expects JSONL format (one RawUpworkJob per line).

## Database Schema

**jobs** - Job listings with budget, tier, client info, skill tags
**skills** - Unique skill tags with job counts
**job_skills** - Many-to-many relationship between jobs and skills
**user_profile** - Your profile: skills, rate, tier preferences, budget minimums
**daily_stats** - Daily aggregate statistics for trend charts
**job_snapshots** - Time-series snapshots of proposal counts per job (tracks competition)

See `scripts/migration.sql` for full schema with indexes and triggers.

## Privacy

This is a personal, single-user project. Only you can add data via the browser extension (authenticated by your Supabase key). The dashboard is publicly readable by default, but you can:

- Enable RLS policies in Supabase to restrict read access
- Run on a private network or behind authentication
- Use the `INGEST_API_KEY` environment variable to restrict write access to the extension

The browser extension does not send data to any third-party servers—only to your own Supabase instance.

## License

MIT

---

Made with focus on clean data and better freelance market insights.
