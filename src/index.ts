import { Hono } from 'hono';
import { cors } from 'hono/cors';
import type { SupabaseClient } from '@supabase/supabase-js';
import { getDb, getServiceDb } from './db/client';
import ingestRoutes from './routes/ingest';
import jobRoutes from './routes/jobs';
import analyticsRoutes from './routes/analytics';
import profileRoutes from './routes/profile';

type Bindings = {
  SUPABASE_URL: string;
  SUPABASE_ANON_KEY: string;
  SUPABASE_SERVICE_KEY?: string;
  INGEST_API_KEY?: string;
};

type Variables = {
  db: SupabaseClient;
  serviceDb: SupabaseClient;
};

const app = new Hono<{ Bindings: Bindings; Variables: Variables }>();

app.use('*', cors({
  origin: '*',
  allowMethods: ['GET', 'POST', 'PUT', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
}));

app.use('*', async (c, next) => {
  const db = getDb({
    SUPABASE_URL: c.env?.SUPABASE_URL || process.env.SUPABASE_URL || '',
    SUPABASE_ANON_KEY: c.env?.SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || '',
  });
  c.set('db', db);

  const serviceDb = getServiceDb({
    SUPABASE_URL: c.env?.SUPABASE_URL || process.env.SUPABASE_URL || '',
    SUPABASE_SERVICE_KEY: c.env?.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_KEY,
  });
  c.set('serviceDb', serviceDb);

  await next();
});

// Cache read-only analytics and jobs list endpoints
app.use('/api/analytics/*', async (c, next) => {
  await next();
  if (c.req.method === 'GET' && c.res.status === 200) {
    c.header('Cache-Control', 'public, max-age=60, stale-while-revalidate=300');
  }
});

app.use('/api/jobs', async (c, next) => {
  await next();
  if (c.req.method === 'GET' && c.res.status === 200) {
    c.header('Cache-Control', 'public, max-age=30, stale-while-revalidate=120');
  }
});

app.route('/api', ingestRoutes);
app.route('/api', jobRoutes);
app.route('/api', analyticsRoutes);
app.route('/api', profileRoutes);

export default {
  port: 8787,
  fetch: app.fetch,
};
