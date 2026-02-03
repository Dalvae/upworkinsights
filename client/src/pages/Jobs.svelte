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
  import { formatProposals, formatBudget, scoreColor, formatDate, formatScore } from '../lib/format';
  import TierBadge from '../components/TierBadge.svelte';
  import SkillTag from '../components/SkillTag.svelte';
  import Pagination from '../components/Pagination.svelte';
  import ColumnToggle from '../components/ColumnToggle.svelte';
  import TableSkeleton from '../components/TableSkeleton.svelte';
  import UiSelect from '../components/ui/UiSelect.svelte';
  import UiCombobox from '../components/ui/UiCombobox.svelte';
  import UiTooltip from '../components/ui/UiTooltip.svelte';
  import { untrack } from 'svelte';
  import { ScrollArea } from 'bits-ui';

  // --- Filter state ---
  let search = $state('');
  let filterTier = $state('');
  let filterType = $state('');
  let filterCountry = $state('');
  let searchTimer: any;
  $effect(() => {
    return () => clearTimeout(searchTimer);
  });

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
    },
    {
      id: 'fixed_budget',
      header: 'Budget',
      accessorFn: (row) => formatBudget(row),
    },
    {
      accessorKey: 'tier',
      header: 'Tier',
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
    const data = await api.getCountries();
    countries = data.countries || [];
  }

  let countryOptions = $derived([
    { value: '', label: 'All Countries' },
    ...countries.map((c) => ({ value: c.country, label: `${c.country} (${c.count})` })),
  ]);

  // React to filter changes
  $effect(() => {
    filterTier; filterType; filterCountry;
    untrack(() => {
      pagination = { ...pagination, pageIndex: 0 };
      loadJobs();
    });
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
    untrack(() => {
      if (newSize !== pagination.pageSize) {
        pagination = { pageIndex: 0, pageSize: newSize };
        loadJobs();
      }
    });
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
