import { api } from './lib/api';
import { createBarChart, createDoughnutChart, createLineChart } from './lib/charts';

async function init() {
  try {
    const [data, trends] = await Promise.all([
      api.getOverview(),
      api.getTrends(30),
    ]);

    // Stats cards
    document.getElementById('stat-total')!.textContent = String(data.total_jobs);
    document.getElementById('stat-today')!.textContent = String(data.jobs_today);
    document.getElementById('stat-budget')!.textContent = `$${data.avg_fixed_budget.toLocaleString()}`;
    document.getElementById('stat-types')!.textContent = `${data.fixed_count} / ${data.hourly_count}`;

    // Trends line chart
    if (trends.trends && trends.trends.length > 0) {
      const trendLabels = trends.trends.map((t: any) => {
        const d = new Date(t.date);
        return `${d.getMonth() + 1}/${d.getDate()}`;
      });
      createLineChart(
        document.getElementById('trends-chart') as HTMLCanvasElement,
        trendLabels,
        [
          {
            label: 'Total Jobs',
            data: trends.trends.map((t: any) => t.total_jobs),
            color: 'rgba(59, 130, 246, 0.8)',
          },
          {
            label: 'Fixed',
            data: trends.trends.map((t: any) => t.fixed_count),
            color: 'rgba(34, 197, 94, 0.8)',
          },
          {
            label: 'Hourly',
            data: trends.trends.map((t: any) => t.hourly_count),
            color: 'rgba(234, 179, 8, 0.8)',
          },
        ]
      );
    }

    // Skills horizontal bar chart
    const topSkills = data.top_skills.slice(0, 10);
    createBarChart(
      document.getElementById('skills-chart') as HTMLCanvasElement,
      topSkills.map((s: any) => s.label),
      topSkills.map((s: any) => s.job_count),
      { horizontal: true, label: 'Job Count', color: 'rgba(59, 130, 246, 0.8)' }
    );

    // Tier doughnut chart
    const tierEntries = Object.entries(data.tier_breakdown as Record<string, number>);
    createDoughnutChart(
      document.getElementById('tier-chart') as HTMLCanvasElement,
      tierEntries.map(([tier]) => tier.charAt(0).toUpperCase() + tier.slice(1)),
      tierEntries.map(([, count]) => count),
      ['rgba(168, 85, 247, 0.8)', 'rgba(59, 130, 246, 0.8)', 'rgba(34, 197, 94, 0.8)']
    );

    // Countries bar chart
    createBarChart(
      document.getElementById('countries-chart') as HTMLCanvasElement,
      data.top_countries.map((c: any) => c.country),
      data.top_countries.map((c: any) => c.count),
      { label: 'Jobs', color: 'rgba(6, 182, 212, 0.8)' }
    );
  } catch (e) {
    console.error('Dashboard error:', e);
  }
}

init();
