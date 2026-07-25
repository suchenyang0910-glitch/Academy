CREATE TABLE `campaign_rewards` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`status` text DEFAULT 'draft' NOT NULL,
	`reward_mode` text DEFAULT 'discount' NOT NULL,
	`main_offer_type` text DEFAULT 'campaign' NOT NULL,
	`stackable_with_credits` integer DEFAULT 0 NOT NULL,
	`budget_cap_minor` integer,
	`start_at` text NOT NULL,
	`end_at` text NOT NULL,
	`eligibility_rule_json` text DEFAULT '{}' NOT NULL,
	`settlement_rule_version` text DEFAULT 'v1' NOT NULL,
	`created_by` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE INDEX `campaign_rewards_status_window_idx` ON `campaign_rewards` (`status`,`start_at`,`end_at`);
--> statement-breakpoint
CREATE INDEX `campaign_rewards_end_at_idx` ON `campaign_rewards` (`end_at`);
--> statement-breakpoint
CREATE TABLE `order_pricing_snapshots` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`plan_key` text NOT NULL,
	`currency` text NOT NULL,
	`original_amount_minor` integer NOT NULL,
	`main_offer_type` text DEFAULT 'none' NOT NULL,
	`main_offer_id` text,
	`main_discount_amount_minor` integer DEFAULT 0 NOT NULL,
	`credits_redeemed_points` integer DEFAULT 0 NOT NULL,
	`credits_redeemed_amount_minor` integer DEFAULT 0 NOT NULL,
	`final_payable_amount_minor` integer NOT NULL,
	`anchor_rate_version` text NOT NULL,
	`pricing_rule_version` text NOT NULL,
	`status` text DEFAULT 'preview' NOT NULL,
	`idempotency_key` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `order_pricing_snapshots_idempotency_key_unique` ON `order_pricing_snapshots` (`idempotency_key`);
--> statement-breakpoint
CREATE INDEX `order_pricing_snapshots_user_created_idx` ON `order_pricing_snapshots` (`user_id`,`created_at`);
--> statement-breakpoint
CREATE INDEX `order_pricing_snapshots_status_created_idx` ON `order_pricing_snapshots` (`status`,`created_at`);
--> statement-breakpoint
CREATE TABLE `credits_ledger` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` text NOT NULL,
	`entry_type` text NOT NULL,
	`reward_type` text NOT NULL,
	`amount_points` integer NOT NULL,
	`status` text DEFAULT 'posted' NOT NULL,
	`business_key` text NOT NULL,
	`related_order_id` integer,
	`related_invitation_id` integer,
	`related_campaign_reward_id` text,
	`expires_at` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`related_order_id`) REFERENCES `payment_orders`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`related_invitation_id`) REFERENCES `invitations`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`related_campaign_reward_id`) REFERENCES `campaign_rewards`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `credits_ledger_business_key_unique` ON `credits_ledger` (`business_key`);
--> statement-breakpoint
CREATE INDEX `credits_ledger_user_created_idx` ON `credits_ledger` (`user_id`,`created_at`);
--> statement-breakpoint
CREATE INDEX `credits_ledger_user_status_expires_idx` ON `credits_ledger` (`user_id`,`status`,`expires_at`);
