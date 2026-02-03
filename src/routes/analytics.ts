import { Hono } from 'hono';
import type { SupabaseClient } from '@supabase/supabase-js';
import { computeMatchScore } from '../lib/matching';
import { proposalMidpoint } from '../lib/constants';
import type { Job, JobWithSkills, UserProfile } from '../types';

type Env = { Variables: { db: SupabaseClient } };
const app = new Hono<Env>();

app.get('/analytics/overview', async (c) => {
  const db = c.get('db');

  const [overviewResult, skillsResult] = await Promise.all([
    db.rpc('analytics_overview'),
    db.from('skills').select('uid, label, job_count').order('job_count', { ascending: false }).limit(15),
  ]);

  const overview = overviewResult.data ?? {
    total_jobs: 0, jobs_today: 0, avg_fixed_budget: 0,
    fixed_count: 0, hourly_count: 0, tier_breakdown: {}, top_countries: [],
  };

  return c.json({
    ...overview,
    top_skills: skillsResult.data || [],
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
  const { data } = await db.rpc('analytics_budgets');
  return c.json(data ?? { fixed: [], hourly: [] });
});

app.get('/analytics/matches', async (c) => {
  const db = c.get('db');
  const { limit = '20' } = c.req.query();

  const { data: profile } = await db.from('user_profile').select('*').limit(1).single();
  if (!profile) return c.json({ error: 'No profile configured' }, 400);

  const { data: jobs } = await db
    .from('jobs')
    .select('id, title, tier, job_type, fixed_budget, hourly_min, hourly_max, client_quality_score, client_country, client_total_spent, client_payment_verified, client_total_feedback, proposals_tier, duration, engagement, job_skills(skill_uid, skills(label))')
    .order('created_on', { ascending: false })
    .limit(200);

  if (!jobs) return c.json({ matches: [] });

  const scored = jobs.map((job) => {
    const jobSkills = (job.job_skills as unknown as JobWithSkills['job_skills']) ?? [];
    const jobSkillLabels = jobSkills.map((js) => js.skills?.label).filter(Boolean) as string[];
    const score = computeMatchScore(job as unknown as Job, jobSkillLabels, profile as UserProfile);
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

  const { data } = await db.rpc('analytics_trends', { start_date: startDate.toISOString() });

  return c.json({ trends: data ?? [] });
});

interface ProposalJob {
  id: number;
  ciphertext: string;
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
  ciphertext: string;
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
    .select('id, ciphertext, title, tier, job_type, fixed_budget, hourly_max, created_on, proposals_tier, first_seen_at')
    .order('created_on', { ascending: false })
    .limit(500);

  if (!jobs || jobs.length === 0) return c.json({ stats: {}, jobs_with_velocity: [] });

  const jobIds = (jobs as ProposalJob[]).map((j) => j.id);
  const { data: snapshots } = await db
    .from('job_snapshots')
    .select('job_id, snapshot_at, proposals_tier')
    .in('job_id', jobIds)
    .order('snapshot_at', { ascending: true });

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
      ciphertext: job.ciphertext,
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
