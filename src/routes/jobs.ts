import { Hono } from 'hono';
import type { SupabaseClient } from '@supabase/supabase-js';
import { computeMatchScore } from '../lib/matching';

type Env = { Variables: { db: SupabaseClient } };
const app = new Hono<Env>();

const ALLOWED_SORT_COLUMNS = [
  'created_on',
  'published_on',
  'tier',
  'job_type',
  'client_quality_score',
  'fixed_budget',
  'hourly_min',
  'hourly_max',
  'proposals_tier',
];

app.get('/jobs', async (c) => {
  const db = c.get('db');
  const { tier, job_type, skill, country, q, page = '1', limit = '20', sort = 'created_on', order = 'desc' } = c.req.query();

  const pageNum = Math.max(1, parseInt(page));
  const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
  const offset = (pageNum - 1) * limitNum;

  const safeSort = ALLOWED_SORT_COLUMNS.includes(sort) ? sort : 'created_on';
  const safeQ = q ? q.replace(/[.,()]/g, '') : undefined;

  let query = db.from('jobs').select('*, job_skills(skill_uid, is_highlighted, skills(label))', { count: 'exact' });

  if (tier) query = query.eq('tier', tier);
  if (job_type) query = query.eq('job_type', job_type);
  if (country) query = query.eq('client_country', country);
  if (safeQ) query = query.or(`title.ilike.%${safeQ}%,description.ilike.%${safeQ}%`);
  if (skill) query = query.filter('job_skills.skill_uid', 'eq', skill);

  query = query.order(safeSort, { ascending: order === 'asc' }).range(offset, offset + limitNum - 1);

  const { data: jobs, error, count } = await query;

  if (error) return c.json({ error: error.message }, 500);

  return c.json({
    jobs,
    pagination: {
      page: pageNum,
      limit: limitNum,
      total: count || 0,
      pages: Math.ceil((count || 0) / limitNum),
    },
  });
});

app.get('/jobs/:id', async (c) => {
  const db = c.get('db');
  const id = c.req.param('id');

  const { data: job, error } = await db
    .from('jobs')
    .select('*, job_skills(skill_uid, is_highlighted, skills(uid, label))')
    .eq('id', id)
    .single();

  if (error || !job) return c.json({ error: 'Job not found' }, 404);

  const { data: profile } = await db.from('user_profile').select('*').limit(1).single();

  let matchScore = null;
  if (profile) {
    const jobSkillLabels = (job.job_skills || []).map((js: any) => js.skills?.label).filter(Boolean);
    matchScore = computeMatchScore(job, jobSkillLabels, profile);
  }

  return c.json({ ...job, match_score: matchScore });
});

app.get('/jobs/:id/history', async (c) => {
  const db = c.get('db');
  const id = c.req.param('id');

  const { data: snapshots, error } = await db
    .from('job_snapshots')
    .select('*')
    .eq('job_id', id)
    .order('snapshot_at', { ascending: true });

  if (error) return c.json({ error: error.message }, 500);

  return c.json({ snapshots: snapshots || [] });
});

export default app;
