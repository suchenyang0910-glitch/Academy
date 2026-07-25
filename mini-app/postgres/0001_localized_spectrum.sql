ALTER TABLE users
  ADD COLUMN IF NOT EXISTS ui_locale TEXT NOT NULL DEFAULT 'zh-Hans';

CREATE TABLE IF NOT EXISTS course_localizations (
  course_id TEXT NOT NULL REFERENCES courses(id),
  locale TEXT NOT NULL,
  title TEXT NOT NULL,
  subtitle TEXT NOT NULL,
  summary TEXT NOT NULL,
  source_version TEXT NOT NULL DEFAULT 'v1',
  review_status TEXT NOT NULL DEFAULT 'draft',
  reviewed_at TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP::text,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP::text,
  PRIMARY KEY (course_id, locale)
);
CREATE INDEX IF NOT EXISTS course_localizations_locale_status_idx
  ON course_localizations(locale, review_status);

CREATE TABLE IF NOT EXISTS lesson_localizations (
  lesson_id TEXT NOT NULL REFERENCES lessons(id),
  locale TEXT NOT NULL,
  title TEXT NOT NULL,
  objective TEXT NOT NULL,
  content TEXT NOT NULL,
  practice_prompt TEXT NOT NULL,
  criteria_json TEXT NOT NULL DEFAULT '[]',
  source_version TEXT NOT NULL DEFAULT 'v1',
  review_status TEXT NOT NULL DEFAULT 'draft',
  reviewed_at TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP::text,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP::text,
  PRIMARY KEY (lesson_id, locale)
);
CREATE INDEX IF NOT EXISTS lesson_localizations_locale_status_idx
  ON lesson_localizations(locale, review_status);
