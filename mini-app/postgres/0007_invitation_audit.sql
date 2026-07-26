ALTER TABLE invitations
ADD COLUMN IF NOT EXISTS status_reason text;

ALTER TABLE invitations
ADD COLUMN IF NOT EXISTS risk_level text NOT NULL DEFAULT 'low';

ALTER TABLE invitations
ADD COLUMN IF NOT EXISTS risk_signals_json text NOT NULL DEFAULT '[]';

ALTER TABLE invitations
ADD COLUMN IF NOT EXISTS reward_granted_at text;

ALTER TABLE invitations
ADD COLUMN IF NOT EXISTS reviewed_at text;

ALTER TABLE invitations
ADD COLUMN IF NOT EXISTS reviewed_by text;
