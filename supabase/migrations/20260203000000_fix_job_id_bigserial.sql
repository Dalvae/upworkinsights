-- Fix: Change jobs.id from manual BIGINT to auto-generated BIGSERIAL
-- Problem: parseInt(uid) in JS loses precision for large Upwork UIDs (>2^53),
-- causing different jobs to collide on the same PK and silently fail to insert.

-- 1. Create a sequence for auto-generating IDs
CREATE SEQUENCE IF NOT EXISTS jobs_id_seq;

-- 2. Set the sequence to start after the max existing ID
SELECT setval('jobs_id_seq', COALESCE((SELECT MAX(id) FROM jobs), 0) + 1);

-- 3. Set the default value for id to use the sequence
ALTER TABLE jobs ALTER COLUMN id SET DEFAULT nextval('jobs_id_seq');

-- 4. Bind the sequence to the column so it's dropped if the column is dropped
ALTER SEQUENCE jobs_id_seq OWNED BY jobs.id;
