import { Hono } from 'hono';
import type { SupabaseClient } from '@supabase/supabase-js';
import { computeMatchScore } from '../lib/matching';
import { proposalMidpoint } from '../lib/constants';
import type { Job, JobWithSkills, JobSnapshot, Skill, UserProfile } from '../types';

type Env = { Variables: { db: SupabaseClient } };
const app = new Hono<Env>();

app.get('/analytics/overview', async (c) => {
  const db = c.get('db');

  const { count: totalJobs } = await db.from('jobs').select('*', { count: 'exact', head: true });

  const { data: fixedJobs } = await db.from('jobs').select('fixed_budget').eq('job_type', 'fixed').not('fixed_budget', 'is', null);
  const { count: hourlyCount } = await db.from('jobs').select('*', { count: 'exact', head: true }).eq('job_type', 'hourly');

  const avgFixedBudget =
    fixedJobs && fixedJobs.length > 0
      ? fixedJobs.reduce((sum, j) => sum + (Number(j.fixed_budget) || 0), 0) / fixedJobs.length
      : 0;

  const { data: tierData } = await db.from('jobs').select('tier');
  const tierBreakdown: Record<string, number> = {};
  for (const j of tierData ?? []) {
    const t = (j.tier as string) || 'unknown';
    tierBreakdown[t] = (tierBreakdown[t] || 0) + 1;
  }

  const { data: countryData } = await db.from('jobs').select('client_country');
  const countries: Record<string, number> = {};
  for (const j of countryData ?? []) {
    const country = (j.client_country as string) || 'Unknown';
    countries[country] = (countries[country] || 0) + 1;
  }
  const topCountries = Object.entries(countries)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([country, count]) => ({ country, count }));

  const { data: topSkills } = await db.from('skills').select('uid, label, job_count').order('job_count', { ascending: false }).limit(15);

  const today = new Date().toISOString().split('T')[0];
  const { count: jobsToday } = await db
    .from('jobs')
    .select('*', { count: 'exact', head: true })
    .gte('first_seen_at', today);

  return c.json({
    total_jobs: totalJobs || 0,
    jobs_today: jobsToday || 0,
    avg_fixed_budget: Math.round(avgFixedBudget * 100) / 100,
    fixed_count: fixedJobs?.length || 0,
    hourly_count: hourlyCount || 0,
    tier_breakdown: tierBreakdown,
    top_countries: topCountries,
    top_skills: topSkills || [],
  });
});

app.get('/analytics/skills', async (c) => {
  const db = c.get('db');
  const { limit = '30' } = c.req.query();

  const { data: skills } = await db
    .from('skills')
    .select('uid, label, job_count')
    .order('job_count', { ascending: false })
    .limit(parseInt(limit));

  return c.json({ skills: skills || [] });
});

app.get('/analytics/budgets', async (c) => {
  const db = c.get('db');

  const { data: fixedJobs } = await db.from('jobs').select('fixed_budget').eq('job_type', 'fixed').not('fixed_budget', 'is', null);

  const ranges = [
    { label: '$0-100', min: 0, max: 100 },
    { label: '$100-500', min: 100, max: 500 },
    { label: '$500-1k', min: 500, max: 1000 },
    { label: '$1k-5k', min: 1000, max: 5000 },
    { label: '$5k-10k', min: 5000, max: 10000 },
    { label: '$10k+', min: 10000, max: Infinity },
  ];

  const fixedDistribution = ranges.map((r) => ({
    label: r.label,
    count: (fixedJobs ?? []).filter((j) => {
      const b = Number(j.fixed_budget);
      return b >= r.min && b < r.max;
    }).length,
  }));

  const { data: hourlyJobs } = await db
    .from('jobs')
    .select('hourly_min, hourly_max')
    .eq('job_type', 'hourly')
    .not('hourly_max', 'is', null);

  const hourlyRanges = [
    { label: '$0-25', min: 0, max: 25 },
    { label: '$25-50', min: 25, max: 50 },
    { label: '$50-75', min: 50, max: 75 },
    { label: '$75-100', min: 75, max: 100 },
    { label: '$100+', min: 100, max: Infinity },
  ];

  const hourlyDistribution = hourlyRanges.map((r) => ({
    label: r.label,
    count: (hourlyJobs ?? []).filter((j) => {
      const max = Number(j.hourly_max);
      return max >= r.min && max < r.max;
    }).length,
  }));

  return c.json({ fixed: fixedDistribution, hourly: hourlyDistribution });
});

