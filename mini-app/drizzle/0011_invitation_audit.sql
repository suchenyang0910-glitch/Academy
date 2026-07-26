ALTER TABLE invitations ADD COLUMN status_reason text;
ALTER TABLE invitations ADD COLUMN risk_level text NOT NULL DEFAULT 'low';
ALTER TABLE invitations ADD COLUMN risk_signals_json text NOT NULL DEFAULT '[]';
ALTER TABLE invitations ADD COLUMN reward_granted_at text;
ALTER TABLE invitations ADD COLUMN reviewed_at text;
ALTER TABLE invitations ADD COLUMN reviewed_by text;
