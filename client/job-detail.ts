import { api } from './lib/api';
import { createLineChart, createBarChart } from './lib/charts';

function formatProposals(tier: string | null): string {
  if (!tier) return '';
  const lower = tier.toLowerCase();
  if (lower.includes('lessthan5') || lower.includes('less_than_5')) return '< 5';
  if (lower.includes('5to10') || lower.includes('5_to_10')) return '5-10';
  if (lower.includes('10to15') || lower.includes('10_to_15')) return '10-15';
  if (lower.includes('15to20') || lower.includes('15_to_20')) return '15-20';
  if (lower.includes('20to50') || lower.includes('20_to_50')) return '20-50';
  if (lower.includes('50plus') || lower.includes('50_plus') || lower.includes('50+')) return '50+';
  if (tier.startsWith('Less')) return '< 5';
  return tier;
}

function proposalMidpoint(tier: string | null): number {
  if (!tier) return 0;
  if (tier.includes('Less than 5') || tier === '0') return 2;
  if (tier.includes('5 to 10') || tier === '5-10') return 7;
  if (tier.includes('10 to 15') || tier === '10-15') return 12;
  if (tier.includes('15 to 20') || tier === '15-20') return 17;
  if (tier.includes('20 to 50') || tier === '20-50') return 35;
  if (tier.includes('50+') || tier.includes('50 +')) return 60;
  const match = tier?.match(/(\d+)\s*(?:to|-)\s*(\d+)/);
  if (match) return (parseInt(match[1]) + parseInt(match[2])) / 2;
  return 0;
}

