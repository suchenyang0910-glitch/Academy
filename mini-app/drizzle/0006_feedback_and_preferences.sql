CREATE TABLE `feedback` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` text NOT NULL,
	`category` text NOT NULL,
	`content` text NOT NULL,
	`page_context` text,
	`app_version` text,
	`status` text DEFAULT 'open' NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `feedback_status_created_idx` ON `feedback` (`status`,`created_at`);--> statement-breakpoint
CREATE INDEX `feedback_user_created_idx` ON `feedback` (`user_id`,`created_at`);
