CREATE TABLE ability_assessments (
  id integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  user_id text NOT NULL REFERENCES users(id),
  course_id text NOT NULL REFERENCES courses(id),
  stage_key text NOT NULL,
  version text NOT NULL DEFAULT 'v1',
  prompt text NOT NULL,
  rubric_json text NOT NULL DEFAULT '[]',
  original_answer text NOT NULL,
  revised_answer text,
  score real NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'submitted',
  notes text,
  created_at text NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at text NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE UNIQUE INDEX ability_assessments_user_course_stage_unique
  ON ability_assessments(user_id, course_id, stage_key);
CREATE INDEX ability_assessments_user_created_idx
  ON ability_assessments(user_id, created_at);
