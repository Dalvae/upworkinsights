<script lang="ts">
  import { link } from 'svelte-spa-router';
  import { api } from '../lib/api';
  import { formatProposals, formatBudget, proposalMidpoint, tierColor, scoreColor, matchBarColor } from '../lib/format';
  import LineChart from '../components/LineChart.svelte';
  import TierBadge from '../components/TierBadge.svelte';
  import SkillTag from '../components/SkillTag.svelte';
  import Loading from '../components/Loading.svelte';

  let { params = { id: '' } }: { params?: { id: string } } = $props();

  let loading = $state(true);
  let error = $state('');
  let job = $state<any>(null);
  let historyLabels = $state<string[]>([]);
  let historyDatasets = $state<{ label: string; data: number[]; color: string }[]>([]);
  let hasHistory = $state(false);

  let skills = $derived<string[]>((job?.job_skills || []).map((js: any) => js.skills?.label).filter(Boolean));

  let budget = $derived(job ? formatBudget(job) : '');

  let score = $derived(job?.client_quality_score ? parseFloat(job.client_quality_score).toFixed(1) : '-');
  let scColor = $derived(scoreColor(parseFloat(score)));

  let matchColor = $derived(
    job?.match_score >= 70 ? 'text-green-400' : job?.match_score >= 40 ? 'text-yellow-400' : 'text-gray-400'
  );
  let matchBar = $derived(matchBarColor(job?.match_score || 0));

  async function load() {
    try {
      const [jobData, historyData] = await Promise.all([
        api.getJob(params.id),
        api.getJobHistory(params.id),
      ]);

      job = jobData;

      const snapshots = historyData.snapshots || [];
      if (snapshots.length > 1) {
        hasHistory = true;
        historyLabels = snapshots.map((s: any) => {
          const d = new Date(s.snapshot_at);
          return `${d.getMonth() + 1}/${d.getDate()} ${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`;
        });
        historyDatasets = [{
          label: 'Est. Proposals',
          data: snapshots.map((s: any) => proposalMidpoint(s.proposals_tier)),
          color: 'rgba(234, 179, 8, 0.8)',
        }];
      }

      loading = false;
    } catch (e) {
      console.error('Job detail error:', e);
      error = 'Error loading job';
      loading = false;
    }
  }

  load();
</script>

<a href="/jobs" use:link class="text-sm text-blue-400 hover:text-blue-300 mb-4 inline-block">&larr; Back to Jobs</a>

