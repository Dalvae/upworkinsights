import { api } from './lib/api';
import { createBarChart, createDoughnutChart, createLineChart } from './lib/charts';

let budgetTrendsChart: any = null;
let tierTrendsChart: any = null;

async function loadTrends(days: number) {
  const trends = await api.getTrends(days);
  if (!trends.trends || trends.trends.length === 0) return;

  const labels = trends.trends.map((t: any) => {
    const d = new Date(t.date);
    return `${d.getMonth() + 1}/${d.getDate()}`;
  });

  // Budget trends line chart
  if (budgetTrendsChart) budgetTrendsChart.destroy();
  const budgetData = trends.trends.map((t: any) => t.avg_fixed_budget || 0);
  budgetTrendsChart = createLineChart(
    document.getElementById('budget-trends-chart') as HTMLCanvasElement,
    labels,
    [
      {
        label: 'Avg Fixed Budget ($)',
        data: budgetData,
        color: 'rgba(34, 197, 94, 0.8)',
      },
    ]
  );

  // Tier trends stacked line chart
  if (tierTrendsChart) tierTrendsChart.destroy();
  const tiers = ['expert', 'intermediate', 'entry'];
  const tierColors = [
    'rgba(168, 85, 247, 0.8)',
    'rgba(59, 130, 246, 0.8)',
    'rgba(34, 197, 94, 0.8)',
  ];
  tierTrendsChart = createLineChart(
    document.getElementById('tier-trends-chart') as HTMLCanvasElement,
    labels,
    tiers.map((tier, i) => ({
      label: tier.charAt(0).toUpperCase() + tier.slice(1),
      data: trends.trends.map((t: any) => t.tier_breakdown[tier] || 0),
      color: tierColors[i],
    }))
  );
}

async function init() {
  // Load trends with default 30 days
  loadTrends(30);

  // Days selector
  document.getElementById('trends-days')?.addEventListener('change', (e) => {
    const days = parseInt((e.target as HTMLSelectElement).value);
    loadTrends(days);
  });

  // Skills demand horizontal bar
  const skillsData = await api.getSkills(15);
  createBarChart(
    document.getElementById('skills-demand-chart') as HTMLCanvasElement,
    skillsData.skills.map((s: any) => s.label),
    skillsData.skills.map((s: any) => s.job_count),
    { horizontal: true, label: 'Job Count', color: 'rgba(59, 130, 246, 0.8)' }
  );

  // Budget distribution bar chart
  const budgets = await api.getBudgets();
  createBarChart(
    document.getElementById('budget-chart') as HTMLCanvasElement,
    budgets.fixed.map((b: any) => b.label),
    budgets.fixed.map((b: any) => b.count),
    { label: 'Jobs', color: 'rgba(34, 197, 94, 0.8)' }
  );

  // Hourly rate distribution bar chart
  createBarChart(
    document.getElementById('hourly-chart') as HTMLCanvasElement,
    budgets.hourly.map((b: any) => b.label),
    budgets.hourly.map((b: any) => b.count),
    { label: 'Jobs', color: 'rgba(234, 179, 8, 0.8)' }
  );

  // Competition analysis
  try {
    const proposals = await api.getProposalStats();

    // Velocity by tier
    const tierStats = proposals.stats.avg_velocity_by_tier || {};
    const tierLabels = Object.keys(tierStats).map(t => t.charAt(0).toUpperCase() + t.slice(1));
    const tierVelocities = Object.values(tierStats) as number[];
    if (tierLabels.length > 0) {
      createBarChart(
        document.getElementById('velocity-tier-chart') as HTMLCanvasElement,
        tierLabels,
        tierVelocities,
        { label: 'Proposals/Hour', color: 'rgba(239, 68, 68, 0.8)' }
      );
    }

    // Proposal distribution doughnut
    const dist = proposals.stats.proposal_distribution || {};
    const distLabels = Object.keys(dist);
    const distValues = Object.values(dist) as number[];
    if (distLabels.length > 0) {
      createDoughnutChart(
        document.getElementById('proposal-dist-chart') as HTMLCanvasElement,
        distLabels,
        distValues,
      );
    }

    // Hottest jobs list
    const hottestEl = document.getElementById('hottest-jobs')!;
    const hottest = proposals.hottest_jobs || [];
    if (hottest.length > 0) {
      hottestEl.innerHTML = hottest.map((j: any) => `
        <a href="/jobs/${j.id}" class="flex justify-between items-center py-1.5 text-sm hover:bg-gray-800/50 rounded px-2 -mx-2">
          <span class="text-gray-300 truncate flex-1 mr-2">${j.title}</span>
          <span class="text-red-400 font-medium whitespace-nowrap">${j.velocity}/hr</span>
        </a>
      `).join('');
    } else {
      hottestEl.innerHTML = '<p class="text-gray-500 text-sm">No proposal data yet</p>';
    }
  } catch (e) {
    console.error('Competition stats error:', e);
  }

  // Matches list (keep as HTML, not a chart)
  try {
    const matches = await api.getMatches(10);
    const matchesEl = document.getElementById('matches-list')!;
    if (matches.error) {
      matchesEl.innerHTML = '<p class="text-gray-500 text-sm">Set up your profile to see matches</p>';
    } else {
      matchesEl.innerHTML = (matches.matches || [])
        .map(
          (m: any) => `
        <div class="flex justify-between items-center py-3 border-b border-gray-800 last:border-0">
          <div class="flex-1 min-w-0 mr-4">
            <span class="text-sm text-gray-300 truncate block">${m.title}</span>
            <span class="text-xs text-gray-500">${m.tier || ''} &middot; ${m.job_type} &middot; ${m.client_country || 'Unknown'}</span>
          </div>
          <span class="text-sm font-semibold whitespace-nowrap px-2 py-1 rounded ${
            m.match_score >= 70
              ? 'text-green-400 bg-green-400/10'
              : m.match_score >= 40
                ? 'text-yellow-400 bg-yellow-400/10'
                : 'text-gray-400 bg-gray-400/10'
          }">${m.match_score}%</span>
        </div>
      `
        )
        .join('');
    }
  } catch {
    document.getElementById('matches-list')!.innerHTML =
      '<p class="text-gray-500 text-sm">Set up your profile to see matches</p>';
  }
}

init();
