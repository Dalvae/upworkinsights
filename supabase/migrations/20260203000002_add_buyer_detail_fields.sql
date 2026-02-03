-- Add buyer detail fields from jobAuthDetails page
ALTER TABLE jobs
  ADD COLUMN IF NOT EXISTS client_total_assignments INTEGER,
  ADD COLUMN IF NOT EXISTS client_active_assignments INTEGER,
  ADD COLUMN IF NOT EXISTS client_total_jobs_with_hires INTEGER,
  ADD COLUMN IF NOT EXISTS client_open_jobs INTEGER,
  ADD COLUMN IF NOT EXISTS qualifications JSONB,
  ADD COLUMN IF NOT EXISTS segmentation_data JSONB,
  ADD COLUMN IF NOT EXISTS tools JSONB,
  ADD COLUMN IF NOT EXISTS qualification_matches JSONB;