{#if loading}
  <Loading />
{:else if error}
  <div class="text-center text-red-400 py-12">{error}</div>
{:else if job}
  <div class="bg-gray-900 rounded-lg p-6 border border-gray-800 mb-6">
    <div class="flex justify-between items-start mb-3">
      <h1 class="text-xl font-bold text-gray-100">
        {job.title}
        {#if job.ciphertext}
          <a href="https://www.upwork.com/jobs/{job.ciphertext}" target="_blank" rel="noopener"
            class="text-gray-500 hover:text-blue-400 ml-2 text-base">&#8599; View on Upwork</a>
        {/if}
      </h1>
      <span class="text-2xl font-bold text-green-400 whitespace-nowrap ml-4">{budget}</span>
    </div>
    <div class="flex flex-wrap gap-3 mb-4 text-sm">
      {#if job.tier}
        <span class="px-2 py-0.5 rounded capitalize {tierColor[job.tier] || ''}">{job.tier}</span>
      {/if}
      <span class="text-gray-400">{job.job_type}</span>
      {#if job.duration}
        <span class="text-gray-400">{job.duration}</span>
      {/if}
      {#if job.engagement}
        <span class="text-gray-400">{job.engagement.replace('_', ' ')}</span>
      {/if}
      <span class="text-gray-400">{job.client_country || 'Unknown'}</span>
      {#if job.total_applicants}
        <span class="text-yellow-400">Proposals: {job.total_applicants}</span>
      {:else if job.proposals_tier}
        <span class="text-yellow-400">Proposals: {formatProposals(job.proposals_tier)}</span>
      {/if}
      {#if job.total_hired > 0}
        <span class="text-orange-400 font-medium">{job.total_hired} Hired</span>
      {/if}
      {#if job.total_invited_to_interview > 0}
        <span class="text-blue-400">Interviewing: {job.total_invited_to_interview}</span>
      {/if}
      {#if job.job_status}
        <span class="{job.job_status === 'ACTIVE' ? 'text-green-400' : 'text-red-400'}">{job.job_status}</span>
      {/if}
      <span class="text-gray-500">{new Date(job.created_on).toLocaleDateString()}</span>
    </div>
    <div class="flex flex-wrap gap-2 mb-4">
      {#each skills as s}
        <span class="text-xs bg-gray-800 text-gray-300 px-2 py-1 rounded">{s}</span>
      {/each}
    </div>
    <div class="text-sm text-gray-400 whitespace-pre-line">{job.description}</div>
  </div>

  <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
    <div class="bg-gray-900 rounded-lg p-5 border border-gray-800">
      <h3 class="text-lg font-semibold mb-4">Proposal Evolution</h3>
      {#if hasHistory}
        <div style="height: 250px;">
          <LineChart labels={historyLabels} datasets={historyDatasets} />
        </div>
      {:else}
        <div class="text-gray-500 text-sm py-8 text-center">
          No history yet. Snapshots are captured each time the extension sees this job.
        </div>
      {/if}
    </div>
    <div class="bg-gray-900 rounded-lg p-5 border border-gray-800">
      <h3 class="text-lg font-semibold mb-4">Client Info</h3>
      <div class="space-y-3">
        <div class="flex justify-between"><span class="text-gray-400">Quality Score</span><span class="{scColor} font-semibold text-lg">{score}/10</span></div>
        <div class="flex justify-between"><span class="text-gray-400">Payment Verified</span><span>{#if job.client_payment_verified}<span class="text-green-400">Yes</span>{:else}<span class="text-red-400">No</span>{/if}</span></div>
        <div class="flex justify-between"><span class="text-gray-400">Total Spent</span><span class="text-gray-200">${(parseFloat(job.client_total_spent) || 0).toLocaleString()}</span></div>
        <div class="flex justify-between"><span class="text-gray-400">Reviews</span><span class="text-gray-200">{job.client_total_reviews || 0}</span></div>
        <div class="flex justify-between"><span class="text-gray-400">Feedback</span><span class="text-gray-200">{job.client_total_feedback ? parseFloat(job.client_total_feedback).toFixed(1) : '-'}/5</span></div>
        <div class="flex justify-between"><span class="text-gray-400">First Seen</span><span class="text-gray-200">{job.first_seen_at ? new Date(job.first_seen_at).toLocaleString() : '-'}</span></div>
        <div class="flex justify-between"><span class="text-gray-400">Last Seen</span><span class="text-gray-200">{job.last_seen_at ? new Date(job.last_seen_at).toLocaleString() : '-'}</span></div>
        {#if job.total_hired > 0 || job.total_applicants || job.invitations_sent > 0}
          <div class="border-t border-gray-700 mt-3 pt-3">
            <div class="text-xs text-gray-500 uppercase mb-2">Hiring Activity</div>
            {#if job.total_applicants}
              <div class="flex justify-between"><span class="text-gray-400">Applicants</span><span class="text-gray-200">{job.total_applicants}</span></div>
            {/if}
            {#if job.total_hired > 0}
              <div class="flex justify-between"><span class="text-gray-400">Hired</span><span class="text-orange-400 font-medium">{job.total_hired}</span></div>
            {/if}
            {#if job.total_invited_to_interview > 0}
              <div class="flex justify-between"><span class="text-gray-400">Interviewing</span><span class="text-blue-400">{job.total_invited_to_interview}</span></div>
            {/if}
            {#if job.invitations_sent > 0}
              <div class="flex justify-between"><span class="text-gray-400">Invites Sent</span><span class="text-gray-200">{job.invitations_sent}</span></div>
            {/if}
            {#if job.last_buyer_activity}
              <div class="flex justify-between"><span class="text-gray-400">Client Last Active</span><span class="text-gray-200">{new Date(job.last_buyer_activity).toLocaleDateString()}</span></div>
            {/if}
          </div>
        {/if}
        {#if job.client_total_assignments != null || job.client_open_jobs != null}
          <div class="border-t border-gray-700 mt-3 pt-3">
            <div class="text-xs text-gray-500 uppercase mb-2">Buyer Stats</div>
            {#if job.client_total_assignments != null}
              <div class="flex justify-between"><span class="text-gray-400">Total Assignments</span><span class="text-gray-200">{job.client_total_assignments}</span></div>
            {/if}
            {#if job.client_total_jobs_with_hires != null}
              <div class="flex justify-between"><span class="text-gray-400">Jobs with Hires</span><span class="text-gray-200">{job.client_total_jobs_with_hires}</span></div>
            {/if}
            {#if job.client_active_assignments != null}
              <div class="flex justify-between"><span class="text-gray-400">Active Contracts</span><span class="text-gray-200">{job.client_active_assignments}</span></div>
            {/if}
            {#if job.client_open_jobs != null}
              <div class="flex justify-between"><span class="text-gray-400">Open Jobs</span><span class="text-gray-200">{job.client_open_jobs}</span></div>
            {/if}
          </div>
        {/if}
      </div>
    </div>
  </div>

  <div class="bg-gray-900 rounded-lg p-5 border border-gray-800">
    <h3 class="text-lg font-semibold mb-2">Match Score</h3>
    {#if job.match_score !== null && job.match_score !== undefined}
      <div class="flex items-center gap-4">
        <span class="text-4xl font-bold {matchColor}">{job.match_score}%</span>
        <div class="flex-1 bg-gray-800 rounded-full h-3 overflow-hidden">
          <div class="h-full rounded-full {matchBar}" style="width: {job.match_score}%"></div>
        </div>
      </div>
    {:else}
      <p class="text-gray-500 text-sm">Set up your profile to see match score</p>
    {/if}
  </div>
{/if}
