ALTER TABLE reminder_events
ADD COLUMN IF NOT EXISTS delivery_status text NOT NULL DEFAULT 'queued';

ALTER TABLE reminder_events
ADD COLUMN IF NOT EXISTS delivered_at text;

ALTER TABLE reminder_events
ADD COLUMN IF NOT EXISTS completed_submission_id bigint REFERENCES submissions(id);
