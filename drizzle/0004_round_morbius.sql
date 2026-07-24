CREATE TABLE `payment_orders` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` text NOT NULL,
	`plan_key` text NOT NULL,
	`invoice_payload` text NOT NULL,
	`amount_stars` integer NOT NULL,
	`recurring` integer DEFAULT false NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `payment_orders_payload_unique` ON `payment_orders` (`invoice_payload`);--> statement-breakpoint
CREATE INDEX `payment_orders_user_status_idx` ON `payment_orders` (`user_id`,`status`);--> statement-breakpoint
CREATE TABLE `payment_transactions` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`order_id` integer NOT NULL,
	`user_id` text NOT NULL,
	`telegram_payment_charge_id` text NOT NULL,
	`provider_payment_charge_id` text,
	`currency` text DEFAULT 'XTR' NOT NULL,
	`amount_stars` integer NOT NULL,
	`subscription_expiration_date` integer,
	`status` text DEFAULT 'paid' NOT NULL,
	`paid_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`refunded_at` text,
	FOREIGN KEY (`order_id`) REFERENCES `payment_orders`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `payment_transactions_charge_unique` ON `payment_transactions` (`telegram_payment_charge_id`);--> statement-breakpoint
CREATE INDEX `payment_transactions_user_paid_idx` ON `payment_transactions` (`user_id`,`paid_at`);