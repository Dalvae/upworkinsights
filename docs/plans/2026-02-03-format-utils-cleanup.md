# Format Utils Cleanup Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Eliminate all inline formatting logic from Svelte templates by centralizing it in `format.ts`, keeping templates clean and DRY.

**Architecture:** Add new formatting functions to `client/src/lib/format.ts`, then replace every inline `parseFloat`, `toFixed`, `toLocaleString`, `new Date().toLocale*()` call in templates with the corresponding function. No new files needed — just expand the existing module and update imports.

**Tech Stack:** TypeScript, Svelte 5

---

### Inventory of Inline Formatting to Kill

| Location | Inline Code | Replacement |
|---|---|---|
| `JobDetail.svelte:24` | `parseFloat(job.client_quality_score).toFixed(1)` | `formatScore(val, max)` |
| `JobDetail.svelte:161` | `(parseFloat(job.client_total_spent) \|\| 0).toLocaleString()` | `formatMoney(val)` |
| `JobDetail.svelte:164` | `parseFloat(job.client_total_feedback).toFixed(1)` + ternary | `formatScore(val, max)` |
| `JobDetail.svelte:117` | `new Date(job.created_on).toLocaleDateString()` | `formatDate(val)` (already exists!) |
| `JobDetail.svelte:182` | `new Date(job.first_seen_at).toLocaleString()` | `formatDateTime(val)` |
| `JobDetail.svelte:183` | `new Date(job.last_seen_at).toLocaleString()` | `formatDateTime(val)` |
| `JobDetail.svelte:208` | `new Date(job.last_buyer_activity).toLocaleDateString()` | `formatDate(val)` |
| `Jobs.svelte:94-96` | `parseFloat(job.client_quality_score).toFixed(1)` in `clientScore()` | `formatScore(val, max)` |
| `Dashboard.svelte:31` | `data.avg_fixed_budget.toLocaleString()` | `formatMoney(val)` |
| `Dashboard.svelte:38` | `${d.getMonth() + 1}/${d.getDate()}` | `formatDateShort(val)` (already exists!) |
| `JobDetail.svelte:53` | `${d.getMonth()+1}/${d.getDate()} ${d.getHours()}:${...}` | `formatDateTimeShort(val)` |

---

### Task 1: Add New Format Functions to `format.ts`

**Files:**
- Modify: `client/src/lib/format.ts`

**Step 1: Add `formatScore` function**

```typescript
export function formatScore(value: string | number | null, max: number = 10): string {
  if (!value) return `-/${max}`;
  return `${parseFloat(String(value)).toFixed(1)}/${max}`;
}
```

**Step 2: Add `formatMoney` function**

```typescript
export function formatMoney(value: string | number | null): string {
  if (!value) return '$0';
  return `$${(parseFloat(String(value)) || 0).toLocaleString()}`;
}
```

**Step 3: Add `formatDateTime` function (full datetime with time)**

```typescript
export function formatDateTime(dateStr: string | null): string {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleString();
}
```

**Step 4: Add `formatDateTimeShort` function (M/D H:MM for chart labels)**

