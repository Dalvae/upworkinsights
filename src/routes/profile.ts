import { Hono } from 'hono';
import type { SupabaseClient } from '@supabase/supabase-js';
import { requireApiKey } from '../middleware/auth';

type Env = { Variables: { db: SupabaseClient; serviceDb: SupabaseClient } };
const app = new Hono<Env>();

app.get('/profile', async (c) => {
  const db = c.get('db');
  const { data: profile } = await db.from('user_profile').select('*').limit(1).single();

  if (!profile) {
    return c.json({ skills: [], hourly_rate: null, preferred_tiers: [], min_budget: null, api_key: null });
  }

  const { api_key, ...safeProfile } = profile;
  return c.json(safeProfile);
});

app.put('/profile', async (c) => {
  const db = c.get('serviceDb');
  const body = await c.req.json();

  const { data: existing } = await db.from('user_profile').select('id').limit(1).single();

  const profileData = {
    skills: body.skills || [],
    hourly_rate: body.hourly_rate || null,
    preferred_tiers: body.preferred_tiers || [],
    min_budget: body.min_budget || null,
    api_key: body.api_key || null,
  };

  if (existing) {
    const { data, error } = await db.from('user_profile').update(profileData).eq('id', existing.id).select().single();
    if (error) return c.json({ error: error.message }, 500);
    return c.json(data);
  } else {
    const { data, error } = await db.from('user_profile').insert(profileData).select().single();
    if (error) return c.json({ error: error.message }, 500);
    return c.json(data);
  }
});

export default app;
