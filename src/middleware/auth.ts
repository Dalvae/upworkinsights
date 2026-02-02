import type { Context, Next } from 'hono';

export function requireApiKey() {
  return async (c: Context, next: Next) => {
    const key = c.req.header('Authorization')?.replace('Bearer ', '');
    const expected = c.env?.INGEST_API_KEY || process.env.INGEST_API_KEY;

    if (!expected) {
      return c.json({ error: 'Server not configured for authentication' }, 500);
    }

    if (!key || key !== expected) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    await next();
  };
}
