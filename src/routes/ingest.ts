import { Hono } from 'hono';
import type { SupabaseClient } from '@supabase/supabase-js';
import { normalizeJob, extractSkills } from '../lib/normalize';
import type { IngestPayload, RawUpworkJob } from '../types';
import { requireApiKey } from '../middleware/auth';

type Env = { Variables: { db: SupabaseClient; serviceDb: SupabaseClient } };

const app = new Hono<Env>();

async function upsertJobAndSkills(db: SupabaseClient, raw: RawUpworkJob, sourceUrl?: string | null) {
  const job = normalizeJob(raw, sourceUrl, null);
  const skills = extractSkills(raw);

  // Check if job already exists to detect changes
  const { data: existing } = await db
    .from('jobs')
    .select('id, proposals_tier, freelancers_to_hire, is_applied')
    .eq('ciphertext', job.ciphertext)
    .single();

  const shouldSnapshot = !existing ||
    existing.proposals_tier !== job.proposals_tier ||
    existing.freelancers_to_hire !== job.freelancers_to_hire ||
    existing.is_applied !== job.is_applied;

  // Upsert the job (same as before)
  const { error: jobError } = await db.from('jobs').upsert(
    {
      id: job.id,
      ciphertext: job.ciphertext,
      title: job.title,
      description: job.description,
      created_on: job.created_on,
      published_on: job.published_on,
      last_seen_at: new Date().toISOString(),
      job_type: job.job_type,
      duration: job.duration,
      engagement: job.engagement,
      fixed_budget: job.fixed_budget,
      hourly_min: job.hourly_min,
      hourly_max: job.hourly_max,
      tier: job.tier,
      proposals_tier: job.proposals_tier,
      is_premium: job.is_premium,
      freelancers_to_hire: job.freelancers_to_hire,
      is_applied: job.is_applied,
      client_country: job.client_country,
      client_payment_verified: job.client_payment_verified,
      client_total_spent: job.client_total_spent,
      client_total_reviews: job.client_total_reviews,
      client_total_feedback: job.client_total_feedback,
      client_quality_score: job.client_quality_score,
      source_url: job.source_url,
      search_query: job.search_query,
    },
    { onConflict: 'ciphertext' }
  );

  if (jobError) throw jobError;

  // Save snapshot if this is new or something changed
  if (shouldSnapshot) {
    await db.from('job_snapshots').insert({
      job_id: job.id,
      proposals_tier: job.proposals_tier,
      freelancers_to_hire: job.freelancers_to_hire,
      is_applied: job.is_applied,
    });
  }

  for (const skill of skills) {
    await db.from('skills').upsert({ uid: skill.uid, label: skill.label }, { onConflict: 'uid' });
    await db
      .from('job_skills')
      .upsert(
        { job_id: job.id, skill_uid: skill.uid, is_highlighted: skill.is_highlighted },
        { onConflict: 'job_id,skill_uid' }
      );
  }
}

app.post('/ingest', requireApiKey(), async (c) => {
  const db = c.get('serviceDb');
  const payload: IngestPayload = await c.req.json();

  if (!payload.jobs || !Array.isArray(payload.jobs)) {
    return c.json({ error: 'Invalid payload: jobs array required' }, 400);
  }

  let inserted = 0;
  let errors = 0;

  for (const raw of payload.jobs) {
    try {
      await upsertJobAndSkills(db, raw, payload.url);
      inserted++;
    } catch (e) {
      console.error('Ingest error:', e);
      errors++;
    }
  }

  return c.json({ ok: true, received: payload.jobs.length, inserted, errors });
});

app.post('/import/bulk', requireApiKey(), async (c) => {
  const db = c.get('serviceDb');
  const body = await c.req.json();

  let allJobs: RawUpworkJob[] = [];
  let sourceUrl: string | null = null;

  if (Array.isArray(body)) {
    for (const payload of body) {
      if (payload.jobs) allJobs.push(...payload.jobs);
    }
  } else if (body.jobs) {
    allJobs = body.jobs;
    sourceUrl = body.url || null;
  }

  if (allJobs.length === 0) {
    return c.json({ error: 'No jobs found in payload' }, 400);
  }

  let inserted = 0;
  let errors = 0;

  for (const raw of allJobs) {
    try {
      await upsertJobAndSkills(db, raw, sourceUrl);
      inserted++;
    } catch (e) {
      errors++;
    }
  }

  return c.json({ ok: true, total: allJobs.length, inserted, errors });
});

export default app;
