# Performance Optimization Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Optimize frontend and backend performance across bundle size, network efficiency, rendering, and database queries.

**Architecture:** Tree-shake Chart.js, update charts in-place instead of destroying/recreating, add client-side API cache with TTL, add route-level code splitting, add Cache-Control headers, add missing DB indexes, and optimize remaining query patterns.

**Tech Stack:** Svelte 5, Chart.js 4, Vite 7, svelte-spa-router, Hono, Supabase/PostgreSQL

---

### Task 1: Tree-shake Chart.js (reduce bundle ~30-40%)

**Files:**
- Modify: `client/src/main.ts`
- Modify: `client/src/lib/charts.ts`

**Step 1: Replace `chart.js/auto` with explicit imports in `client/src/lib/charts.ts`**

Replace the import at line 1:

```typescript
import {
  Chart,
  BarController,
  LineController,
  DoughnutController,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';

Chart.register(
  BarController, LineController, DoughnutController,
  CategoryScale, LinearScale,
  BarElement, LineElement, PointElement, ArcElement,
  Tooltip, Legend, Filler,
);
```

**Step 2: Update `client/src/main.ts`**

Replace line 2 `import { Chart } from 'chart.js/auto'` with:

```typescript
import { Chart } from 'chart.js';
```

The registration is now handled in `charts.ts` which is imported by the chart components.

**Step 3: Update chart component type imports**

In `BarChart.svelte`, `LineChart.svelte`, `DoughnutChart.svelte`, change:
```typescript
import type { Chart } from 'chart.js/auto';
```
to:
```typescript
import type { Chart } from 'chart.js';
```

**Step 4: Build and verify**

Run: `npx vite build`
Compare output chunk sizes vs before.

**Step 5: Commit**

```bash
git add client/src/main.ts client/src/lib/charts.ts client/src/components/BarChart.svelte client/src/components/LineChart.svelte client/src/components/DoughnutChart.svelte
git commit -m "perf: tree-shake Chart.js - import only bar, line, doughnut modules"
```

---

### Task 2: Update charts in-place instead of destroy/recreate

**Files:**
- Modify: `client/src/components/BarChart.svelte`
- Modify: `client/src/components/LineChart.svelte`
- Modify: `client/src/components/DoughnutChart.svelte`
- Modify: `client/src/lib/charts.ts` (add update helpers)

**Step 1: Add update functions to `client/src/lib/charts.ts`**

After each `create*Chart` function, add a corresponding update function:

```typescript
export function updateBarChart(
  chart: Chart,
  labels: string[],
  data: number[],
): void {
  chart.data.labels = labels;
  chart.data.datasets[0].data = data;
  chart.update();
}

export function updateDoughnutChart(
  chart: Chart,
  labels: string[],
  data: number[],
): void {
  chart.data.labels = labels;
  chart.data.datasets[0].data = data;
  chart.update();
}

export function updateLineChart(
  chart: Chart,
  labels: string[],
  datasets: { label: string; data: number[]; color: string }[],
): void {
  chart.data.labels = labels;
  chart.data.datasets = datasets.map((ds) => ({
    label: ds.label,
    data: ds.data,
    borderColor: ds.color,
    backgroundColor: ds.color.replace(/[\d.]+\)$/g, '0.1)'),
    tension: 0.3,
    fill: true,
    pointRadius: 2,
  }));
  chart.update();
}
```

**Step 2: Rewrite `BarChart.svelte` to update in-place**

```svelte
<script lang="ts">
  import type { Chart } from 'chart.js';
  import { createBarChart, updateBarChart } from '../lib/charts';
  import { untrack } from 'svelte';

  let {
    labels,
    data,
    color = 'rgba(59, 130, 246, 0.8)',
    horizontal = false,
    label = 'Data',
  }: {
    labels: string[];
    data: number[];
    color?: string;
    horizontal?: boolean;
    label?: string;
  } = $props();

  let canvas: HTMLCanvasElement;
  let chart: Chart | undefined;

  $effect(() => {
    const l = $state.snapshot(labels) as string[];
    const d = $state.snapshot(data) as number[];

    if (!canvas || l.length === 0) return;

    untrack(() => {
      if (chart) {
        updateBarChart(chart, l, d);
      } else {
        chart = createBarChart(canvas, l, d, { color, horizontal, label });
      }
    });

    return () => {
      chart?.destroy();
      chart = undefined;
    };
  });
</script>

<canvas bind:this={canvas}></canvas>
```

**Step 3: Same pattern for `LineChart.svelte`**

