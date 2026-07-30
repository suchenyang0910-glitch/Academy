CREATE TABLE `competency_proof_shares` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`token` text NOT NULL,
	`user_id` text NOT NULL,
	`status` text DEFAULT 'active' NOT NULL,
	`snapshot_json` text NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`expires_at` text,
	`revoked_at` text,
	`last_viewed_at` text,
	`view_count` integer DEFAULT 0 NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `competency_proof_shares_token_unique` ON `competency_proof_shares` (`token`);--> statement-breakpoint
CREATE INDEX `competency_proof_shares_token_idx` ON `competency_proof_shares` (`token`);--> statement-breakpoint
CREATE INDEX `competency_proof_shares_user_created_idx` ON `competency_proof_shares` (`user_id`,`created_at`);
