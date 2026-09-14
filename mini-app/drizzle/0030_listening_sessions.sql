CREATE TABLE `listening_sessions` (
  `id` text PRIMARY KEY NOT NULL,
  `user_id` text NOT NULL,
  `lesson_id` text NOT NULL,
  `material_id` text NOT NULL,
  `material_version` text NOT NULL,
  `question_set_id` text NOT NULL,
  `mode` text NOT NULL,
  `stage` text DEFAULT 'ready' NOT NULL,
  `answers_draft_json` text DEFAULT '{}' NOT NULL,
  `support_json` text DEFAULT '{}' NOT NULL,
  `status` text DEFAULT 'active' NOT NULL,
  `version` integer DEFAULT 0 NOT NULL,
  `prior_exposure` integer DEFAULT 0 NOT NULL,
  `start_request_id` text NOT NULL,
  `last_request_id` text,
  `created_at` text NOT NULL,
  `updated_at` text NOT NULL,
  `completed_at` text,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
  FOREIGN KEY (`lesson_id`) REFERENCES `lessons`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `listening_sessions_user_request_idx` ON `listening_sessions` (`user_id`,`start_request_id`);
--> statement-breakpoint
CREATE INDEX `listening_sessions_user_lesson_updated_idx` ON `listening_sessions` (`user_id`,`lesson_id`,`updated_at`);
--> statement-breakpoint
CREATE TABLE `listening_events` (
  `id` text PRIMARY KEY NOT NULL,
  `user_id` text NOT NULL,
  `session_id` text NOT NULL,
  `request_id` text NOT NULL,
  `sequence` integer NOT NULL,
  `type` text NOT NULL,
  `payload_json` text DEFAULT '{}' NOT NULL,
  `created_at` text NOT NULL,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
  FOREIGN KEY (`session_id`) REFERENCES `listening_sessions`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `listening_events_user_request_idx` ON `listening_events` (`user_id`,`request_id`);
--> statement-breakpoint
CREATE TABLE `listening_attempts` (
  `id` text PRIMARY KEY NOT NULL,
  `user_id` text NOT NULL,
  `session_id` text NOT NULL,
  `material_version` text NOT NULL,
  `question_set_id` text NOT NULL,
  `request_id` text NOT NULL,
  `answers_json` text NOT NULL,
  `correct_count` integer NOT NULL,
  `question_count` integer NOT NULL,
  `support_snapshot_json` text DEFAULT '{}' NOT NULL,
  `prior_exposure` integer DEFAULT 0 NOT NULL,
  `submitted_at` text NOT NULL,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
  FOREIGN KEY (`session_id`) REFERENCES `listening_sessions`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `listening_attempts_user_request_idx` ON `listening_attempts` (`user_id`,`request_id`);
