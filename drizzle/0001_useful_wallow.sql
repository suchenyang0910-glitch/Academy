ALTER TABLE `enrollments` ADD `started_on` text DEFAULT CURRENT_DATE NOT NULL;--> statement-breakpoint
ALTER TABLE `submissions` ADD `completed_on` text;--> statement-breakpoint
UPDATE `submissions`
SET `completed_on` = date(`updated_at`)
WHERE `status` = 'completed' AND `completed_on` IS NULL;
