CREATE TABLE IF NOT EXISTS uploaded_artifacts (
  id BIGSERIAL PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  purpose TEXT NOT NULL DEFAULT 'project_milestone',
  original_filename TEXT NOT NULL,
  stored_filename TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  size_bytes INTEGER NOT NULL,
  sha256 TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'stored',
  related_source_type TEXT,
  related_source_ref TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS uploaded_artifacts_user_created_idx
  ON uploaded_artifacts(user_id, created_at);

CREATE INDEX IF NOT EXISTS uploaded_artifacts_sha256_idx
  ON uploaded_artifacts(sha256);

CREATE INDEX IF NOT EXISTS uploaded_artifacts_related_source_idx
  ON uploaded_artifacts(related_source_type, related_source_ref);
