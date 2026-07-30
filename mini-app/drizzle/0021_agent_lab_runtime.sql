CREATE TABLE `agent_lab_projects` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` text NOT NULL,
	`template_id` text NOT NULL,
	`builder_provider` text DEFAULT 'flowise' NOT NULL,
	`builder_project_ref` text,
	`workflow_ref` text,
	`workflow_export_json` text DEFAULT '{}' NOT NULL,
	`status` text DEFAULT 'draft' NOT NULL,
	`runtime_status` text DEFAULT 'not_tested' NOT NULL,
	`metadata_json` text DEFAULT '{}' NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`template_id`) REFERENCES `goal_templates`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `agent_lab_projects_user_template_provider_unique` ON `agent_lab_projects` (`user_id`,`template_id`,`builder_provider`);--> statement-breakpoint
CREATE INDEX `agent_lab_projects_user_status_idx` ON `agent_lab_projects` (`user_id`,`status`);--> statement-breakpoint
CREATE INDEX `agent_lab_projects_provider_status_idx` ON `agent_lab_projects` (`builder_provider`,`status`);--> statement-breakpoint
CREATE TABLE `agent_runtime_checks` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` text NOT NULL,
	`agent_project_id` integer NOT NULL,
	`check_type` text DEFAULT 'manual_runtime' NOT NULL,
	`test_cases_json` text DEFAULT '[]' NOT NULL,
	`result_json` text DEFAULT '{}' NOT NULL,
	`status` text DEFAULT 'recorded' NOT NULL,
	`score` real DEFAULT 0 NOT NULL,
	`notes` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`agent_project_id`) REFERENCES `agent_lab_projects`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `agent_runtime_checks_project_created_idx` ON `agent_runtime_checks` (`agent_project_id`,`created_at`);--> statement-breakpoint
CREATE INDEX `agent_runtime_checks_user_status_idx` ON `agent_runtime_checks` (`user_id`,`status`);
