CREATE TABLE listening_sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  lesson_id TEXT NOT NULL REFERENCES lessons(id),
  material_id TEXT NOT NULL,
  material_version TEXT NOT NULL,
  question_set_id TEXT NOT NULL,
  mode TEXT NOT NULL,
  stage TEXT NOT NULL DEFAULT 'ready',
  answers_draft_json TEXT NOT NULL DEFAULT '{}',
  support_json TEXT NOT NULL DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'active',
  version INTEGER NOT NULL DEFAULT 0,
  prior_exposure INTEGER NOT NULL DEFAULT 0,
  start_request_id TEXT NOT NULL,
  last_request_id TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP::text,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP::text,
  completed_at TEXT,
  UNIQUE (user_id, start_request_id)
);
CREATE INDEX listening_sessions_user_lesson_updated_idx ON listening_sessions(user_id, lesson_id, updated_at);
CREATE INDEX listening_sessions_user_material_idx ON listening_sessions(user_id, material_id, material_version);

CREATE TABLE listening_events (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  session_id TEXT NOT NULL REFERENCES listening_sessions(id),
  request_id TEXT NOT NULL,
  sequence INTEGER NOT NULL,
  type TEXT NOT NULL,
  payload_json TEXT NOT NULL DEFAULT '{}',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP::text,
  UNIQUE (user_id, request_id)
);
CREATE INDEX listening_events_session_created_idx ON listening_events(session_id, created_at);

CREATE TABLE listening_attempts (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  session_id TEXT NOT NULL REFERENCES listening_sessions(id),
  material_version TEXT NOT NULL,
  question_set_id TEXT NOT NULL,
  request_id TEXT NOT NULL,
  answers_json TEXT NOT NULL,
  correct_count INTEGER NOT NULL,
  question_count INTEGER NOT NULL,
  support_snapshot_json TEXT NOT NULL DEFAULT '{}',
  prior_exposure INTEGER NOT NULL DEFAULT 0,
  submitted_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP::text,
  UNIQUE (user_id, request_id)
);
CREATE INDEX listening_attempts_user_material_set_idx ON listening_attempts(user_id, material_version, question_set_id);
CREATE INDEX listening_attempts_session_submitted_idx ON listening_attempts(session_id, submitted_at);
