CREATE TABLE `seed_user_notes` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` text NOT NULL,
	`note_type` text DEFAULT 'follow_up' NOT NULL,
	`completion_source` text,
	`failure_reason` text,
	`status` text DEFAULT 'open' NOT NULL,
	`content` text NOT NULL,
	`recorded_by` text,
	`recorded_on` text DEFAULT CURRENT_DATE NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `seed_user_notes_user_created_idx` ON `seed_user_notes` (`user_id`,`created_at`);--> statement-breakpoint
CREATE INDEX `seed_user_notes_type_status_idx` ON `seed_user_notes` (`note_type`,`status`,`created_at`);--> statement-breakpoint
CREATE INDEX `seed_user_notes_reason_idx` ON `seed_user_notes` (`failure_reason`,`created_at`);
