CREATE TABLE `customer_products` (
	`id` text PRIMARY KEY NOT NULL,
	`customer_id` text NOT NULL,
	`product_id` text NOT NULL,
	`purchase_count` integer NOT NULL,
	`total_quantity` integer NOT NULL,
	`last_quantity` integer NOT NULL,
	`last_purchased_at` text NOT NULL,
	`in_last_purchase` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `customer_products_customer_idx` ON `customer_products` (`customer_id`);--> statement-breakpoint
ALTER TABLE `products` ADD `search_text` text;