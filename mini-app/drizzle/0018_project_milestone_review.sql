ALTER TABLE `project_milestones` ADD COLUMN `reviewed_at` text;--> statement-breakpoint
ALTER TABLE `project_milestones` ADD COLUMN `reviewed_by` text;--> statement-breakpoint
CREATE INDEX `project_milestones_status_day_idx` ON `project_milestones` (`status`,`checkpoint_day`);
