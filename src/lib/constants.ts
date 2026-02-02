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
