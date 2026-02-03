<script lang="ts">
  import { link } from 'svelte-spa-router';
  import { api } from '../lib/api';
  import { formatProposals, formatBudget, tierColor, scoreColor, formatDate } from '../lib/format';
  import TierBadge from '../components/TierBadge.svelte';
  import SkillTag from '../components/SkillTag.svelte';
  import Pagination from '../components/Pagination.svelte';
  import UiSelect from '../components/ui/UiSelect.svelte';
  import UiCombobox from '../components/ui/UiCombobox.svelte';
  import { ScrollArea } from "bits-ui";
  import UiTooltip from '../components/ui/UiTooltip.svelte';

  let currentPage = $state(1);
  let currentSort = $state('created_on');
  let currentOrder = $state('desc');
  let currentLimit = $state('20');
  let search = $state('');
  let filterTier = $state('');
  let filterType = $state('');
  let filterCountry = $state('');

  let jobs = $state<any[]>([]);
  let pagination = $state({ page: 1, pages: 1, total: 0 });
  let countries = $state<{ country: string; count: number }[]>([]);
  let searchTimer: any;

  function debounceSearch(val: string) {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(() => {
      search = val;
      currentPage = 1;
      loadJobs();
    }, 300);
  }

  async function loadJobs() {
    const params: Record<string, string> = {
      page: String(currentPage),
      limit: currentLimit,
      sort: currentSort,
      order: currentOrder,
    };
    if (search) params.q = search;
    if (filterTier) params.tier = filterTier;
    if (filterType) params.job_type = filterType;
    if (filterCountry) params.country = filterCountry;

    const data = await api.getJobs(params);
    jobs = data.jobs;
    pagination = data.pagination;
  }

  async function loadCountries() {
    const data = await api.getOverview();
    countries = data.top_countries || [];
  }

  function handleSort(col: string) {
    if (currentSort === col) {
      currentOrder = currentOrder === 'desc' ? 'asc' : 'desc';
    } else {
      currentSort = col;
      currentOrder = col === 'title' ? 'asc' : 'desc';
    }
    currentPage = 1;
    loadJobs();
  }

  function handlePageChange(p: number) {
    currentPage = p;
    loadJobs();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // handleFilterChange removed — $effect reacts to filter/limit changes

  function sortIcon(col: string): string {
    if (currentSort !== col) return '';
    return currentOrder === 'asc' ? ' ▲' : ' ▼';
  }

  function sortClass(col: string): string {
    return currentSort === col ? 'text-blue-400' : '';
  }

  function jobSkills(job: any): string[] {
    return (job.job_skills || []).map((js: any) => js.skills?.label).filter(Boolean).slice(0, 3);
  }

  function jobDesc(job: any): string {
    if (!job.description) return '';
    return job.description.slice(0, 120) + (job.description.length > 120 ? '...' : '');
  }

  function clientScore(job: any): { text: string; color: string } {
    const score = job.client_quality_score ? parseFloat(job.client_quality_score).toFixed(1) : '-';
    return { text: `${score}/10`, color: scoreColor(parseFloat(score)) };
  }

  let countryOptions = $derived([
    { value: "", label: "All Countries" },
    ...countries.map(c => ({ value: c.country, label: `${c.country} (${c.count})` })),
  ]);

  $effect(() => {
    // track these values to trigger reload
    filterTier; filterType; filterCountry; currentLimit;
    currentPage = 1;
    loadJobs();
  });

  const columns = [
    { key: 'title', label: 'Title' },
    { key: 'fixed_budget', label: 'Budget', width: 'w-28' },
    { key: 'tier', label: 'Tier', width: 'w-28' },
    { key: 'job_type', label: 'Type', width: 'w-24' },
    { key: 'client_country', label: 'Country', width: 'w-32' },
    { key: 'proposals_tier', label: 'Proposals', width: 'w-28' },
    { key: 'total_hired', label: 'Hiring', width: 'w-24' },
    { key: 'client_quality_score', label: 'Client', width: 'w-24' },
    { key: 'created_on', label: 'Date', width: 'w-28' },
  ];

  loadCountries();
</script>

<div>
  <div class="mb-6 flex flex-wrap gap-3 items-center">
    <input type="text" placeholder="Search jobs..."
      oninput={(e) => debounceSearch((e.target as HTMLInputElement).value)}
      class="bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:border-blue-500 w-64">
    <UiSelect
      options={[
        { value: "", label: "All Tiers" },
        { value: "expert", label: "Expert" },
        { value: "intermediate", label: "Intermediate" },
        { value: "entry", label: "Entry Level" },
      ]}
      bind:value={filterTier}
      placeholder="All Tiers"
    />
    <UiSelect
      options={[
        { value: "", label: "All Types" },
        { value: "fixed", label: "Fixed Price" },
        { value: "hourly", label: "Hourly" },
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
      options={[
        { value: "20", label: "20 per page" },
        { value: "50", label: "50 per page" },
        { value: "100", label: "100 per page" },
      ]}
      bind:value={currentLimit}
      placeholder="20 per page"
    />
    <span class="text-sm text-gray-500 ml-auto">{pagination.total} jobs found</span>
  </div>

  <div class="bg-gray-900 rounded-lg border border-gray-800 overflow-hidden">
    <ScrollArea.Root type="hover">
      <ScrollArea.Viewport class="overflow-x-auto">
      <table class="w-full text-sm text-left">
        <thead class="text-xs text-gray-400 uppercase bg-gray-800/50">
          <tr>
            {#each columns as col}
              <th class="px-4 py-3 cursor-pointer hover:text-gray-200 select-none {col.width || ''} {sortClass(col.key)}"
                onclick={() => handleSort(col.key)}>
                {col.label}<span class="sort-icon">{sortIcon(col.key)}</span>
              </th>
            {/each}
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-800">
          {#if jobs.length === 0}
            <tr><td colspan="9" class="text-center text-gray-500 py-12">No jobs found</td></tr>
          {:else}
            {#each jobs as job}
              {@const skills = jobSkills(job)}
              {@const cs = clientScore(job)}
              <tr class="hover:bg-gray-800/50 transition-colors">
                <td class="px-4 py-3">
                  <div class="flex items-center gap-2">
                    <UiTooltip text={job.title}>
                      <a href="/jobs/{job.id}" use:link class="font-medium text-gray-100 hover:text-blue-400 truncate max-w-md block transition-colors">{job.title}</a>
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
                </td>
                <td class="px-4 py-3 text-green-400 font-medium whitespace-nowrap">{formatBudget(job)}</td>
                <td class="px-4 py-3"><TierBadge tier={job.tier} /></td>
                <td class="px-4 py-3 text-gray-400 capitalize">{job.job_type}</td>
                <td class="px-4 py-3 text-gray-400">{job.client_country || '-'}</td>
                <td class="px-4 py-3 text-gray-400">{job.total_applicants ? job.total_applicants : formatProposals(job.proposals_tier)}</td>
                <td class="px-4 py-3 whitespace-nowrap">
                  {#if job.total_hired > 0}
                    <span class="text-orange-400">{job.total_hired} hired</span>
                  {:else if job.job_status === 'CLOSED'}
                    <span class="text-red-400">Closed</span>
                  {:else}
                    <span class="text-green-400/60">Open</span>
                  {/if}
                </td>
                <td class="px-4 py-3 {cs.color} font-medium">{cs.text}</td>
                <td class="px-4 py-3 text-gray-400 whitespace-nowrap">{formatDate(job.created_on)}</td>
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

  <Pagination page={pagination.page} total={pagination.total} perPage={parseInt(currentLimit)} onPageChange={handlePageChange} />
</div>
