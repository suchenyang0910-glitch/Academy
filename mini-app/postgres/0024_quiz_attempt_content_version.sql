ALTER TABLE quiz_attempts
  ADD COLUMN IF NOT EXISTS content_version_id BIGINT REFERENCES course_content_versions(id);

CREATE INDEX IF NOT EXISTS quiz_attempts_content_version_idx
  ON quiz_attempts(content_version_id);
