ALTER TABLE users
ADD COLUMN IF NOT EXISTS reminder_enabled boolean NOT NULL DEFAULT true;

ALTER TABLE users
ADD COLUMN IF NOT EXISTS reminder_hour integer NOT NULL DEFAULT 20;

ALTER TABLE users
ADD COLUMN IF NOT EXISTS dnd_start_hour integer;

ALTER TABLE users
ADD COLUMN IF NOT EXISTS dnd_end_hour integer;
