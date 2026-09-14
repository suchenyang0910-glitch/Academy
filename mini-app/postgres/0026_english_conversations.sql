CREATE TABLE english_conversations (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  lesson_id TEXT NOT NULL REFERENCES lessons(id),
  scenario TEXT NOT NULL,
  level TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  messages_json TEXT NOT NULL,
  feedback_json TEXT,
  version INTEGER NOT NULL DEFAULT 0,
  start_request_id TEXT NOT NULL,
  last_request_id TEXT,
  lock_token TEXT,
  lock_until BIGINT NOT NULL DEFAULT 0,
  provider TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  UNIQUE (user_id, start_request_id)
);
CREATE INDEX english_conversations_user_lesson_idx ON english_conversations(user_id, lesson_id, created_at);
CREATE TABLE english_conversation_usage (
  user_id TEXT NOT NULL REFERENCES users(id),
  day_key TEXT NOT NULL,
  requests INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (user_id, day_key)
);
