ALTER TABLE enrollments ADD COLUMN sort_order INTEGER NOT NULL DEFAULT 0;
CREATE INDEX enrollments_user_active_sort_idx ON enrollments(user_id, active, sort_order);
