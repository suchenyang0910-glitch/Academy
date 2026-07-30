CREATE TABLE `course_quality_events` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`course_id` text NOT NULL,
	`lesson_id` text,
	`content_version_id` integer,
	`event_type` text NOT NULL,
	`severity` text DEFAULT 'watch' NOT NULL,
	`status` text DEFAULT 'open' NOT NULL,
	`source_type` text NOT NULL,
	`source_ref` text NOT NULL,
	`metrics_json` text DEFAULT '{}' NOT NULL,
	`recommendation` text DEFAULT '' NOT NULL,
	`created_by` text,
	`resolved_by` text,
	`resolved_at` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`course_id`) REFERENCES `courses`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`lesson_id`) REFERENCES `lessons`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`content_version_id`) REFERENCES `course_content_versions`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `course_quality_events_source_unique` ON `course_quality_events` (`source_type`,`source_ref`);--> statement-breakpoint
CREATE INDEX `course_quality_events_status_severity_idx` ON `course_quality_events` (`status`,`severity`,`updated_at`);--> statement-breakpoint
CREATE INDEX `course_quality_events_course_lesson_idx` ON `course_quality_events` (`course_id`,`lesson_id`);
