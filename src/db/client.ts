import { createClient, type SupabaseClient } from '@supabase/supabase-js';

let client: SupabaseClient | null = null;
let serviceClient: SupabaseClient | null = null;

export function getDb(env?: { SUPABASE_URL: string; SUPABASE_ANON_KEY: string }): SupabaseClient {
  if (client) return client;

  const url = env?.SUPABASE_URL || process.env.SUPABASE_URL;
  const key = env?.SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

  if (!url || !key) throw new Error('Missing SUPABASE_URL or SUPABASE_ANON_KEY');

  client = createClient(url, key);
  return client;
}

export function getServiceDb(env?: { SUPABASE_URL: string; SUPABASE_SERVICE_KEY?: string }): SupabaseClient {
  if (serviceClient) return serviceClient;

  const url = env?.SUPABASE_URL || process.env.SUPABASE_URL;
  const key = env?.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_KEY;

  if (!url || !key) throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_KEY');

  serviceClient = createClient(url, key);
  return serviceClient;
}
