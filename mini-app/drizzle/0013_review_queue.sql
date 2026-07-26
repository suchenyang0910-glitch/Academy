CREATE TABLE review_queue_items (
  id integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  user_id text NOT NULL REFERENCES users(id),
  source_type text NOT NULL,
  source_ref text NOT NULL,
  course_id text REFERENCES courses(id),
  lesson_id text REFERENCES lessons(id),
  assessment_stage_key text,
  reason text NOT NULL,
  title text NOT NULL,
  recommendation text NOT NULL,
  due_on text NOT NULL,
  status text NOT NULL DEFAULT 'open',
  resolved_at text,
  created_at text NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at text NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE UNIQUE INDEX review_queue_items_user_source_unique
  ON review_queue_items(user_id, source_type, source_ref, reason);
CREATE INDEX review_queue_items_user_status_due_idx
  ON review_queue_items(user_id, status, due_on);
