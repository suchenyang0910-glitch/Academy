CREATE TABLE IF NOT EXISTS competency_nodes (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  level INTEGER NOT NULL DEFAULT 1,
  category TEXT NOT NULL DEFAULT 'ai',
  weight INTEGER NOT NULL DEFAULT 20,
  evidence_policy_json TEXT NOT NULL DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS competency_nodes_category_status_idx
  ON competency_nodes(category, status);

CREATE INDEX IF NOT EXISTS competency_nodes_level_idx
  ON competency_nodes(level);
