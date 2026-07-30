ALTER TABLE project_milestones
  ADD COLUMN IF NOT EXISTS reviewed_at TEXT;

ALTER TABLE project_milestones
  ADD COLUMN IF NOT EXISTS reviewed_by TEXT;

CREATE INDEX IF NOT EXISTS project_milestones_status_day_idx
  ON project_milestones(status, checkpoint_day);
