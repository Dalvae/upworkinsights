-- Analytics RPC functions: push aggregation to PostgreSQL instead of fetching rows to JS

-- Overview stats in a single query
CREATE OR REPLACE FUNCTION analytics_overview()
RETURNS JSON AS $$
  SELECT json_build_object(
    'total_jobs', COUNT(*),
    'jobs_today', COUNT(*) FILTER (WHERE first_seen_at >= CURRENT_DATE),
    'avg_fixed_budget', ROUND(AVG(fixed_budget) FILTER (WHERE job_type = 'fixed' AND fixed_budget IS NOT NULL), 2),
    'fixed_count', COUNT(*) FILTER (WHERE job_type = 'fixed'),
    'hourly_count', COUNT(*) FILTER (WHERE job_type = 'hourly'),
    'tier_breakdown', (
      SELECT COALESCE(json_object_agg(COALESCE(tier, 'unknown'), cnt), '{}')
      FROM (SELECT tier, COUNT(*) AS cnt FROM jobs GROUP BY tier) t
    ),
    'top_countries', (
      SELECT COALESCE(json_agg(row_to_json(c) ORDER BY c.count DESC), '[]')
      FROM (
        SELECT COALESCE(client_country, 'Unknown') AS country, COUNT(*) AS count
        FROM jobs GROUP BY client_country ORDER BY count DESC LIMIT 10
      ) c
    )
  ) FROM jobs;
$$ LANGUAGE sql STABLE;

-- Budget distribution with SQL CASE bucketing
CREATE OR REPLACE FUNCTION analytics_budgets()
RETURNS JSON AS $$
  SELECT json_build_object(
    'fixed', (
      SELECT COALESCE(json_agg(json_build_object('label', label, 'count', cnt) ORDER BY idx), '[]')
      FROM (
        SELECT
          CASE
            WHEN fixed_budget < 100 THEN '$0-100'
            WHEN fixed_budget < 500 THEN '$100-500'
            WHEN fixed_budget < 1000 THEN '$500-1k'
            WHEN fixed_budget < 5000 THEN '$1k-5k'
            WHEN fixed_budget < 10000 THEN '$5k-10k'
            ELSE '$10k+'
          END AS label,
          CASE
            WHEN fixed_budget < 100 THEN 0
            WHEN fixed_budget < 500 THEN 1
            WHEN fixed_budget < 1000 THEN 2
            WHEN fixed_budget < 5000 THEN 3
            WHEN fixed_budget < 10000 THEN 4
            ELSE 5
          END AS idx,
          COUNT(*) AS cnt
        FROM jobs
        WHERE job_type = 'fixed' AND fixed_budget IS NOT NULL
        GROUP BY label, idx
      ) f
    ),
    'hourly', (
      SELECT COALESCE(json_agg(json_build_object('label', label, 'count', cnt) ORDER BY idx), '[]')
      FROM (
        SELECT
          CASE
            WHEN hourly_max < 25 THEN '$0-25'
            WHEN hourly_max < 50 THEN '$25-50'
            WHEN hourly_max < 75 THEN '$50-75'
            WHEN hourly_max < 100 THEN '$75-100'
            ELSE '$100+'
          END AS label,
          CASE
            WHEN hourly_max < 25 THEN 0
            WHEN hourly_max < 50 THEN 1
            WHEN hourly_max < 75 THEN 2
            WHEN hourly_max < 100 THEN 3
            ELSE 4
          END AS idx,
          COUNT(*) AS cnt
        FROM jobs
        WHERE job_type = 'hourly' AND hourly_max IS NOT NULL
        GROUP BY label, idx
      ) h
    )
  );
$$ LANGUAGE sql STABLE;

-- Daily trends aggregated in SQL
CREATE OR REPLACE FUNCTION analytics_trends(start_date TIMESTAMPTZ)
RETURNS JSON AS $$
  WITH daily AS (
    SELECT
      created_on::date AS date,
      COUNT(*) AS total_jobs,
      COUNT(*) FILTER (WHERE job_type = 'fixed') AS fixed_count,
      COUNT(*) FILTER (WHERE job_type = 'hourly') AS hourly_count,
      ROUND(AVG(fixed_budget) FILTER (WHERE job_type = 'fixed' AND fixed_budget IS NOT NULL), 2) AS avg_fixed_budget
    FROM jobs
    WHERE created_on >= start_date
    GROUP BY created_on::date
  ),
  tier_counts AS (
    SELECT
      created_on::date AS date,
      COALESCE(tier, 'unknown') AS tier,
      COUNT(*) AS cnt
    FROM jobs
    WHERE created_on >= start_date
    GROUP BY created_on::date, tier
  ),
  tier_json AS (
    SELECT date, json_object_agg(tier, cnt) AS tier_breakdown
    FROM tier_counts
    GROUP BY date
  )
  SELECT COALESCE(json_agg(
    json_build_object(
      'date', d.date,
      'total_jobs', d.total_jobs,
      'fixed_count', d.fixed_count,
      'hourly_count', d.hourly_count,
      'avg_fixed_budget', d.avg_fixed_budget,
      'tier_breakdown', COALESCE(t.tier_breakdown, '{}')
    ) ORDER BY d.date
  ), '[]')
  FROM daily d
  LEFT JOIN tier_json t ON t.date = d.date;
$$ LANGUAGE sql STABLE;

-- Performance indexes for analytics queries
CREATE INDEX IF NOT EXISTS idx_jobs_first_seen_at ON jobs(first_seen_at DESC);
CREATE INDEX IF NOT EXISTS idx_jobs_job_type_fixed_budget ON jobs(job_type, fixed_budget) WHERE job_type = 'fixed' AND fixed_budget IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_jobs_job_type_hourly_max ON jobs(job_type, hourly_max) WHERE job_type = 'hourly' AND hourly_max IS NOT NULL;