```svelte
<script lang="ts">
  import type { Chart } from 'chart.js';
  import { createLineChart, updateLineChart } from '../lib/charts';
  import { untrack } from 'svelte';

  let {
    labels,
    datasets,
  }: {
    labels: string[];
    datasets: { label: string; data: number[]; color: string }[];
  } = $props();

  let canvas: HTMLCanvasElement;
  let chart: Chart | undefined;

  $effect(() => {
    const l = $state.snapshot(labels) as string[];
    const d = $state.snapshot(datasets) as { label: string; data: number[]; color: string }[];

    if (!canvas || l.length === 0) return;

    untrack(() => {
      if (chart) {
        updateLineChart(chart, l, d);
      } else {
        chart = createLineChart(canvas, l, d);
      }
    });

    return () => {
      chart?.destroy();
      chart = undefined;
    };
  });
</script>

<canvas bind:this={canvas}></canvas>
```

**Step 4: Same pattern for `DoughnutChart.svelte`**

```svelte
<script lang="ts">
  import type { Chart } from 'chart.js';
  import { createDoughnutChart, updateDoughnutChart } from '../lib/charts';
  import { untrack } from 'svelte';

  let {
    labels,
    data,
    colors,
  }: {
    labels: string[];
    data: number[];
    colors?: string[];
  } = $props();

  let canvas: HTMLCanvasElement;
  let chart: Chart | undefined;

  $effect(() => {
    const l = $state.snapshot(labels) as string[];
    const d = $state.snapshot(data) as number[];

    if (!canvas || l.length === 0) return;

    untrack(() => {
      if (chart) {
        updateDoughnutChart(chart, l, d);
      } else {
        const c = colors ? $state.snapshot(colors) as string[] : undefined;
        chart = createDoughnutChart(canvas, l, d, c);
      }
    });

    return () => {
      chart?.destroy();
      chart = undefined;
    };
  });
</script>

<canvas bind:this={canvas}></canvas>
```

**Step 5: Test manually** - change trendsDays on Analytics page and verify chart updates smoothly without flicker.

**Step 6: Commit**

```bash
git add client/src/lib/charts.ts client/src/components/BarChart.svelte client/src/components/LineChart.svelte client/src/components/DoughnutChart.svelte
git commit -m "perf: update Chart.js instances in-place instead of destroy/recreate"
```

---

### Task 3: Add client-side API cache with TTL

**Files:**
- Modify: `client/src/lib/api.ts`

**Step 1: Add cache layer to `fetchJSON`**

```typescript
const BASE = '';
const cache = new Map<string, { data: unknown; ts: number }>();
const CACHE_TTL = 60_000; // 1 minute

async function fetchJSON<T>(path: string, options?: RequestInit): Promise<T> {
  const method = options?.method?.toUpperCase() || 'GET';

  // Only cache GET requests
  if (method === 'GET') {
    const cached = cache.get(path);
    if (cached && Date.now() - cached.ts < CACHE_TTL) {
      return cached.data as T;
    }
  }

  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  const data = await res.json();

  if (method === 'GET') {
    cache.set(path, { data, ts: Date.now() });
  }

  return data;
}

// rest of the api object stays the same
```

**Step 2: Test** - navigate Dashboard -> Jobs -> Dashboard. Second Dashboard load should be instant (no network calls in DevTools for 60s).

**Step 3: Commit**

```bash
git add client/src/lib/api.ts
git commit -m "perf: add 60s in-memory cache for GET API responses"
```

---

### Task 4: Add route-level code splitting

**Files:**
- Modify: `client/src/router.ts`

**Step 1: Check if svelte-spa-router supports async components**

`svelte-spa-router` v4 supports `wrap()` with `asyncComponent`. Rewrite `router.ts`:

```typescript
import { wrap } from 'svelte-spa-router/wrap';

export const routes = {
  '/': wrap({ asyncComponent: () => import('./pages/Dashboard.svelte') }),
  '/jobs': wrap({ asyncComponent: () => import('./pages/Jobs.svelte') }),
  '/jobs/:id': wrap({ asyncComponent: () => import('./pages/JobDetail.svelte') }),
  '/analytics': wrap({ asyncComponent: () => import('./pages/Analytics.svelte') }),
  '/profile': wrap({ asyncComponent: () => import('./pages/Profile.svelte') }),
  '*': wrap({ asyncComponent: () => import('./pages/NotFound.svelte') }),
};
```

**Step 2: Build and verify chunks**

Run: `npx vite build`
Verify output shows separate chunks for each page.

