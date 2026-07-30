CREATE TABLE `knowledge_sources` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`source_type` text NOT NULL,
	`title` text NOT NULL,
	`source_url` text,
	`canonical_ref` text NOT NULL,
	`license` text,
	`relevance` text DEFAULT 'unclassified' NOT NULL,
	`status` text DEFAULT 'pending_review' NOT NULL,
	`review_notes` text,
	`metadata_json` text DEFAULT '{}' NOT NULL,
	`created_by` text,
	`reviewed_by` text,
	`reviewed_at` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `knowledge_sources_canonical_ref_unique` ON `knowledge_sources` (`canonical_ref`);--> statement-breakpoint
CREATE INDEX `knowledge_sources_status_created_idx` ON `knowledge_sources` (`status`,`created_at`);--> statement-breakpoint
CREATE INDEX `knowledge_sources_type_status_idx` ON `knowledge_sources` (`source_type`,`status`);
