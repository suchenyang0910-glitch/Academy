CREATE TABLE `conversion_events` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` text NOT NULL,
	`event_type` text NOT NULL,
	`plan_key` text,
	`metadata_json` text DEFAULT '{}' NOT NULL,
	`occurred_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `conversion_events_type_time_idx` ON `conversion_events` (`event_type`,`occurred_at`);--> statement-breakpoint
CREATE INDEX `conversion_events_user_type_idx` ON `conversion_events` (`user_id`,`event_type`);
