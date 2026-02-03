<script lang="ts">
  import { api } from '../lib/api';
  import { formatMoney, formatDateShort } from '../lib/format';
  import StatCard from '../components/StatCard.svelte';
  import LineChart from '../components/LineChart.svelte';
  import BarChart from '../components/BarChart.svelte';
  import DoughnutChart from '../components/DoughnutChart.svelte';
  import Loading from '../components/Loading.svelte';

  let loading = $state(true);
  let stats = $state({ total: '-', today: '-', budget: '-', types: '-' });
  let trendLabels = $state<string[]>([]);
  let trendDatasets = $state<{ label: string; data: number[]; color: string }[]>([]);
  let skillLabels = $state<string[]>([]);
  let skillData = $state<number[]>([]);
  let tierLabels = $state<string[]>([]);
  let tierData = $state<number[]>([]);
  let tierColors = $state<string[]>([]);
  let countryLabels = $state<string[]>([]);
  let countryData = $state<number[]>([]);

  async function load() {
    try {
      const [data, trends] = await Promise.all([
        api.getOverview(),
        api.getTrends(30),
      ]);

      stats = {
        total: String(data.total_jobs),
        today: String(data.jobs_today),
        budget: formatMoney(data.avg_fixed_budget),
        types: `${data.fixed_count} / ${data.hourly_count}`,
      };

      if (trends.trends?.length > 0) {
        trendLabels = trends.trends.map((t: any) => formatDateShort(t.date));
        trendDatasets = [
          { label: 'Total Jobs', data: trends.trends.map((t: any) => t.total_jobs), color: 'rgba(59, 130, 246, 0.8)' },
          { label: 'Fixed', data: trends.trends.map((t: any) => t.fixed_count), color: 'rgba(34, 197, 94, 0.8)' },
          { label: 'Hourly', data: trends.trends.map((t: any) => t.hourly_count), color: 'rgba(234, 179, 8, 0.8)' },
        ];
      }

      const topSkills = data.top_skills.slice(0, 10);
      skillLabels = topSkills.map((s: any) => s.label);
      skillData = topSkills.map((s: any) => s.job_count);

      const tierEntries = Object.entries(data.tier_breakdown as Record<string, number>);
      tierLabels = tierEntries.map(([tier]) => tier.charAt(0).toUpperCase() + tier.slice(1));
      tierData = tierEntries.map(([, count]) => count);
      tierColors = ['rgba(168, 85, 247, 0.8)', 'rgba(59, 130, 246, 0.8)', 'rgba(34, 197, 94, 0.8)'];

      countryLabels = data.top_countries.map((c: any) => c.country);
      countryData = data.top_countries.map((c: any) => c.count);

      loading = false;
    } catch (e) {
      console.error('Dashboard error:', e);
      loading = false;
    }
  }

  load();
</script>

{#if loading}
  <Loading />
{:else}
  <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
    <StatCard label="Total Jobs" value={stats.total} />
    <StatCard label="Today" value={stats.today} />
    <StatCard label="Avg Fixed Budget" value={stats.budget} />
    <StatCard label="Fixed / Hourly" value={stats.types} />
  </div>

  <div class="bg-gray-900 rounded-lg p-5 border border-gray-800 mb-8">
    <h3 class="text-lg font-semibold mb-4">Jobs Trend (Last 30 Days)</h3>
    <div style="height: 300px;">
      <LineChart labels={trendLabels} datasets={trendDatasets} />
    </div>
  </div>

  <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
    <div class="bg-gray-900 rounded-lg p-5 border border-gray-800">
      <h3 class="text-lg font-semibold mb-4">Top Skills</h3>
      <div style="height: 350px;">
        <BarChart labels={skillLabels} data={skillData} horizontal label="Job Count" />
      </div>
    </div>
    <div class="bg-gray-900 rounded-lg p-5 border border-gray-800">
      <h3 class="text-lg font-semibold mb-4">Tier Breakdown</h3>
      <div style="height: 300px;">
        <DoughnutChart labels={tierLabels} data={tierData} colors={tierColors} />
      </div>
    </div>
  </div>

  <div class="bg-gray-900 rounded-lg p-5 border border-gray-800">
    <h3 class="text-lg font-semibold mb-4">Top Countries</h3>
    <div style="height: 300px;">
      <BarChart labels={countryLabels} data={countryData} label="Jobs" color="rgba(6, 182, 212, 0.8)" />
    </div>
  </div>
{/if}
