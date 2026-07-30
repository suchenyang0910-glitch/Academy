CREATE TABLE `competency_nodes` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`description` text NOT NULL,
	`level` integer DEFAULT 1 NOT NULL,
	`category` text DEFAULT 'ai' NOT NULL,
	`weight` integer DEFAULT 20 NOT NULL,
	`evidence_policy_json` text DEFAULT '{}' NOT NULL,
	`status` text DEFAULT 'active' NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE INDEX `competency_nodes_category_status_idx` ON `competency_nodes` (`category`,`status`);--> statement-breakpoint
CREATE INDEX `competency_nodes_level_idx` ON `competency_nodes` (`level`);
