CREATE TABLE `quiz_attempts` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` text NOT NULL,
	`enrollment_id` integer NOT NULL,
	`lesson_id` text NOT NULL,
	`course_id` text NOT NULL,
	`attempt_number` integer NOT NULL,
	`is_revision` integer DEFAULT 0 NOT NULL,
	`question_count` integer NOT NULL,
	`correct_count` integer NOT NULL,
	`score` real DEFAULT 0 NOT NULL,
	`passed` integer DEFAULT 0 NOT NULL,
	`answers_json` text DEFAULT '{}' NOT NULL,
	`submitted_on` text NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`enrollment_id`) REFERENCES `enrollments`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`lesson_id`) REFERENCES `lessons`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`course_id`) REFERENCES `courses`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `quiz_attempts_user_lesson_attempt_unique` ON `quiz_attempts` (`user_id`,`lesson_id`,`attempt_number`);--> statement-breakpoint
CREATE INDEX `quiz_attempts_user_created_idx` ON `quiz_attempts` (`user_id`,`created_at`);--> statement-breakpoint
CREATE INDEX `quiz_attempts_course_lesson_idx` ON `quiz_attempts` (`course_id`,`lesson_id`);