app.get('/analytics/matches', async (c) => {
  const db = c.get('db');
  const { limit = '20' } = c.req.query();

  const { data: profile } = await db.from('user_profile').select('*').limit(1).single();
  if (!profile) return c.json({ error: 'No profile configured' }, 400);

  const { data: jobs } = await db
    .from('jobs')
    .select('*, job_skills(skill_uid, skills(label))')
    .order('created_on', { ascending: false })
    .limit(200);

  if (!jobs) return c.json({ matches: [] });

  const scored = jobs.map((job) => {
    const jobSkills = (job.job_skills as JobWithSkills['job_skills']) ?? [];
    const jobSkillLabels = jobSkills.map((js) => js.skills?.label).filter(Boolean) as string[];
    const score = computeMatchScore(job as Job, jobSkillLabels, profile as UserProfile);
    return { ...job, match_score: score };
  });

  scored.sort((a, b) => b.match_score - a.match_score);

  return c.json({ matches: scored.slice(0, parseInt(limit)) });
});

app.get('/analytics/trends', async (c) => {
  const db = c.get('db');
  const { days = '30' } = c.req.query();

  const daysBack = parseInt(days);
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - daysBack);
  const startDateStr = startDate.toISOString();

  const { data: jobs } = await db
    .from('jobs')
    .select('created_on, job_type, tier, fixed_budget')
    .gte('created_on', startDateStr)
    .order('created_on', { ascending: true });

  if (!jobs) return c.json({ trends: [] });

  const dailyData: Record<
    string,
    {
      date: string;
      total_jobs: number;
      fixed_count: number;
      hourly_count: number;
      fixed_budgets: number[];
      tier_breakdown: Record<string, number>;
    }
  > = {};

  for (const job of jobs) {
    const date = (job.created_on as string)?.split('T')[0];
    if (!date) continue;

    if (!dailyData[date]) {
      dailyData[date] = {
        date,
        total_jobs: 0,
        fixed_count: 0,
        hourly_count: 0,
        fixed_budgets: [],
        tier_breakdown: {},
      };
    }

    dailyData[date].total_jobs += 1;

    if (job.job_type === 'fixed') {
      dailyData[date].fixed_count += 1;
      if (job.fixed_budget) {
        dailyData[date].fixed_budgets.push(Number(job.fixed_budget));
      }
    } else if (job.job_type === 'hourly') {
      dailyData[date].hourly_count += 1;
    }

    const tier = (job.tier as string) || 'unknown';
    dailyData[date].tier_breakdown[tier] = (dailyData[date].tier_breakdown[tier] || 0) + 1;
  }

  const trends = Object.values(dailyData).map((day) => ({
    date: day.date,
    total_jobs: day.total_jobs,
    fixed_count: day.fixed_count,
    hourly_count: day.hourly_count,
    avg_fixed_budget:
      day.fixed_budgets.length > 0
        ? Math.round((day.fixed_budgets.reduce((sum, b) => sum + b, 0) / day.fixed_budgets.length) * 100) / 100
        : null,
    tier_breakdown: day.tier_breakdown,
  }));

  return c.json({ trends });
});

interface ProposalJob {
  id: number;
  title: string;
  tier: string;
  job_type: string;
  fixed_budget: number | null;
  hourly_max: number | null;
  created_on: string;
  proposals_tier: string | null;
  first_seen_at: string | null;
}

