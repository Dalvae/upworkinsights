-- Add hiring activity fields from Upwork's clientActivity data
-- Captured when user visits a job detail page

ALTER TABLE jobs ADD COLUMN IF NOT EXISTS job_status TEXT;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS total_hired INTEGER DEFAULT 0;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS total_applicants INTEGER;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS total_invited_to_interview INTEGER DEFAULT 0;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS invitations_sent INTEGER DEFAULT 0;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS unanswered_invites INTEGER DEFAULT 0;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS last_buyer_activity TIMESTAMPTZ;

-- Add total_hired to snapshots for tracking hire changes over time
ALTER TABLE job_snapshots ADD COLUMN IF NOT EXISTS total_hired INTEGER;
ALTER TABLE job_snapshots ADD COLUMN IF NOT EXISTS total_applicants INTEGER;

-- Index for filtering by status and hired
CREATE INDEX IF NOT EXISTS idx_jobs_status ON jobs(job_status);
CREATE INDEX IF NOT EXISTS idx_jobs_total_hired ON jobs(total_hired);
