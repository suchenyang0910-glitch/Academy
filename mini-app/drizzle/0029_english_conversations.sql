CREATE TABLE `english_conversation_usage` (
	`user_id` text NOT NULL,
	`day_key` text NOT NULL,
	`requests` integer DEFAULT 0 NOT NULL,
	PRIMARY KEY(`user_id`, `day_key`),
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `english_conversations` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`lesson_id` text NOT NULL,
	`scenario` text NOT NULL,
	`level` text NOT NULL,
	`status` text DEFAULT 'active' NOT NULL,
	`messages_json` text NOT NULL,
	`feedback_json` text,
	`version` integer DEFAULT 0 NOT NULL,
	`start_request_id` text NOT NULL,
	`last_request_id` text,
	`lock_token` text,
	`lock_until` integer DEFAULT 0 NOT NULL,
	`provider` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`lesson_id`) REFERENCES `lessons`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `english_conversations_user_request_idx` ON `english_conversations` (`user_id`,`start_request_id`);--> statement-breakpoint
CREATE INDEX `english_conversations_user_lesson_idx` ON `english_conversations` (`user_id`,`lesson_id`,`created_at`);