**Step 3: Commit**

```bash
git add client/src/router.ts
git commit -m "perf: add route-level code splitting with dynamic imports"
```

---

### Task 5: Add Vite manual chunks for vendor libraries

**Files:**
- Modify: `vite.config.ts`

**Step 1: Add `manualChunks` to Vite config**

```typescript
import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [svelte(), tailwindcss()],
  root: 'client',
  build: {
    outDir: '../dist/client',
    emptyOutDir: true,
    rollupOptions: {
      output: {
        manualChunks: {
          'chart': ['chart.js'],
          'ui': ['bits-ui'],
        },
      },
    },
  },
  server: {
    proxy: { '/api': 'http://localhost:8787' },
  },
});
```

**Step 2: Build and verify** - chart.js and bits-ui should be separate chunks.

**Step 3: Commit**

```bash
git add vite.config.ts
git commit -m "perf: add manual chunk splitting for Chart.js and bits-ui"
```

---

### Task 6: Add Cache-Control headers on API responses

**Files:**
- Modify: `src/index.ts`

**Step 1: Add caching middleware for read-only analytics endpoints**

After the CORS middleware and before the routes, add:

```typescript
// Cache read-only analytics and jobs list endpoints
app.use('/api/analytics/*', async (c, next) => {
  await next();
  if (c.req.method === 'GET' && c.res.status === 200) {
    c.header('Cache-Control', 'public, max-age=60, stale-while-revalidate=300');
  }
});

app.use('/api/jobs', async (c, next) => {
  await next();
  if (c.req.method === 'GET' && c.res.status === 200) {
    c.header('Cache-Control', 'public, max-age=30, stale-while-revalidate=120');
  }
});
```

**Step 2: Commit**

```bash
git add src/index.ts
git commit -m "perf: add Cache-Control headers for analytics and jobs endpoints"
```

---

### Task 7: Fix matches endpoint SELECT * over-fetching

**Files:**
- Modify: `src/routes/analytics.ts`

**Step 1: Replace `select('*')` with specific columns in `/analytics/matches`**

Change line ~128:
```typescript
const { data: jobs } = await db
  .from('jobs')
  .select('id, title, tier, job_type, fixed_budget, hourly_min, hourly_max, client_quality_score, client_country, client_total_spent, client_payment_verified, client_total_feedback, proposals_tier, duration, engagement, job_skills(skill_uid, skills(label))')
  .order('created_on', { ascending: false })
  .limit(200);
```

This excludes `description` (potentially thousands of chars per row) which is never used in match scoring or the response.

**Step 2: Commit**

```bash
git add src/routes/analytics.ts
git commit -m "perf: select only needed columns in matches endpoint, drop description"
```

---

### Task 8: Fix Jobs page country loading (stop calling overview endpoint)

**Files:**
- Modify: `client/src/pages/Jobs.svelte`
- Modify: `src/routes/jobs.ts` (add /jobs/countries endpoint)

**Step 1: Add a lightweight `/jobs/countries` endpoint in `src/routes/jobs.ts`**

```typescript
app.get('/jobs/countries', async (c) => {
  const db = c.get('db');
  const { data } = await db.rpc('analytics_overview');
  return c.json({ countries: data?.top_countries ?? [] });
});
```

Or even better, a direct query:

```typescript
app.get('/jobs/countries', async (c) => {
  const db = c.get('db');
  const { data } = await db
    .from('jobs')
    .select('client_country')
    .not('client_country', 'is', null);

  const counts: Record<string, number> = {};
  for (const row of data ?? []) {
    const country = row.client_country as string;
    counts[country] = (counts[country] || 0) + 1;
  }

  const countries = Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 20)
    .map(([country, count]) => ({ country, count }));

  return c.json({ countries });
});
```

**Note:** With the API cache from Task 3, this becomes less critical since getOverview() results will be cached. If overview is already cached from Dashboard visit, Jobs won't make a new request. This task is optional if Task 3 is implemented.

**Step 2: Update `Jobs.svelte` loadCountries**

```typescript
async function loadCountries() {
  const data = await api.getCountries();
  countries = data.countries || [];
}
```

Add to `api.ts`:
```typescript
getCountries: () => fetchJSON<any>('/api/jobs/countries'),
```

**Step 3: Commit**

```bash
git add src/routes/jobs.ts client/src/pages/Jobs.svelte client/src/lib/api.ts
git commit -m "perf: add dedicated countries endpoint, stop over-fetching overview for country list"
```

---