async function init() {
  const jobId = (window as any).__JOB_ID__;
  if (!jobId) return;

  try {
    const [job, historyData] = await Promise.all([
      api.getJob(jobId),
      api.getJobHistory(jobId),
    ]);

    document.getElementById('job-loading')!.classList.add('hidden');
    document.getElementById('job-content')!.classList.remove('hidden');

    // Title and budget
    const titleEl = document.getElementById('job-title')!;
    titleEl.textContent = job.title;
    if (job.ciphertext) {
      const link = document.createElement('a');
      link.href = `https://www.upwork.com/jobs/${job.ciphertext}`;
      link.target = '_blank';
      link.rel = 'noopener';
      link.className = 'text-gray-500 hover:text-blue-400 ml-2 text-base';
      link.textContent = '↗ View on Upwork';
      titleEl.appendChild(link);
    }
    const budget = job.job_type === 'fixed'
      ? job.fixed_budget ? `$${parseFloat(job.fixed_budget).toLocaleString()}` : 'N/A'
      : job.hourly_min && job.hourly_max ? `$${job.hourly_min}-$${job.hourly_max}/hr` : 'N/A';
    document.getElementById('job-budget')!.textContent = budget;

    // Meta
    const tierColor: Record<string, string> = {
      expert: 'text-purple-400 bg-purple-400/10',
      intermediate: 'text-blue-400 bg-blue-400/10',
      entry: 'text-green-400 bg-green-400/10',
    };
    const metaEl = document.getElementById('job-meta')!;
    metaEl.innerHTML = [
      job.tier ? `<span class="px-2 py-0.5 rounded capitalize ${tierColor[job.tier] || ''}">${job.tier}</span>` : '',
      `<span class="text-gray-400">${job.job_type}</span>`,
      job.duration ? `<span class="text-gray-400">${job.duration}</span>` : '',
      job.engagement ? `<span class="text-gray-400">${job.engagement.replace('_', ' ')}</span>` : '',
      `<span class="text-gray-400">${job.client_country || 'Unknown'}</span>`,
      job.proposals_tier ? `<span class="text-yellow-400">Proposals: ${formatProposals(job.proposals_tier)}</span>` : '',
      `<span class="text-gray-500">${new Date(job.created_on).toLocaleDateString()}</span>`,
    ].filter(Boolean).join('');

    // Skills
    const skills = (job.job_skills || []).map((js: any) => js.skills?.label).filter(Boolean);
    document.getElementById('job-skills')!.innerHTML = skills
      .map((s: string) => `<span class="text-xs bg-gray-800 text-gray-300 px-2 py-1 rounded">${s}</span>`)
      .join('');

    // Description
    document.getElementById('job-description')!.textContent = job.description;

    // Client info
    const score = job.client_quality_score ? parseFloat(job.client_quality_score).toFixed(1) : '-';
    const scoreColor = parseFloat(score) >= 7 ? 'text-green-400' : parseFloat(score) >= 4 ? 'text-yellow-400' : 'text-red-400';
    document.getElementById('client-info')!.innerHTML = `
      <div class="flex justify-between"><span class="text-gray-400">Quality Score</span><span class="${scoreColor} font-semibold text-lg">${score}/10</span></div>
      <div class="flex justify-between"><span class="text-gray-400">Payment Verified</span><span>${job.client_payment_verified ? '<span class="text-green-400">Yes</span>' : '<span class="text-red-400">No</span>'}</span></div>
      <div class="flex justify-between"><span class="text-gray-400">Total Spent</span><span class="text-gray-200">$${(parseFloat(job.client_total_spent) || 0).toLocaleString()}</span></div>
      <div class="flex justify-between"><span class="text-gray-400">Reviews</span><span class="text-gray-200">${job.client_total_reviews || 0}</span></div>
      <div class="flex justify-between"><span class="text-gray-400">Feedback</span><span class="text-gray-200">${job.client_total_feedback ? parseFloat(job.client_total_feedback).toFixed(1) : '-'}/5</span></div>
      <div class="flex justify-between"><span class="text-gray-400">First Seen</span><span class="text-gray-200">${job.first_seen_at ? new Date(job.first_seen_at).toLocaleString() : '-'}</span></div>
      <div class="flex justify-between"><span class="text-gray-400">Last Seen</span><span class="text-gray-200">${job.last_seen_at ? new Date(job.last_seen_at).toLocaleString() : '-'}</span></div>
    `;

    // Proposal history chart
    const snapshots = historyData.snapshots || [];
    if (snapshots.length > 1) {
      const labels = snapshots.map((s: any) => {
        const d = new Date(s.snapshot_at);
        return `${d.getMonth() + 1}/${d.getDate()} ${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`;
      });
      const data = snapshots.map((s: any) => proposalMidpoint(s.proposals_tier));

      createLineChart(
        document.getElementById('history-chart') as HTMLCanvasElement,
        labels,
        [{
          label: 'Est. Proposals',
          data,
          color: 'rgba(234, 179, 8, 0.8)',
        }]
      );
    } else {
      document.getElementById('history-chart-container')!.style.display = 'none';
      document.getElementById('no-history')!.classList.remove('hidden');
    }

    // Match score
    const matchEl = document.getElementById('match-section')!;
    if (job.match_score !== null && job.match_score !== undefined) {
      const color = job.match_score >= 70 ? 'text-green-400' : job.match_score >= 40 ? 'text-yellow-400' : 'text-gray-400';
      matchEl.innerHTML = `
        <div class="flex items-center gap-4">
          <span class="text-4xl font-bold ${color}">${job.match_score}%</span>
          <div class="flex-1 bg-gray-800 rounded-full h-3 overflow-hidden">
            <div class="h-full rounded-full ${job.match_score >= 70 ? 'bg-green-500' : job.match_score >= 40 ? 'bg-yellow-500' : 'bg-gray-500'}" style="width: ${job.match_score}%"></div>
          </div>
        </div>
      `;
    } else {
      matchEl.innerHTML = '<p class="text-gray-500 text-sm">Set up your profile to see match score</p>';
    }
  } catch (e) {
    console.error('Job detail error:', e);
    document.getElementById('job-loading')!.textContent = 'Error loading job';
  }
}

init();
