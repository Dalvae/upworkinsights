# TanStack Table Jobs Page Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace the hand-rolled jobs table with TanStack Table, adding skeleton loading, column visibility toggle, improved pagination, and proper Svelte 5 reactivity.

**Architecture:** Server-side pagination/sorting/filtering stays as-is (the Hono API already supports it). TanStack Table runs in "manual" mode — it manages column visibility, header rendering, and sort UI state, but delegates actual data fetching to the existing API. A thin Svelte 5 adapter (`createSvelteTable` + `FlexRender`) bridges `@tanstack/table-core` with runes.

**Tech Stack:** `@tanstack/table-core`, Svelte 5 runes, bits-ui (Pagination, Select, Combobox, Tooltip, Checkbox), TailwindCSS

---

## Task 1: Install `@tanstack/table-core`

**Files:**
- Modify: `package.json`

**Step 1: Install the dependency**

Run:
```bash
cd /home/diego/projects/upworkinsights && bun add @tanstack/table-core
```

**Step 2: Verify install**

Run:
```bash
cd /home/diego/projects/upworkinsights && bun run --bun -e "import { createTable } from '@tanstack/table-core'; console.log('OK')"
```
Expected: `OK`

**Step 3: Commit**

```bash
git add package.json bun.lock
git commit -m "chore: add @tanstack/table-core dependency"
```

---

## Task 2: Create Svelte 5 TanStack Table adapter

The official `@tanstack/svelte-table` uses Svelte 4 writable stores. We need a thin adapter for Svelte 5 runes. This follows the same pattern as shadcn-svelte's data-table helpers.

**Files:**
- Create: `client/src/lib/table/createSvelteTable.svelte.ts`
- Create: `client/src/lib/table/FlexRender.svelte`
- Create: `client/src/lib/table/index.ts`

**Step 1: Create the `createSvelteTable` function**

File: `client/src/lib/table/createSvelteTable.svelte.ts`

```typescript
import {
  createTable,
  type RowData,
  type TableOptions,
  type TableOptionsResolved,
} from "@tanstack/table-core";

export function createSvelteTable<TData extends RowData>(
  options: TableOptions<TData>
) {
  const resolvedOptions: TableOptionsResolved<TData> = mergeOptions(options);

  const table = createTable(resolvedOptions);
  let state = $state(table.initialState);

  function mergeOptions(opts: TableOptions<TData>): TableOptionsResolved<TData> {
    return {
      ...opts,
      state: {
        ...state,
        ...opts.state,
      },
      onStateChange: (updater: any) => {
        if (typeof updater === "function") {
          state = updater(state);
        } else {
          state = updater;
        }
        options.onStateChange?.(updater);
      },
      renderFallbackValue: opts.renderFallbackValue ?? null,
    } as TableOptionsResolved<TData>;
  }

  function setOptions() {
    table.setOptions((prev) => mergeOptions({ ...prev, ...options }));
  }

  $effect.pre(() => {
    setOptions();
  });

  return table;
}
```

**Step 2: Create the `FlexRender` component**

File: `client/src/lib/table/FlexRender.svelte`

```svelte
<script lang="ts" generics="TProps extends Record<string, any>">
  import { type Snippet } from "svelte";
  import type { CellContext, HeaderContext } from "@tanstack/table-core";

  let {
    content,
    context,
  }: {
    content:
      | string
      | ((ctx: any) => any)
      | Snippet<[any]>
      | undefined;
    context: HeaderContext<any, any> | CellContext<any, any>;
  } = $props();
</script>

{#if typeof content === "string"}
  {content}
{:else if typeof content === "function"}
  {@const result = content(context)}
  {#if typeof result === "string"}
    {result}
  {:else}
    {result}
  {/if}
{/if}
```

**Step 3: Create barrel export**

File: `client/src/lib/table/index.ts`

```typescript
export { createSvelteTable } from "./createSvelteTable.svelte.js";
export { default as FlexRender } from "./FlexRender.svelte";
```

**Step 4: Verify it compiles**

Run:
```bash
cd /home/diego/projects/upworkinsights && bun run build 2>&1 | head -20
```
Expected: No errors related to `table/` files.

