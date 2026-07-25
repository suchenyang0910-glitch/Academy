ALTER TABLE `users` ADD `ui_locale` text DEFAULT 'zh-Hans' NOT NULL;
--> statement-breakpoint
CREATE TABLE `course_localizations` (
	`course_id` text NOT NULL,
	`locale` text NOT NULL,
	`title` text NOT NULL,
	`subtitle` text NOT NULL,
	`summary` text NOT NULL,
	`source_version` text DEFAULT 'v1' NOT NULL,
	`review_status` text DEFAULT 'draft' NOT NULL,
	`reviewed_at` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	PRIMARY KEY(`course_id`, `locale`),
	FOREIGN KEY (`course_id`) REFERENCES `courses`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `lesson_localizations` (
	`lesson_id` text NOT NULL,
	`locale` text NOT NULL,
	`title` text NOT NULL,
	`objective` text NOT NULL,
	`content` text NOT NULL,
	`practice_prompt` text NOT NULL,
	`criteria_json` text DEFAULT '[]' NOT NULL,
	`source_version` text DEFAULT 'v1' NOT NULL,
	`review_status` text DEFAULT 'draft' NOT NULL,
	`reviewed_at` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	PRIMARY KEY(`lesson_id`, `locale`),
	FOREIGN KEY (`lesson_id`) REFERENCES `lessons`(`id`) ON UPDATE no action ON DELETE no action
);
