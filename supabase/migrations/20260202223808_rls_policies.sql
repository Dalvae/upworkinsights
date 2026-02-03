-- Enable Row Level Security on all tables
--
-- Security model:
-- - Public (anon) users can READ jobs, skills, job_skills, job_snapshots, daily_stats
-- - Public (anon) users CANNOT write to any table
-- - Public (anon) users CANNOT read or write user_profile
-- - The server uses the service_role key to perform all writes, bypassing RLS

-- Enable RLS on all tables
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profile ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_snapshots ENABLE ROW LEVEL SECURITY;

-- Public read access for jobs
CREATE POLICY "Public read access for jobs"
  ON jobs FOR SELECT
  TO anon
  USING (true);

-- Public read access for skills
CREATE POLICY "Public read access for skills"
  ON skills FOR SELECT
  TO anon
  USING (true);

-- Public read access for job_skills
CREATE POLICY "Public read access for job_skills"
  ON job_skills FOR SELECT
  TO anon
  USING (true);

-- Public read access for job_snapshots
CREATE POLICY "Public read access for job_snapshots"
  ON job_snapshots FOR SELECT
  TO anon
  USING (true);

-- Public read access for daily_stats
CREATE POLICY "Public read access for daily_stats"
  ON daily_stats FOR SELECT
  TO anon
  USING (true);

-- No public access for user_profile (no policies for anon = denied by default)
-- The service_role key will bypass RLS for writes to all tables
