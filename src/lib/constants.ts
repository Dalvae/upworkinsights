import type { JobType, Tier, EngagementType } from '../types';

export const JOB_TYPE_MAP: Record<number, JobType> = {
  1: 'fixed',
  2: 'hourly',
};

export function parseTier(tierText: string): Tier {
  const lower = tierText.toLowerCase();
  if (lower.includes('expert')) return 'expert';
  if (lower.includes('intermediate')) return 'intermediate';
  return 'entry';
}

export function parseEngagement(engagement: string | null): EngagementType {
  if (!engagement) return null;
  const lower = engagement.toLowerCase().replace(/[\s-]/g, '_');
  if (lower.includes('full')) return 'full_time';
  if (lower.includes('part')) return 'part_time';
  return null;
}

export function parseJobType(type: number): JobType {
  return JOB_TYPE_MAP[type] || 'fixed';
}

export function parseProposalsTier(raw: string | null): string | null {
  if (!raw) return null;
  const lower = raw.toLowerCase();
  if (lower.includes('lessthan5') || lower.includes('less_than_5')) return 'Less than 5';
  if (lower.includes('5to10') || lower.includes('5_to_10')) return '5 to 10';
  if (lower.includes('10to15') || lower.includes('10_to_15')) return '10 to 15';
  if (lower.includes('15to20') || lower.includes('15_to_20')) return '15 to 20';
  if (lower.includes('20to50') || lower.includes('20_to_50')) return '20 to 50';
  if (lower.includes('50plus') || lower.includes('50_plus') || lower.includes('50+')) return '50+';
  if (/^\d/.test(raw) || raw.startsWith('Less')) return raw;
  return raw;
}

export function proposalMidpoint(tier: string | null): number {
  if (!tier) return 0;
  if (tier.includes('Less than 5') || tier === '0') return 2;
  if (tier.includes('5 to 10') || tier === '5-10') return 7;
  if (tier.includes('10 to 15') || tier === '10-15') return 12;
  if (tier.includes('15 to 20') || tier === '15-20') return 17;
  if (tier.includes('20 to 50') || tier === '20-50') return 35;
  if (tier.includes('50+') || tier.includes('50 +')) return 60;
  const match = tier.match(/(\d+)\s*(?:to|-)\s*(\d+)/);
  if (match) return (parseInt(match[1]) + parseInt(match[2])) / 2;
  return 0;
}
