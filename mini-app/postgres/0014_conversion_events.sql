CREATE TABLE IF NOT EXISTS conversion_events (
  id BIGSERIAL PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  event_type TEXT NOT NULL,
  plan_key TEXT,
  metadata_json TEXT NOT NULL DEFAULT '{}',
  occurred_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS conversion_events_type_time_idx
  ON conversion_events(event_type, occurred_at);

CREATE INDEX IF NOT EXISTS conversion_events_user_type_idx
  ON conversion_events(user_id, event_type);
