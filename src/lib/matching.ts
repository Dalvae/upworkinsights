import type { Job } from '../types';

export function computeMatchScore(
  job: Job,
  jobSkills: string[],
  profile: {
    skills: string[];
    hourly_rate?: number | null;
    preferred_tiers?: string[];
    min_budget?: number | null;
  }
): number {
  let score = 0;

  // Skill overlap: up to 40 points
  if (profile.skills.length > 0 && jobSkills.length > 0) {
    const profileSet = new Set(profile.skills.map((s) => s.toLowerCase()));
    const matches = jobSkills.filter((s) => profileSet.has(s.toLowerCase())).length;
    score += Math.round((matches / profile.skills.length) * 40);
  }

  // Tier match: 20 points
  if (profile.preferred_tiers && profile.preferred_tiers.length > 0 && job.tier) {
    if (profile.preferred_tiers.includes(job.tier)) {
      score += 20;
    }
  }

  // Budget fit: 20 points
  if (job.job_type === 'fixed' && job.fixed_budget && profile.min_budget) {
    if (job.fixed_budget >= profile.min_budget) {
      score += 20;
    }
  } else if (job.job_type === 'hourly' && profile.hourly_rate) {
    if (
      job.hourly_max &&
      job.hourly_min &&
      profile.hourly_rate >= job.hourly_min &&
      profile.hourly_rate <= job.hourly_max
    ) {
      score += 20;
    } else if (job.hourly_max && profile.hourly_rate <= job.hourly_max) {
      score += 15;
    }
  }

  // Client quality: 20 points
  if (job.client_quality_score) {
    score += Math.round((job.client_quality_score / 10) * 20);
  }

  return Math.min(100, score);
}
