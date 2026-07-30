CREATE TABLE IF NOT EXISTS goal_templates (
  id TEXT PRIMARY KEY,
  version TEXT NOT NULL,
  title TEXT NOT NULL,
  slogan TEXT NOT NULL,
  artifact TEXT NOT NULL,
  definition_of_done_json TEXT NOT NULL DEFAULT '[]',
  status TEXT NOT NULL DEFAULT 'active',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP::text,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP::text
);

CREATE TABLE IF NOT EXISTS goal_template_checkpoints (
  id TEXT PRIMARY KEY,
  template_id TEXT NOT NULL REFERENCES goal_templates(id),
  day INTEGER NOT NULL,
  label TEXT NOT NULL,
  title TEXT NOT NULL,
  outcome TEXT NOT NULL,
  evidence_json TEXT NOT NULL DEFAULT '[]',
  definition_of_done_json TEXT NOT NULL DEFAULT '[]',
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP::text,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP::text
);

CREATE UNIQUE INDEX IF NOT EXISTS goal_template_checkpoints_template_day_unique
  ON goal_template_checkpoints(template_id, day);

CREATE INDEX IF NOT EXISTS goal_template_checkpoints_template_order_idx
  ON goal_template_checkpoints(template_id, sort_order);