```typescript
export function formatDateTimeShort(dateStr: string): string {
  const d = new Date(dateStr);
  return `${d.getMonth() + 1}/${d.getDate()} ${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`;
}
```

**Step 5: Update `formatDate` to handle nulls consistently**

Change existing `formatDate` to:
```typescript
export function formatDate(dateStr: string | null): string {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleDateString();
}
```

And `formatDateShort`:
```typescript
export function formatDateShort(dateStr: string | null): string {
  if (!dateStr) return '-';
  const d = new Date(dateStr);
  return `${d.getMonth() + 1}/${d.getDate()}`;
}
```

**Step 6: Commit**

```bash
git add client/src/lib/format.ts
git commit -m "feat: add formatScore, formatMoney, formatDateTime, formatDateTimeShort to format utils"
```

---

### Task 2: Clean Up `JobDetail.svelte`

**Files:**
- Modify: `client/src/pages/JobDetail.svelte:1-6` (imports)
- Modify: `client/src/pages/JobDetail.svelte:24-25` (score derived)
- Modify: `client/src/pages/JobDetail.svelte:117` (created_on date)
- Modify: `client/src/pages/JobDetail.svelte:144` (score display)
- Modify: `client/src/pages/JobDetail.svelte:161` (total spent)
- Modify: `client/src/pages/JobDetail.svelte:164` (feedback)
- Modify: `client/src/pages/JobDetail.svelte:182-183` (first/last seen)
- Modify: `client/src/pages/JobDetail.svelte:208` (last buyer activity)
- Modify: `client/src/pages/JobDetail.svelte:51-53` (history date label)

**Step 1: Update imports**

Add `formatScore`, `formatMoney`, `formatDateTime`, `formatDate`, `formatDateTimeShort` to the import from `'../lib/format'`.

**Step 2: Simplify score derived variables (lines 24-25)**

Replace:
```typescript
let score = $derived(job?.client_quality_score ? parseFloat(job.client_quality_score).toFixed(1) : '-');
let scColor = $derived(scoreColor(parseFloat(score)));
```
With:
```typescript
let score = $derived(formatScore(job?.client_quality_score, 10));
let scColor = $derived(scoreColor(parseFloat(String(job?.client_quality_score)) || 0));
```

**Step 3: Replace created_on inline date (line 117)**

Replace:
```svelte
{new Date(job.created_on).toLocaleDateString()}
```
With:
```svelte
{formatDate(job.created_on)}
```

**Step 4: Replace total_spent inline formatting (line 161)**

Replace:
```svelte
<span class="text-gray-200">${(parseFloat(job.client_total_spent) || 0).toLocaleString()}</span>
```
With:
```svelte
<span class="text-gray-200">{formatMoney(job.client_total_spent)}</span>
```

**Step 5: Replace feedback inline formatting (line 164)**

Replace:
```svelte
<span class="text-gray-200">{job.client_total_feedback ? parseFloat(job.client_total_feedback).toFixed(1) : '-'}/5</span>
```
With:
```svelte
<span class="text-gray-200">{formatScore(job.client_total_feedback, 5)}</span>
```

**Step 6: Replace first_seen_at / last_seen_at (lines 182-183)**

Replace:
```svelte
{job.first_seen_at ? new Date(job.first_seen_at).toLocaleString() : '-'}
```
With:
```svelte
{formatDateTime(job.first_seen_at)}
```

Same for `last_seen_at`.

**Step 7: Replace last_buyer_activity (line 208)**

Replace:
```svelte
{new Date(job.last_buyer_activity).toLocaleDateString()}
```
With:
```svelte
{formatDate(job.last_buyer_activity)}
```

**Step 8: Replace history date label formatting (lines 51-53)**

Replace:
```typescript
historyLabels = snapshots.map((s: any) => {
  const d = new Date(s.snapshot_at);
  return `${d.getMonth() + 1}/${d.getDate()} ${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`;
});
```
With:
```typescript
historyLabels = snapshots.map((s: any) => formatDateTimeShort(s.snapshot_at));
```

**Step 9: Verify the app still renders correctly**

```bash
cd /home/diego/projects/upworkinsights && npx vite build
```
Expected: Build succeeds with no errors.

**Step 10: Commit**

```bash
git add client/src/pages/JobDetail.svelte
git commit -m "refactor: replace inline formatting in JobDetail with format utils"
```

---

### Task 3: Clean Up `Jobs.svelte`

**Files:**
- Modify: `client/src/pages/Jobs.svelte:4` (imports)
- Modify: `client/src/pages/Jobs.svelte:94-96` (`clientScore` function)

**Step 1: Update imports**

Add `formatScore` to the import line.

**Step 2: Simplify `clientScore` function (lines 94-97)**

Replace:
```typescript
function clientScore(job: any): { text: string; color: string } {
  const score = job.client_quality_score ? parseFloat(job.client_quality_score).toFixed(1) : '-';
  return { text: `${score}/10`, color: scoreColor(parseFloat(score)) };
}
```
With:
```typescript
function clientScore(job: any): { text: string; color: string } {
  return {
    text: formatScore(job.client_quality_score, 10),
    color: scoreColor(parseFloat(String(job.client_quality_score)) || 0),
  };
}
```

**Step 3: Verify build**

```bash
cd /home/diego/projects/upworkinsights && npx vite build
```

**Step 4: Commit**

```bash
git add client/src/pages/Jobs.svelte
git commit -m "refactor: replace inline formatting in Jobs with format utils"
```

---

### Task 4: Clean Up `Dashboard.svelte`

**Files:**
- Modify: `client/src/pages/Dashboard.svelte:2` (imports)
- Modify: `client/src/pages/Dashboard.svelte:31` (budget formatting)
- Modify: `client/src/pages/Dashboard.svelte:36-39` (trend date labels)

**Step 1: Add import**

```typescript
import { formatMoney, formatDateShort } from '../lib/format';
```

**Step 2: Replace budget formatting (line 31)**

Replace:
```typescript
budget: `$${data.avg_fixed_budget.toLocaleString()}`,
```
With:
```typescript
budget: formatMoney(data.avg_fixed_budget),
```

**Step 3: Replace trend date labels (lines 36-39)**

Replace:
```typescript
trendLabels = trends.trends.map((t: any) => {
  const d = new Date(t.date);
  return `${d.getMonth() + 1}/${d.getDate()}`;
});
```
With:
```typescript
trendLabels = trends.trends.map((t: any) => formatDateShort(t.date));
```

**Step 4: Verify build**

```bash
cd /home/diego/projects/upworkinsights && npx vite build
```

**Step 5: Commit**

```bash
git add client/src/pages/Dashboard.svelte
git commit -m "refactor: replace inline formatting in Dashboard with format utils"
```

---

### Task 5: Final Verification

**Step 1: Full build check**

```bash
cd /home/diego/projects/upworkinsights && npx vite build
```

**Step 2: Grep for remaining inline formatting patterns**

```bash
grep -rn 'parseFloat\|toFixed\|toLocaleString\|new Date.*toLocale' client/src/pages/ client/src/components/
```

Expected: No hits in templates (only in `format.ts`).

**Step 3: Squash or leave commits as-is based on preference**