**Step 5: Commit**

```bash
git add client/src/lib/table/
git commit -m "feat: add Svelte 5 adapter for TanStack Table"
```

---

## Task 3: Create Skeleton Table component

**Files:**
- Create: `client/src/components/TableSkeleton.svelte`

**Step 1: Create the skeleton component**

File: `client/src/components/TableSkeleton.svelte`

```svelte
<script lang="ts">
  let {
    rows = 10,
    columns = 8,
  }: {
    rows?: number;
    columns?: number;
  } = $props();
</script>

<div class="bg-gray-900 rounded-lg border border-gray-800 overflow-hidden animate-pulse">
  <table class="w-full text-sm text-left">
    <thead class="bg-gray-800/50">
      <tr>
        {#each Array(columns) as _, i}
          <th class="px-4 py-3">
            <div class="h-3 bg-gray-700 rounded w-16"></div>
          </th>
        {/each}
      </tr>
    </thead>
    <tbody class="divide-y divide-gray-800">
      {#each Array(rows) as _, r}
        <tr>
          {#each Array(columns) as _, c}
            <td class="px-4 py-3">
              {#if c === 0}
                <div class="space-y-1.5">
                  <div class="h-4 bg-gray-800 rounded w-48"></div>
                  <div class="h-3 bg-gray-800/60 rounded w-64"></div>
                  <div class="flex gap-1">
                    <div class="h-4 bg-gray-800 rounded w-12"></div>
                    <div class="h-4 bg-gray-800 rounded w-14"></div>
                  </div>
                </div>
              {:else}
                <div class="h-4 bg-gray-800 rounded w-14"></div>
              {/if}
            </td>
          {/each}
        </tr>
      {/each}
    </tbody>
  </table>
</div>
```

**Step 2: Commit**

```bash
git add client/src/components/TableSkeleton.svelte
git commit -m "feat: add skeleton loading component for jobs table"
```

---

## Task 4: Create ColumnToggle dropdown component

A dropdown that lets the user toggle column visibility, using bits-ui's existing components.

**Files:**
- Create: `client/src/components/ColumnToggle.svelte`

**Step 1: Create the component**

File: `client/src/components/ColumnToggle.svelte`

```svelte
<script lang="ts">
  import type { Table, RowData } from "@tanstack/table-core";
  import { Popover } from "bits-ui";
  import UiCheckbox from "./ui/UiCheckbox.svelte";

  let {
    table,
  }: {
    table: Table<any>;
  } = $props();
</script>

<Popover.Root>
  <Popover.Trigger
    class="bg-gray-800 border border-gray-700 rounded-lg px-3 py-1.5 text-sm text-gray-300
           hover:border-gray-600 hover:text-gray-100 focus:outline-none focus:border-blue-500
           flex items-center gap-2 cursor-pointer"
  >
    <svg class="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
      <path stroke-linecap="round" stroke-linejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 1 1-3 0m3 0a1.5 1.5 0 1 0-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-9.75 0h9.75" />
    </svg>
    Columns
  </Popover.Trigger>
  <Popover.Content
    class="bg-gray-800 border border-gray-700 rounded-lg shadow-xl z-50 p-3 space-y-2 min-w-[160px]"
    sideOffset={4}
    align="end"
  >
    {#each table.getAllLeafColumns().filter((col) => col.getCanHide()) as column (column.id)}
      <UiCheckbox
        label={typeof column.columnDef.header === "string" ? column.columnDef.header : column.id}
        checked={column.getIsVisible()}
        onCheckedChange={(v) => column.toggleVisibility(!!v)}
      />
    {/each}
  </Popover.Content>
</Popover.Root>
```

**Step 2: Verify bits-ui has Popover**

Check if `Popover` is available in bits-ui. If not, use a simple `div` toggle with `$state` boolean instead. The component above should work since bits-ui v2.15+ includes Popover.

**Step 3: Commit**

```bash
git add client/src/components/ColumnToggle.svelte
git commit -m "feat: add column visibility toggle dropdown"
```

---