### Task 9: Add missing database indexes

**Files:**
- Create: `supabase/migrations/20260203100001_performance_indexes.sql`

**Step 1: Create the migration**

```sql
-- Additional performance indexes
-- first_seen_at already added in 20260203100000

-- For sorting by fixed_budget and proposals_tier
CREATE INDEX IF NOT EXISTS idx_jobs_fixed_budget ON jobs(fixed_budget DESC NULLS LAST);
CREATE INDEX IF NOT EXISTS idx_jobs_proposals_tier ON jobs(proposals_tier);

-- For ILIKE text search (pg_trgm extension required)
-- Uncomment if pg_trgm is available:
-- CREATE EXTENSION IF NOT EXISTS pg_trgm;
-- CREATE INDEX IF NOT EXISTS idx_jobs_title_trgm ON jobs USING gin(title gin_trgm_ops);
-- CREATE INDEX IF NOT EXISTS idx_jobs_description_trgm ON jobs USING gin(description gin_trgm_ops);
```

**Step 2: Apply migration**

Run in Supabase SQL Editor or: `supabase db push`

**Step 3: Commit**

```bash
git add supabase/migrations/20260203100001_performance_indexes.sql
git commit -m "perf: add missing indexes for sort columns and text search"
```

---

### Task 10: Clean up debounce timer and unused dependency

**Files:**
- Modify: `client/src/pages/Jobs.svelte`
- Modify: `package.json` (only if @tanstack/table-core is genuinely unused)

**Step 1: Clean up debounce timer in Jobs.svelte**

The debounce timer reference should be cleared on component teardown. Since Jobs.svelte now uses TanStack Table (which imports from `@tanstack/table-core`), that dependency is NOT unused - skip removal.

Add cleanup with `onDestroy` or an `$effect` return. Since the `$effect` for filter changes already exists, add a top-level effect for cleanup:

After `let searchTimer: any;` add:

```typescript
$effect(() => {
  return () => clearTimeout(searchTimer);
});
```

**Step 2: Commit**

```bash
git add client/src/pages/Jobs.svelte
git commit -m "fix: clean up debounce timer on Jobs component destroy"
```

---

### Task 11: Replace Iconify web component with inline SVG

**Files:**
- Modify: `client/src/components/Nav.svelte`

**Step 1: Replace the iconify-icon tag with inline SVG**

Replace:
```html
<iconify-icon icon="simple-icons:upwork" width="24" style="color: #6fda44"></iconify-icon>
```

With the actual Upwork SVG (from Simple Icons):
```html
<svg width="24" height="24" viewBox="0 0 24 24" fill="#6fda44">
  <path d="M18.561 13.158c-1.102 0-2.135-.467-3.074-1.227l.228-1.076.008-.042c.207-1.143.849-3.06 2.839-3.06 1.492 0 2.703 1.212 2.703 2.703-.001 1.489-1.212 2.702-2.704 2.702zm0-8.14c-2.539 0-4.51 1.649-5.31 4.366-1.22-1.834-2.148-4.036-2.687-5.892H7.828v7.112c-.002 1.406-1.141 2.546-2.547 2.546-1.405 0-2.543-1.14-2.543-2.546V3.492H0v7.112c0 2.914 2.37 5.303 5.281 5.303 2.913 0 5.283-2.389 5.283-5.303v-1.19c.529 1.107 1.182 2.229 1.974 3.221l-1.673 7.873h2.797l1.213-5.71c1.063.679 2.285 1.109 3.686 1.109 3 0 5.439-2.452 5.439-5.45 0-3-2.439-5.439-5.439-5.439z"/>
</svg>
```

**Step 2: Commit**

```bash
git add client/src/components/Nav.svelte
git commit -m "perf: replace Iconify web component with inline SVG"
```

---

## Summary

| Task | Issue | Impact |
|------|-------|--------|
| 1 | Tree-shake Chart.js | -30-40KB gzipped |
| 2 | Update charts in-place | No jank on data change |
| 3 | API response cache | Instant navigation between pages |
| 4 | Route code splitting | Smaller initial bundle |
| 5 | Vendor chunk splitting | Better browser caching |
| 6 | Cache-Control headers | Browser & CDN caching |
| 7 | Matches SELECT columns | Smaller API payloads |
| 8 | Dedicated countries endpoint | No over-fetching on Jobs page |
| 9 | Database indexes | Faster sort & search queries |
| 10 | Debounce cleanup | Prevent stale callbacks |
| 11 | Inline SVG | Remove CDN dependency |
