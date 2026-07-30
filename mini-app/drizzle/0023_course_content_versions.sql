CREATE TABLE `course_content_versions` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`course_id` text NOT NULL,
	`version` text NOT NULL,
	`source_ref` text DEFAULT 'academy_seed' NOT NULL,
	`status` text DEFAULT 'draft' NOT NULL,
	`change_summary` text DEFAULT '' NOT NULL,
	`created_by` text,
	`reviewed_by` text,
	`reviewed_at` text,
	`published_at` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`course_id`) REFERENCES `courses`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `course_content_versions_course_version_unique` ON `course_content_versions` (`course_id`,`version`);--> statement-breakpoint
CREATE INDEX `course_content_versions_status_updated_idx` ON `course_content_versions` (`status`,`updated_at`);--> statement-breakpoint
CREATE INDEX `course_content_versions_course_status_idx` ON `course_content_versions` (`course_id`,`status`);