## Task 5: Rewrite Jobs.svelte with TanStack Table

This is the main task. Replace the hand-rolled table with TanStack Table in manual (server-side) mode.

**Files:**
- Modify: `client/src/pages/Jobs.svelte`

**Key design decisions:**
- `manualPagination: true` and `manualSorting: true` — TanStack doesn't sort/paginate data, the API does
- Column definitions use existing format utils and sub-components (TierBadge, SkillTag, etc.)
- Loading state shows TableSkeleton
- Column visibility state persisted in TanStack Table

**Step 1: Rewrite Jobs.svelte**

Replace the entire file with:

```svelte
<script lang="ts">
  import { link } from 'svelte-spa-router';
  import {
    type ColumnDef,
    type SortingState,
    type VisibilityState,
    type PaginationState,
    getCoreRowModel,
  } from '@tanstack/table-core';
  import { createSvelteTable, FlexRender } from '../lib/table';
  import { api } from '../lib/api';
  import { formatProposals, formatBudget, tierColor, scoreColor, formatDate, formatScore } from '../lib/format';
  import TierBadge from '../components/TierBadge.svelte';
  import SkillTag from '../components/SkillTag.svelte';
  import Pagination from '../components/Pagination.svelte';
  import ColumnToggle from '../components/ColumnToggle.svelte';
  import TableSkeleton from '../components/TableSkeleton.svelte';
  import UiSelect from '../components/ui/UiSelect.svelte';
  import UiCombobox from '../components/ui/UiCombobox.svelte';
  import UiTooltip from '../components/ui/UiTooltip.svelte';
  import { ScrollArea } from 'bits-ui';

  // --- Filter state ---
  let search = $state('');
  let filterTier = $state('');
  let filterType = $state('');
  let filterCountry = $state('');
  let searchTimer: any;

  // --- Data state ---
  let jobs = $state<any[]>([]);
  let totalRows = $state(0);
  let loading = $state(true);
  let countries = $state<{ country: string; count: number }[]>([]);

  // --- TanStack Table state ---
  let sorting = $state<SortingState>([{ id: 'created_on', desc: true }]);
  let columnVisibility = $state<VisibilityState>({});
  let pagination = $state<PaginationState>({ pageIndex: 0, pageSize: 20 });

  // --- Column definitions ---
  const columns: ColumnDef<any>[] = [
    {
      accessorKey: 'title',
      header: 'Title',
      enableHiding: false,
      cell: ({ row }) => row.original,
    },
    {
      id: 'fixed_budget',
      header: 'Budget',
      accessorFn: (row) => formatBudget(row),
    },
    {
      accessorKey: 'tier',
      header: 'Tier',
      cell: ({ row }) => row.original.tier,
    },
    {
      accessorKey: 'job_type',
      header: 'Type',
    },
    {
      accessorKey: 'client_country',
      header: 'Country',
    },
    {
      accessorKey: 'proposals_tier',
      header: 'Proposals',
      accessorFn: (row) => row.total_applicants ? row.total_applicants : formatProposals(row.proposals_tier),
    },
    {
      accessorKey: 'client_quality_score',
      header: 'Client',
      cell: ({ row }) => row.original,
    },
    {
      accessorKey: 'created_on',
      header: 'Date',
      accessorFn: (row) => formatDate(row.created_on),
    },
  ];

  // --- TanStack Table instance ---
  const table = createSvelteTable({
    get data() { return jobs; },
    columns,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    manualSorting: true,
    get pageCount() { return Math.ceil(totalRows / pagination.pageSize); },
    get rowCount() { return totalRows; },
    get state() {
      return { sorting, columnVisibility, pagination };
    },
    onSortingChange: (updater) => {
      sorting = typeof updater === 'function' ? updater(sorting) : updater;
      pagination = { ...pagination, pageIndex: 0 };
      loadJobs();
    },
    onColumnVisibilityChange: (updater) => {
      columnVisibility = typeof updater === 'function' ? updater(columnVisibility) : updater;
    },
    onPaginationChange: (updater) => {
      pagination = typeof updater === 'function' ? updater(pagination) : updater;
      loadJobs();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    },
  });

  // --- Helpers ---
  function jobSkills(job: any): string[] {
    return (job.job_skills || []).map((js: any) => js.skills?.label).filter(Boolean).slice(0, 3);
  }

  function jobDesc(job: any): string {
    if (!job.description) return '';
    return job.description.slice(0, 120) + (job.description.length > 120 ? '...' : '');
  }

  function clientScore(job: any): { text: string; color: string } {
    return {
      text: formatScore(job.client_quality_score, 10),
      color: scoreColor(parseFloat(String(job.client_quality_score)) || 0),
    };
  }

  function debounceSearch(val: string) {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(() => {
      search = val;
      pagination = { ...pagination, pageIndex: 0 };
      loadJobs();
    }, 300);
  }

  // --- Data loading ---
  async function loadJobs() {
    loading = true;
    const sortCol = sorting[0]?.id || 'created_on';
    const sortOrder = sorting[0]?.desc ? 'desc' : 'asc';

    const params: Record<string, string> = {
      page: String(pagination.pageIndex + 1),
      limit: String(pagination.pageSize),
      sort: sortCol,
      order: sortOrder,
    };
    if (search) params.q = search;
    if (filterTier) params.tier = filterTier;
    if (filterType) params.job_type = filterType;
    if (filterCountry) params.country = filterCountry;

    const data = await api.getJobs(params);
    jobs = data.jobs;
    totalRows = data.pagination.total;
    loading = false;
  }

  async function loadCountries() {
    const data = await api.getOverview();
    countries = data.top_countries || [];
  }

  let countryOptions = $derived([
    { value: '', label: 'All Countries' },
    ...countries.map((c) => ({ value: c.country, label: `${c.country} (${c.count})` })),
  ]);

  // React to filter changes
  $effect(() => {
    filterTier; filterType; filterCountry;
    pagination = { ...pagination, pageIndex: 0 };
    loadJobs();
  });

  // Page size options
  const pageSizeOptions = [
    { value: '20', label: '20 per page' },
    { value: '50', label: '50 per page' },
    { value: '100', label: '100 per page' },
  ];
  let pageSizeStr = $state('20');
  $effect(() => {
    const newSize = parseInt(pageSizeStr);
    if (newSize !== pagination.pageSize) {
      pagination = { pageIndex: 0, pageSize: newSize };
      loadJobs();
    }
  });

  loadCountries();
</script>

<div>
  <!-- Toolbar -->
  <div class="mb-6 flex flex-wrap gap-3 items-center">
    <input type="text" placeholder="Search jobs..."
      oninput={(e) => debounceSearch((e.target as HTMLInputElement).value)}
      class="bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:border-blue-500 w-64">
    <UiSelect
      options={[
        { value: '', label: 'All Tiers' },
        { value: 'expert', label: 'Expert' },
        { value: 'intermediate', label: 'Intermediate' },
        { value: 'entry', label: 'Entry Level' },
      ]}
      bind:value={filterTier}
      placeholder="All Tiers"
    />
    <UiSelect
      options={[
        { value: '', label: 'All Types' },
        { value: 'fixed', label: 'Fixed Price' },
        { value: 'hourly', label: 'Hourly' },
      ]}
      bind:value={filterType}
      placeholder="All Types"
    />
    <UiCombobox
      options={countryOptions}
      bind:value={filterCountry}
      placeholder="All Countries"
    />
    <UiSelect
      options={pageSizeOptions}
      bind:value={pageSizeStr}
      placeholder="20 per page"
    />
    <ColumnToggle {table} />
    <span class="text-sm text-gray-500 ml-auto">{totalRows} jobs found</span>
  </div>

  <!-- Table -->
  {#if loading}
    <TableSkeleton rows={pagination.pageSize > 20 ? 20 : pagination.pageSize} columns={table.getVisibleLeafColumns().length} />
  {:else}
    <div class="bg-gray-900 rounded-lg border border-gray-800 overflow-hidden">
      <ScrollArea.Root type="hover">
        <ScrollArea.Viewport class="overflow-x-auto">
          <table class="w-full text-sm text-left">
            <thead class="text-xs text-gray-400 uppercase bg-gray-800/50">
              {#each table.getHeaderGroups() as headerGroup (headerGroup.id)}
                <tr>
                  {#each headerGroup.headers as header (header.id)}
                    <th
                      class="px-4 py-3 select-none {header.column.getCanSort() ? 'cursor-pointer hover:text-gray-200' : ''} {header.column.getIsSorted() ? 'text-blue-400' : ''}"
                      onclick={header.column.getToggleSortingHandler()}
                    >
                      {#if !header.isPlaceholder}
                        {#if typeof header.column.columnDef.header === 'string'}
                          {header.column.columnDef.header}
                        {:else}
                          <FlexRender content={header.column.columnDef.header} context={header.getContext()} />
                        {/if}
                        {#if header.column.getIsSorted() === 'asc'}
                          <span class="sort-icon"> ▲</span>
                        {:else if header.column.getIsSorted() === 'desc'}
                          <span class="sort-icon"> ▼</span>
                        {/if}
                      {/if}
                    </th>
                  {/each}
                </tr>
              {/each}
            </thead>
            <tbody class="divide-y divide-gray-800">
              {#if table.getRowModel().rows.length === 0}
                <tr><td colspan={table.getVisibleLeafColumns().length} class="text-center text-gray-500 py-12">No jobs found</td></tr>
              {:else}
                {#each table.getRowModel().rows as row (row.id)}
                  {@const job = row.original}
                  {@const skills = jobSkills(job)}
                  {@const cs = clientScore(job)}
                  <tr class="hover:bg-gray-800/50 transition-colors">
                    {#each row.getVisibleCells() as cell (cell.id)}
                      <td class="px-4 py-3">
                        {#if cell.column.id === 'title'}
                          <div class="flex items-center gap-2">
                            <UiTooltip text={job.title}>
                              <a href="/jobs/{job.id}" use:link class="font-medium text-gray-100 hover:text-blue-400 truncate max-w-md min-w-0 transition-colors">{job.title}</a>
                            </UiTooltip>
                            {#if job.ciphertext}
                              <a href="https://www.upwork.com/jobs/{job.ciphertext}" target="_blank" rel="noopener" class="text-gray-600 hover:text-blue-400 shrink-0" title="View on Upwork">&#8599;</a>
                            {/if}
                          </div>
                          <p class="text-xs text-gray-500 mt-0.5 line-clamp-1 max-w-lg">{jobDesc(job)}</p>
                          <div class="flex gap-1 mt-1">
                            {#each skills as s}
                              <SkillTag label={s} />
                            {/each}
                          </div>
                        {:else if cell.column.id === 'fixed_budget'}
                          <span class="text-green-400 font-medium whitespace-nowrap">{formatBudget(job)}</span>
                        {:else if cell.column.id === 'tier'}
                          <TierBadge tier={job.tier} />
                        {:else if cell.column.id === 'job_type'}
                          <span class="text-gray-400 capitalize">{job.job_type}</span>
                        {:else if cell.column.id === 'client_country'}
                          <span class="text-gray-400">{job.client_country || '-'}</span>
                        {:else if cell.column.id === 'proposals_tier'}
                          <span class="text-gray-400">{job.total_applicants ? job.total_applicants : formatProposals(job.proposals_tier)}</span>
                        {:else if cell.column.id === 'client_quality_score'}
                          <span class="{cs.color} font-medium">{cs.text}</span>
                        {:else if cell.column.id === 'created_on'}
                          <span class="text-gray-400 whitespace-nowrap">{formatDate(job.created_on)}</span>
                        {:else}
                          <FlexRender content={cell.column.columnDef.cell} context={cell.getContext()} />
                        {/if}
                      </td>
                    {/each}
                  </tr>
                {/each}
              {/if}
            </tbody>
          </table>
        </ScrollArea.Viewport>
        <ScrollArea.Scrollbar orientation="horizontal" class="h-2 bg-gray-800 rounded">
          <ScrollArea.Thumb class="bg-gray-600 rounded" />
        </ScrollArea.Scrollbar>
      </ScrollArea.Root>
    </div>
  {/if}

  <!-- Pagination -->
  <Pagination
    page={pagination.pageIndex + 1}
    total={totalRows}
    perPage={pagination.pageSize}
    onPageChange={(p) => {
      pagination = { ...pagination, pageIndex: p - 1 };
      loadJobs();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }}
  />
</div>
```

