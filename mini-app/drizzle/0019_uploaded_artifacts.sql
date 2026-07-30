CREATE TABLE `uploaded_artifacts` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` text NOT NULL,
	`purpose` text DEFAULT 'project_milestone' NOT NULL,
	`original_filename` text NOT NULL,
	`stored_filename` text NOT NULL,
	`storage_path` text NOT NULL,
	`mime_type` text NOT NULL,
	`size_bytes` integer NOT NULL,
	`sha256` text NOT NULL,
	`status` text DEFAULT 'stored' NOT NULL,
	`related_source_type` text,
	`related_source_ref` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `uploaded_artifacts_user_created_idx` ON `uploaded_artifacts` (`user_id`,`created_at`);--> statement-breakpoint
CREATE INDEX `uploaded_artifacts_sha256_idx` ON `uploaded_artifacts` (`sha256`);--> statement-breakpoint
CREATE INDEX `uploaded_artifacts_related_source_idx` ON `uploaded_artifacts` (`related_source_type`,`related_source_ref`);
