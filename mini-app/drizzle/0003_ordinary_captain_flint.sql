CREATE TABLE `subscriptions` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` text NOT NULL,
	`plan_key` text NOT NULL,
	`status` text DEFAULT 'active' NOT NULL,
	`source` text NOT NULL,
	`starts_at` text NOT NULL,
	`ends_at` text NOT NULL,
	`external_ref` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `subscriptions_external_ref_unique` ON `subscriptions` (`external_ref`);--> statement-breakpoint
CREATE INDEX `subscriptions_user_status_end_idx` ON `subscriptions` (`user_id`,`status`,`ends_at`);