**Step 2: Verify it builds**

Run:
```bash
cd /home/diego/projects/upworkinsights && bun run build 2>&1 | tail -20
```
Expected: Build succeeds.

**Step 3: Test manually in browser**

- Visit `http://localhost:5173/#/jobs`
- Verify: Table renders with data
- Verify: Sorting works (click column headers)
- Verify: Column visibility toggle shows/hides columns
- Verify: Pagination navigates pages
- Verify: Skeleton shows while loading
- Verify: Filters work (tier, type, country, search)

**Step 4: Commit**

```bash
git add client/src/pages/Jobs.svelte
git commit -m "feat: rewrite jobs table with TanStack Table, skeleton, column toggle"
```

---

## Task 6: Fix UiCheckbox to support external onCheckedChange

The ColumnToggle component needs `onCheckedChange` callback on UiCheckbox. Currently UiCheckbox only supports `bind:checked`. We need to add an optional callback prop.

**Files:**
- Modify: `client/src/components/ui/UiCheckbox.svelte`

**Step 1: Update UiCheckbox**

Add `onCheckedChange` prop:

```svelte
<script lang="ts">
  import { Checkbox, Label, useId } from "bits-ui";

  let {
    label,
    checked = $bindable(false),
    onCheckedChange,
  }: {
    label: string;
    checked?: boolean;
    onCheckedChange?: (checked: boolean) => void;
  } = $props();

  const id = useId();
</script>

<div class="flex items-center gap-2">
  <Checkbox.Root
    bind:checked
    {id}
    onCheckedChange={onCheckedChange}
    class="size-5 rounded border border-gray-600 bg-gray-800
           data-[checked]:bg-blue-600 data-[checked]:border-blue-600
           flex items-center justify-center cursor-pointer
           focus:outline-none focus:ring-2 focus:ring-blue-500/50"
  >
    {#snippet children({ checked: isChecked })}
      {#if isChecked}
        <svg class="size-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3">
          <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      {/if}
    {/snippet}
  </Checkbox.Root>
  <Label.Root for={id} class="text-sm text-gray-300 cursor-pointer select-none">
    {label}
  </Label.Root>
</div>
```

