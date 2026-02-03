<script lang="ts">
  import { link } from 'svelte-spa-router';
  import { api } from '../lib/api';
  import { matchScoreColor } from '../lib/format';
  import LineChart from '../components/LineChart.svelte';
  import BarChart from '../components/BarChart.svelte';
  import DoughnutChart from '../components/DoughnutChart.svelte';
  import Loading from '../components/Loading.svelte';
  import UiSelect from '../components/ui/UiSelect.svelte';
  import { ScrollArea, Tabs } from "bits-ui";

  let trendsDays = $state("30");

  // Budget trends
  let budgetLabels = $state<string[]>([]);
  let budgetDatasets = $state<{ label: string; data: number[]; color: string }[]>([]);

  // Tier trends
  let tierLabels = $state<string[]>([]);
  let tierDatasets = $state<{ label: string; data: number[]; color: string }[]>([]);

  // Skills demand
  let skillLabels = $state<string[]>([]);
  let skillData = $state<number[]>([]);

  // Budget distribution
  let fixedLabels = $state<string[]>([]);
  let fixedData = $state<number[]>([]);
  let hourlyLabels = $state<string[]>([]);
  let hourlyData = $state<number[]>([]);

  // Competition
  let velocityLabels = $state<string[]>([]);
  let velocityData = $state<number[]>([]);
  let distLabels = $state<string[]>([]);
  let distData = $state<number[]>([]);
  let hottestJobs = $state<any[]>([]);

  // Matches
  let matches = $state<any[]>([]);
  let matchesError = $state(false);

  let loading = $state(true);

  async function loadTrends(days: number) {
    const trends = await api.getTrends(days);
    if (!trends.trends?.length) return;

    const labels = trends.trends.map((t: any) => {
      const d = new Date(t.date);
      return `${d.getMonth() + 1}/${d.getDate()}`;
    });

    budgetLabels = labels;
    budgetDatasets = [{
      label: 'Avg Fixed Budget ($)',
      data: trends.trends.map((t: any) => t.avg_fixed_budget || 0),
      color: 'rgba(34, 197, 94, 0.8)',
    }];

    const tiers = ['expert', 'intermediate', 'entry'];
    const tierColors = ['rgba(168, 85, 247, 0.8)', 'rgba(59, 130, 246, 0.8)', 'rgba(34, 197, 94, 0.8)'];
    tierLabels = labels;
    tierDatasets = tiers.map((tier, i) => ({
      label: tier.charAt(0).toUpperCase() + tier.slice(1),
      data: trends.trends.map((t: any) => t.tier_breakdown[tier] || 0),
      color: tierColors[i],
    }));
  }

  $effect(() => {
    loadTrends(parseInt(trendsDays));
  });

  async function init() {
    try {
      const skillsData = await api.getSkills(15);
      skillLabels = skillsData.skills.map((s: any) => s.label);
      skillData = skillsData.skills.map((s: any) => s.job_count);

      const budgets = await api.getBudgets();
      fixedLabels = budgets.fixed.map((b: any) => b.label);
      fixedData = budgets.fixed.map((b: any) => b.count);
      hourlyLabels = budgets.hourly.map((b: any) => b.label);
      hourlyData = budgets.hourly.map((b: any) => b.count);

      try {
        const proposals = await api.getProposalStats();

        const tierStats = proposals.stats.avg_velocity_by_tier || {};
        velocityLabels = Object.keys(tierStats).map(t => t.charAt(0).toUpperCase() + t.slice(1));
        velocityData = Object.values(tierStats) as number[];

        const dist = proposals.stats.proposal_distribution || {};
        distLabels = Object.keys(dist);
        distData = Object.values(dist) as number[];

        hottestJobs = proposals.hottest_jobs || [];
      } catch (e) {
        console.error('Competition stats error:', e);
      }

      try {
        const matchData = await api.getMatches(10);
        if (matchData.error) {
          matchesError = true;
        } else {
          matches = matchData.matches || [];
        }
      } catch {
        matchesError = true;
      }

      loading = false;
    } catch (e) {
      console.error('Analytics error:', e);
      loading = false;
    }
  }

  init();
</script>

