ALTER TABLE `enrollments` ADD COLUMN `sort_order` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
CREATE INDEX `enrollments_user_active_sort_idx` ON `enrollments` (`user_id`,`active`,`sort_order`);
