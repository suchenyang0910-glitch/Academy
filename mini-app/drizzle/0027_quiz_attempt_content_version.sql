ALTER TABLE `quiz_attempts` ADD `content_version_id` integer REFERENCES `course_content_versions`(`id`);
--> statement-breakpoint
CREATE INDEX `quiz_attempts_content_version_idx` ON `quiz_attempts` (`content_version_id`);
