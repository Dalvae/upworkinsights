export function formatProposals(tier: string | null): string {
  if (!tier) return '-';
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

export function proposalMidpoint(tier: string | null): number {
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

export function formatBudget(job: any): string {
  if (job.job_type === 'fixed') {
    return job.fixed_budget ? `$${parseFloat(job.fixed_budget).toLocaleString()}` : 'N/A';
  }
  return job.hourly_min && job.hourly_max ? `$${job.hourly_min}-$${job.hourly_max}/hr` : 'N/A';
}

export const tierColor: Record<string, string> = {
  expert: 'text-purple-400 bg-purple-400/10',
  intermediate: 'text-blue-400 bg-blue-400/10',
  entry: 'text-green-400 bg-green-400/10',
};

export function scoreColor(score: number): string {
  if (score >= 7) return 'text-green-400';
  if (score >= 4) return 'text-yellow-400';
  return 'text-red-400';
}

export function matchScoreColor(score: number): string {
  if (score >= 70) return 'text-green-400 bg-green-400/10';
  if (score >= 40) return 'text-yellow-400 bg-yellow-400/10';
  return 'text-gray-400 bg-gray-400/10';
}

export function matchBarColor(score: number): string {
  if (score >= 70) return 'bg-green-500';
  if (score >= 40) return 'bg-yellow-500';
  return 'bg-gray-500';
}

export function formatDate(dateStr: string | null): string {
  if (!dateStr) return '-';
  const d = new Date(dateStr);
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
}

export function formatDateShort(dateStr: string | null): string {
  if (!dateStr) return '-';
  const d = new Date(dateStr);
  return `${d.getDate()}/${d.getMonth() + 1}`;
}

export function formatScore(value: string | number | null, max: number = 10): string {
  if (!value) return `-/${max}`;
  return `${parseFloat(String(value)).toFixed(1)}/${max}`;
}

export function formatMoney(value: string | number | null): string {
  if (!value) return '$0';
  return `$${(parseFloat(String(value)) || 0).toLocaleString()}`;
}

export function formatDateTime(dateStr: string | null): string {
  if (!dateStr) return '-';
  const d = new Date(dateStr);
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

export function formatDateTimeShort(dateStr: string): string {
  const d = new Date(dateStr);
  return `${d.getDate()}/${d.getMonth() + 1} ${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`;
}
