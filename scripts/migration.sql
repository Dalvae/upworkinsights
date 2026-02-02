-- Upwork Insights Schema
-- Run this in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS jobs (
  id              BIGINT PRIMARY KEY,
  ciphertext      TEXT NOT NULL UNIQUE,
  title           TEXT NOT NULL,
  description     TEXT NOT NULL,
  created_on      TIMESTAMPTZ NOT NULL,
  published_on    TIMESTAMPTZ NOT NULL,
  first_seen_at   TIMESTAMPTZ DEFAULT NOW(),
  last_seen_at    TIMESTAMPTZ DEFAULT NOW(),
  job_type        TEXT NOT NULL,
  duration        TEXT,
  engagement      TEXT,
  fixed_budget    NUMERIC(12,2),
  hourly_min      NUMERIC(8,2),
  hourly_max      NUMERIC(8,2),
  tier            TEXT,
  proposals_tier  TEXT,
  is_premium      BOOLEAN DEFAULT FALSE,
  freelancers_to_hire INTEGER DEFAULT 1,
  is_applied      BOOLEAN DEFAULT FALSE,
  client_country       TEXT,
  client_payment_verified BOOLEAN,
  client_total_spent   NUMERIC(12,2),
  client_total_reviews INTEGER,
  client_total_feedback NUMERIC(3,1),
  client_quality_score NUMERIC(3,1),
  source_url      TEXT,
  search_query    TEXT
);

CREATE TABLE IF NOT EXISTS skills (
  uid         TEXT PRIMARY KEY,
  label       TEXT NOT NULL,
  job_count   INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS job_skills (
  job_id      BIGINT REFERENCES jobs(id) ON DELETE CASCADE,
  skill_uid   TEXT REFERENCES skills(uid) ON DELETE CASCADE,
  is_highlighted BOOLEAN DEFAULT FALSE,
  PRIMARY KEY (job_id, skill_uid)
);

CREATE TABLE IF NOT EXISTS user_profile (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  skills      TEXT[] DEFAULT '{}',
  hourly_rate NUMERIC(8,2),
  preferred_tiers TEXT[],
  min_budget  NUMERIC(10,2),
  api_key     TEXT UNIQUE
);

CREATE TABLE IF NOT EXISTS daily_stats (
  date            DATE PRIMARY KEY,
  total_jobs      INTEGER,
  new_jobs        INTEGER,
  avg_fixed_budget NUMERIC(10,2),
  top_skills      JSONB,
  tier_breakdown  JSONB
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_jobs_created_on ON jobs(created_on DESC);
CREATE INDEX IF NOT EXISTS idx_jobs_tier ON jobs(tier);
CREATE INDEX IF NOT EXISTS idx_jobs_job_type ON jobs(job_type);
CREATE INDEX IF NOT EXISTS idx_jobs_client_country ON jobs(client_country);
CREATE INDEX IF NOT EXISTS idx_jobs_client_quality_score ON jobs(client_quality_score DESC);
CREATE INDEX IF NOT EXISTS idx_job_skills_skill ON job_skills(skill_uid);

-- Trigger to update skill job counts
CREATE OR REPLACE FUNCTION update_skill_job_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE skills SET job_count = job_count + 1 WHERE uid = NEW.skill_uid;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE skills SET job_count = job_count - 1 WHERE uid = OLD.skill_uid;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_skill_count ON job_skills;
CREATE TRIGGER trg_skill_count
AFTER INSERT OR DELETE ON job_skills
FOR EACH ROW EXECUTE FUNCTION update_skill_job_count();

-- Job snapshots: tracks changes over time (proposals, hires, etc.)
CREATE TABLE IF NOT EXISTS job_snapshots (
  id            BIGSERIAL PRIMARY KEY,
  job_id        BIGINT NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  snapshot_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  proposals_tier TEXT,
  freelancers_to_hire INTEGER,
  is_applied    BOOLEAN DEFAULT FALSE
);

CREATE INDEX IF NOT EXISTS idx_snapshots_job_id ON job_snapshots(job_id);
CREATE INDEX IF NOT EXISTS idx_snapshots_at ON job_snapshots(snapshot_at DESC);
CREATE INDEX IF NOT EXISTS idx_snapshots_job_time ON job_snapshots(job_id, snapshot_at);
