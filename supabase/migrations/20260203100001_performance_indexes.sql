-- Additional performance indexes

-- For sorting by fixed_budget and proposals_tier
CREATE INDEX IF NOT EXISTS idx_jobs_fixed_budget ON jobs(fixed_budget DESC NULLS LAST);
CREATE INDEX IF NOT EXISTS idx_jobs_proposals_tier ON jobs(proposals_tier);
