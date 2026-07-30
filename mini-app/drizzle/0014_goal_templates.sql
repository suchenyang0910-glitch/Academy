CREATE TABLE `goal_templates` (
	`id` text PRIMARY KEY NOT NULL,
	`version` text NOT NULL,
	`title` text NOT NULL,
	`slogan` text NOT NULL,
	`artifact` text NOT NULL,
	`definition_of_done_json` text DEFAULT '[]' NOT NULL,
	`status` text DEFAULT 'active' NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE `goal_template_checkpoints` (
	`id` text PRIMARY KEY NOT NULL,
	`template_id` text NOT NULL,
	`day` integer NOT NULL,
	`label` text NOT NULL,
	`title` text NOT NULL,
	`outcome` text NOT NULL,
	`evidence_json` text DEFAULT '[]' NOT NULL,
	`definition_of_done_json` text DEFAULT '[]' NOT NULL,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`template_id`) REFERENCES `goal_templates`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `goal_template_checkpoints_template_day_unique` ON `goal_template_checkpoints` (`template_id`,`day`);--> statement-breakpoint
CREATE INDEX `goal_template_checkpoints_template_order_idx` ON `goal_template_checkpoints` (`template_id`,`sort_order`);