interface ProposalSnapshot {
  job_id: number;
  snapshot_at: string;
  proposals_tier: string | null;
}

interface JobVelocity {
  id: number;
  title: string;
  tier: string;
  job_type: string;
  proposals_tier: string | null;
  proposals_estimate: number;
  hours_since_published: number;
  velocity: number;
  snapshot_count: number;
}

app.get('/analytics/proposals', async (c) => {
  const db = c.get('db');

  const { data: jobs } = await db
    .from('jobs')
    .select('id, title, tier, job_type, fixed_budget, hourly_max, created_on, proposals_tier, first_seen_at')
    .order('created_on', { ascending: false })
    .limit(500);

  const { data: snapshots } = await db
    .from('job_snapshots')
    .select('job_id, snapshot_at, proposals_tier')
    .order('snapshot_at', { ascending: true });

  if (!jobs) return c.json({ stats: {}, jobs_with_velocity: [] });

  // Group snapshots by job_id
  const snapshotsByJob: Record<number, ProposalSnapshot[]> = {};
  for (const s of (snapshots ?? []) as ProposalSnapshot[]) {
    if (!snapshotsByJob[s.job_id]) snapshotsByJob[s.job_id] = [];
    snapshotsByJob[s.job_id].push(s);
  }

  // Calculate velocity for each job
  const jobsWithVelocity: JobVelocity[] = (jobs as ProposalJob[]).map((job) => {
    const jobSnapshots = snapshotsByJob[job.id] ?? [];
    const currentProposals = proposalMidpoint(job.proposals_tier);

    const publishedAt = new Date(job.first_seen_at || job.created_on);
    const hoursSincePublished = (Date.now() - publishedAt.getTime()) / (1000 * 60 * 60);

    const velocity = hoursSincePublished > 0 ? currentProposals / hoursSincePublished : 0;

    return {
      id: job.id,
      title: job.title,
      tier: job.tier,
      job_type: job.job_type,
      proposals_tier: job.proposals_tier,
      proposals_estimate: currentProposals,
      hours_since_published: Math.round(hoursSincePublished * 10) / 10,
      velocity: Math.round(velocity * 100) / 100,
      snapshot_count: jobSnapshots.length,
    };
  });

  // Aggregate stats by tier
  const byTier: Record<string, { count: number; total_velocity: number }> = {};
  const byType: Record<string, { count: number; total_velocity: number }> = {};

  for (const j of jobsWithVelocity) {
    if (j.velocity > 0) {
      const t = j.tier || 'unknown';
      if (!byTier[t]) byTier[t] = { count: 0, total_velocity: 0 };
      byTier[t].count++;
      byTier[t].total_velocity += j.velocity;

      const jt = j.job_type || 'unknown';
      if (!byType[jt]) byType[jt] = { count: 0, total_velocity: 0 };
      byType[jt].count++;
      byType[jt].total_velocity += j.velocity;
    }
  }

  const avgByTier = Object.fromEntries(
    Object.entries(byTier).map(([k, v]) => [k, Math.round((v.total_velocity / v.count) * 100) / 100])
  );
  const avgByType = Object.fromEntries(
    Object.entries(byType).map(([k, v]) => [k, Math.round((v.total_velocity / v.count) * 100) / 100])
  );

  // Distribution: how many jobs in each proposals_tier
  const proposalDistribution: Record<string, number> = {};
  for (const j of jobs as ProposalJob[]) {
    const tier = j.proposals_tier || 'Unknown';
    proposalDistribution[tier] = (proposalDistribution[tier] || 0) + 1;
  }

  return c.json({
    stats: {
      avg_velocity_by_tier: avgByTier,
      avg_velocity_by_type: avgByType,
      proposal_distribution: proposalDistribution,
    },
    hottest_jobs: jobsWithVelocity
      .filter((j) => j.velocity > 0)
      .sort((a, b) => b.velocity - a.velocity)
      .slice(0, 20),
  });
});

export default app;