**Step 2: Commit**

```bash
git add client/src/components/ui/UiCheckbox.svelte
git commit -m "feat: add onCheckedChange callback to UiCheckbox"
```

---

## Task 7: Cleanup — delete old Pagination page-change workaround

The old `handlePageChange` and `handleSort` functions in Jobs.svelte are gone. Verify that the Pagination component still works correctly with the new callback pattern. No file changes expected unless bugs are found during testing.

**Step 1: Full integration test**

Run the dev server and test:
```bash
cd /home/diego/projects/upworkinsights && bun run dev
```

Test checklist:
- [ ] Table loads with skeleton, then shows data
- [ ] Click column headers to sort (▲/▼ indicator shows)
- [ ] Click "Columns" button to toggle column visibility
- [ ] Hide a column, verify it disappears from table
- [ ] Filter by tier, type, country — table reloads
- [ ] Search with debounce works
- [ ] Change page size (20/50/100)
- [ ] Pagination: next/prev, page numbers, scroll to top
- [ ] Empty state: search for gibberish, see "No jobs found"
- [ ] Job title links work (internal + Upwork external)

**Step 2: Fix any issues found**

**Step 3: Final commit**

```bash
git add -A
git commit -m "fix: integration fixes for TanStack Table jobs page"
```

---

## Task Order & Dependencies

```
Task 1 (install) → Task 2 (adapter) → Task 6 (checkbox fix) → Task 3 (skeleton) + Task 4 (column toggle) → Task 5 (rewrite Jobs.svelte) → Task 7 (integration test)
```

Tasks 3 and 4 can run in parallel after Task 2 is done.
