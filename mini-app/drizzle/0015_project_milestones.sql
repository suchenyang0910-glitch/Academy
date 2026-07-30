CREATE TABLE `project_milestones` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` text NOT NULL,
	`template_id` text NOT NULL,
	`checkpoint_id` text NOT NULL,
	`checkpoint_day` integer NOT NULL,
	`artifact_url` text,
	`evidence_text` text NOT NULL,
	`evidence_json` text DEFAULT '[]' NOT NULL,
	`status` text DEFAULT 'accepted' NOT NULL,
	`score` real DEFAULT 0 NOT NULL,
	`notes` text,
	`submitted_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`template_id`) REFERENCES `goal_templates`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`checkpoint_id`) REFERENCES `goal_template_checkpoints`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `project_milestones_user_checkpoint_unique` ON `project_milestones` (`user_id`,`template_id`,`checkpoint_id`);--> statement-breakpoint
CREATE INDEX `project_milestones_user_status_idx` ON `project_milestones` (`user_id`,`status`,`checkpoint_day`);