{#if loading}
  <Loading />
{:else}
  <Tabs.Root value="trends">
    <Tabs.List class="flex gap-1 mb-6 border-b border-gray-800">
      <Tabs.Trigger value="trends"
        class="px-4 py-2 text-sm text-gray-400 data-[state=active]:text-blue-400 data-[state=active]:border-b-2 data-[state=active]:border-blue-400">
        Trends
      </Tabs.Trigger>
      <Tabs.Trigger value="skills"
        class="px-4 py-2 text-sm text-gray-400 data-[state=active]:text-blue-400 data-[state=active]:border-b-2 data-[state=active]:border-blue-400">
        Skills & Tiers
      </Tabs.Trigger>
      <Tabs.Trigger value="budgets"
        class="px-4 py-2 text-sm text-gray-400 data-[state=active]:text-blue-400 data-[state=active]:border-b-2 data-[state=active]:border-blue-400">
        Budgets
      </Tabs.Trigger>
      <Tabs.Trigger value="competition"
        class="px-4 py-2 text-sm text-gray-400 data-[state=active]:text-blue-400 data-[state=active]:border-b-2 data-[state=active]:border-blue-400">
        Competition
      </Tabs.Trigger>
      <Tabs.Trigger value="matches"
        class="px-4 py-2 text-sm text-gray-400 data-[state=active]:text-blue-400 data-[state=active]:border-b-2 data-[state=active]:border-blue-400">
        Matches
      </Tabs.Trigger>
    </Tabs.List>

    <Tabs.Content value="trends">
      <div class="bg-gray-900 rounded-lg p-5 border border-gray-800">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-lg font-semibold">Budget Trends</h3>
          <UiSelect
            options={[
              { value: "7", label: "7 days" },
              { value: "30", label: "30 days" },
              { value: "90", label: "90 days" },
            ]}
            bind:value={trendsDays}
            placeholder="30 days"
          />
        </div>
        <div style="height: 300px;">
          <LineChart labels={budgetLabels} datasets={budgetDatasets} />
        </div>
      </div>
    </Tabs.Content>

    <Tabs.Content value="skills">
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div class="bg-gray-900 rounded-lg p-5 border border-gray-800">
          <h3 class="text-lg font-semibold mb-4">Skills Demand (Top 15)</h3>
          <div style="height: 400px;">
            <BarChart labels={skillLabels} data={skillData} horizontal label="Job Count" />
          </div>
        </div>
        <div class="bg-gray-900 rounded-lg p-5 border border-gray-800">
          <h3 class="text-lg font-semibold mb-4">Tier Distribution Over Time</h3>
          <div style="height: 400px;">
            <LineChart labels={tierLabels} datasets={tierDatasets} />
          </div>
        </div>
      </div>
    </Tabs.Content>

    <Tabs.Content value="budgets">
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div class="bg-gray-900 rounded-lg p-5 border border-gray-800">
          <h3 class="text-lg font-semibold mb-4">Budget Distribution (Fixed)</h3>
          <div style="height: 300px;">
            <BarChart labels={fixedLabels} data={fixedData} label="Jobs" color="rgba(34, 197, 94, 0.8)" />
          </div>
        </div>
        <div class="bg-gray-900 rounded-lg p-5 border border-gray-800">
          <h3 class="text-lg font-semibold mb-4">Hourly Rate Distribution</h3>
          <div style="height: 300px;">
            <BarChart labels={hourlyLabels} data={hourlyData} label="Jobs" color="rgba(234, 179, 8, 0.8)" />
          </div>
        </div>
      </div>
    </Tabs.Content>

    <Tabs.Content value="competition">
      <div class="bg-gray-900 rounded-lg p-5 border border-gray-800">
        <h3 class="text-lg font-semibold mb-4">Competition Analysis</h3>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <h4 class="text-sm text-gray-400 mb-3">Avg Proposals/Hour by Tier</h4>
            <div style="height: 200px;">
              {#if velocityLabels.length > 0}
                <BarChart labels={velocityLabels} data={velocityData} label="Proposals/Hour" color="rgba(239, 68, 68, 0.8)" />
              {/if}
            </div>
          </div>
          <div>
            <h4 class="text-sm text-gray-400 mb-3">Proposal Distribution</h4>
            <div style="height: 200px;">
              {#if distLabels.length > 0}
                <DoughnutChart labels={distLabels} data={distData} />
              {/if}
            </div>
          </div>
          <div>
            <h4 class="text-sm text-gray-400 mb-3">Hottest Jobs (Fastest Proposals)</h4>
            <ScrollArea.Root type="hover" class="max-h-52">
              <ScrollArea.Viewport class="max-h-52">
                <div class="space-y-1">
                  {#if hottestJobs.length > 0}
                    {#each hottestJobs as j}
                      <a href="/jobs/{j.ciphertext}" use:link class="flex justify-between items-center py-1.5 text-sm hover:bg-gray-800/50 rounded px-2 -mx-2">
                        <span class="text-gray-300 truncate flex-1 mr-2">{j.title}</span>
                        <span class="text-red-400 font-medium whitespace-nowrap">{j.velocity}/hr</span>
                      </a>
                    {/each}
                  {:else}
                    <p class="text-gray-500 text-sm">No proposal data yet</p>
                  {/if}
                </div>
              </ScrollArea.Viewport>
              <ScrollArea.Scrollbar orientation="vertical" class="w-2 bg-gray-800 rounded">
                <ScrollArea.Thumb class="bg-gray-600 rounded" />
              </ScrollArea.Scrollbar>
            </ScrollArea.Root>
          </div>
        </div>
      </div>
    </Tabs.Content>

    <Tabs.Content value="matches">
      <div class="bg-gray-900 rounded-lg p-5 border border-gray-800">
        <h3 class="text-lg font-semibold mb-4">Top Matches</h3>
        {#if matchesError}
          <p class="text-gray-500 text-sm">Set up your profile to see matches</p>
        {:else}
          {#each matches as m}
            <div class="flex justify-between items-center py-3 border-b border-gray-800 last:border-0">
              <div class="flex-1 min-w-0 mr-4">
                <span class="text-sm text-gray-300 truncate block">{m.title}</span>
                <span class="text-xs text-gray-500">{m.tier || ''} &middot; {m.job_type} &middot; {m.client_country || 'Unknown'}</span>
              </div>
              <span class="text-sm font-semibold whitespace-nowrap px-2 py-1 rounded {matchScoreColor(m.match_score)}">{m.match_score}%</span>
            </div>
          {/each}
        {/if}
      </div>
    </Tabs.Content>
  </Tabs.Root>
{/if}
