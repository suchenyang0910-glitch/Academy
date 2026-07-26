ALTER TABLE reminder_events ADD COLUMN delivery_status text NOT NULL DEFAULT 'queued';
ALTER TABLE reminder_events ADD COLUMN delivered_at text;
ALTER TABLE reminder_events ADD COLUMN completed_submission_id integer REFERENCES submissions(id);
