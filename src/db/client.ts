import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const clientCache = new Map<string, SupabaseClient>();

function getCachedClient(url: string, key: string): SupabaseClient {
  const cacheKey = `${url}:${key}`;
  let client = clientCache.get(cacheKey);
  if (!client) {
    client = createClient(url, key);
    clientCache.set(cacheKey, client);
  }
  return client;
}

export function getDb(env: { SUPABASE_URL: string; SUPABASE_ANON_KEY: string }): SupabaseClient {
  if (!env.SUPABASE_URL || !env.SUPABASE_ANON_KEY) {
    throw new Error('Missing SUPABASE_URL or SUPABASE_ANON_KEY');
  }
  return getCachedClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY);
}

export function getServiceDb(env: { SUPABASE_URL: string; SUPABASE_SERVICE_KEY?: string }): SupabaseClient {
  if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_KEY) {
    throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_KEY');
  }
  return getCachedClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_KEY);
}
