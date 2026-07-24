CREATE TABLE `invitations` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`inviter_user_id` text NOT NULL,
	`invited_user_id` text NOT NULL,
	`invite_code` text NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`qualified_at` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`inviter_user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`invited_user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `invitations_invited_user_unique` ON `invitations` (`invited_user_id`);--> statement-breakpoint
CREATE INDEX `invitations_inviter_status_idx` ON `invitations` (`inviter_user_id`,`status`);--> statement-breakpoint
ALTER TABLE `users` ADD `telegram_username` text;--> statement-breakpoint
ALTER TABLE `users` ADD `first_name` text;--> statement-breakpoint
ALTER TABLE `users` ADD `last_name` text;--> statement-breakpoint
ALTER TABLE `users` ADD `language_code` text;--> statement-breakpoint
ALTER TABLE `users` ADD `photo_url` text;--> statement-breakpoint
ALTER TABLE `users` ADD `is_premium` integer DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `referral_code` text;--> statement-breakpoint
CREATE UNIQUE INDEX `users_referral_code_unique` ON `users` (`referral_code`);