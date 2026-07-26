ALTER TABLE users ADD COLUMN reminder_enabled integer NOT NULL DEFAULT 1;
ALTER TABLE users ADD COLUMN reminder_hour integer NOT NULL DEFAULT 20;
ALTER TABLE users ADD COLUMN dnd_start_hour integer;
ALTER TABLE users ADD COLUMN dnd_end_hour integer;
