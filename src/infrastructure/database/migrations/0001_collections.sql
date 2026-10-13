CREATE TABLE `payments` (
	`id` text PRIMARY KEY NOT NULL,
	`receivable_id` text NOT NULL,
	`customer_id` text NOT NULL,
	`seller_id` text NOT NULL,
	`visit_id` text,
	`amount` real NOT NULL,
	`method` text NOT NULL,
	`reference` text,
	`bank_name` text,
	`check_date` text,
	`photo_url` text,
	`photo_local_uri` text,
	`notes` text,
	`paid_at` text NOT NULL,
	`allocations` text NOT NULL,
	`sync_status` text DEFAULT 'SYNCED' NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `payments_customer_id_idx` ON `payments` (`customer_id`);--> statement-breakpoint
CREATE INDEX `payments_receivable_id_idx` ON `payments` (`receivable_id`);--> statement-breakpoint
CREATE INDEX `payments_visit_id_idx` ON `payments` (`visit_id`);--> statement-breakpoint
CREATE INDEX `payments_paid_at_idx` ON `payments` (`paid_at`);--> statement-breakpoint
CREATE TABLE `receivable_installments` (
	`id` text PRIMARY KEY NOT NULL,
	`receivable_id` text NOT NULL,
	`number` integer NOT NULL,
	`due_date` text NOT NULL,
	`amount` real NOT NULL,
	`paid_amount` real DEFAULT 0 NOT NULL,
	`status` text NOT NULL,
	FOREIGN KEY (`receivable_id`) REFERENCES `receivables`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `receivable_installments_receivable_id_idx` ON `receivable_installments` (`receivable_id`);--> statement-breakpoint
CREATE INDEX `receivable_installments_due_date_idx` ON `receivable_installments` (`due_date`);--> statement-breakpoint
CREATE TABLE `receivables` (
	`id` text PRIMARY KEY NOT NULL,
	`customer_id` text NOT NULL,
	`seller_id` text,
	`order_id` text,
	`source` text NOT NULL,
	`document_number` text NOT NULL,
	`plan_type` text NOT NULL,
	`issued_at` text NOT NULL,
	`total` real NOT NULL,
	`paid_amount` real DEFAULT 0 NOT NULL,
	`external_paid_amount` real DEFAULT 0 NOT NULL,
	`status` text NOT NULL,
	`sync_status` text DEFAULT 'SYNCED' NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `receivables_customer_id_idx` ON `receivables` (`customer_id`);--> statement-breakpoint
CREATE INDEX `receivables_status_idx` ON `receivables` (`status`);--> statement-breakpoint
ALTER TABLE `orders` ADD `payment_plan_type` text DEFAULT 'SINGLE' NOT NULL;--> statement-breakpoint
ALTER TABLE `orders` ADD `installments_count` integer DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE `orders` ADD `first_due_date` text;