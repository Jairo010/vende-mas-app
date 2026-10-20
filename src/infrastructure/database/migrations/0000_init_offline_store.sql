CREATE TABLE `categories` (
	`id` text PRIMARY KEY NOT NULL,
	`code` text NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`is_active` integer DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE `customers` (
	`id` text PRIMARY KEY NOT NULL,
	`status` text NOT NULL,
	`trade_name` text NOT NULL,
	`business_name` text,
	`identification_type` text,
	`identification` text,
	`contact_name` text,
	`phone` text,
	`email` text,
	`address` text,
	`address_reference` text,
	`latitude` real,
	`longitude` real,
	`store_photo_url` text,
	`store_photo_local_uri` text,
	`assigned_seller_id` text,
	`created_by_id` text,
	`external_id` text,
	`billing_sync_status` text DEFAULT 'NOT_REQUIRED' NOT NULL,
	`is_active` integer DEFAULT true NOT NULL,
	`sync_status` text DEFAULT 'SYNCED' NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `customers_trade_name_idx` ON `customers` (`trade_name`);--> statement-breakpoint
CREATE INDEX `customers_identification_idx` ON `customers` (`identification`);--> statement-breakpoint
CREATE TABLE `order_items` (
	`id` text PRIMARY KEY NOT NULL,
	`order_id` text NOT NULL,
	`product_id` text NOT NULL,
	`product_code` text NOT NULL,
	`product_name` text NOT NULL,
	`quantity` integer NOT NULL,
	`unit_price` real NOT NULL,
	`discount` real NOT NULL,
	`total_price` real NOT NULL,
	`tax_rate` real NOT NULL,
	`tax_amount` real NOT NULL,
	`promotion_name` text,
	FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `order_items_order_id_idx` ON `order_items` (`order_id`);--> statement-breakpoint
CREATE TABLE `orders` (
	`id` text PRIMARY KEY NOT NULL,
	`order_number` text,
	`customer_id` text NOT NULL,
	`customer_name` text,
	`visit_id` text,
	`seller_id` text NOT NULL,
	`status` text NOT NULL,
	`subtotal` real NOT NULL,
	`discount_total` real NOT NULL,
	`tax_total` real NOT NULL,
	`total` real NOT NULL,
	`estimated_delivery_date` text,
	`notes` text,
	`billing_sync_status` text DEFAULT 'NOT_REQUIRED' NOT NULL,
	`invoice_number` text,
	`price_adjustments` text,
	`sync_status` text DEFAULT 'SYNCED' NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `orders_created_at_idx` ON `orders` (`created_at`);--> statement-breakpoint
CREATE INDEX `orders_customer_id_idx` ON `orders` (`customer_id`);--> statement-breakpoint
CREATE INDEX `orders_visit_id_idx` ON `orders` (`visit_id`);--> statement-breakpoint
CREATE TABLE `outbox` (
	`seq` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`idempotency_key` text NOT NULL,
	`entity_type` text NOT NULL,
	`entity_id` text NOT NULL,
	`action` text NOT NULL,
	`payload` text NOT NULL,
	`client_timestamp` text NOT NULL,
	`photo_id` text,
	`photo_field` text,
	`status` text DEFAULT 'PENDING' NOT NULL,
	`attempts` integer DEFAULT 0 NOT NULL,
	`last_error_code` text,
	`last_error_message` text,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `outbox_idempotency_key_unique` ON `outbox` (`idempotency_key`);--> statement-breakpoint
CREATE INDEX `outbox_status_idx` ON `outbox` (`status`);--> statement-breakpoint
CREATE INDEX `outbox_entity_id_idx` ON `outbox` (`entity_id`);--> statement-breakpoint
CREATE TABLE `pending_photos` (
	`id` text PRIMARY KEY NOT NULL,
	`local_uri` text NOT NULL,
	`remote_url` text,
	`attempts` integer DEFAULT 0 NOT NULL,
	`last_error` text,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `products` (
	`id` text PRIMARY KEY NOT NULL,
	`code` text NOT NULL,
	`name` text NOT NULL,
	`brand` text,
	`description` text,
	`category_id` text NOT NULL,
	`category_name` text NOT NULL,
	`base_price` real NOT NULL,
	`tax_rate` real NOT NULL,
	`price_with_tax` real NOT NULL,
	`unit_of_measure` text NOT NULL,
	`stock_quantity` integer NOT NULL,
	`image_url` text,
	`is_active` integer DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE INDEX `products_name_idx` ON `products` (`name`);--> statement-breakpoint
CREATE INDEX `products_category_id_idx` ON `products` (`category_id`);--> statement-breakpoint
CREATE TABLE `promotions` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`discount_type` text NOT NULL,
	`discount_value` real NOT NULL,
	`target_type` text NOT NULL,
	`target_category_id` text,
	`target_product_ids` text NOT NULL,
	`min_quantity` integer NOT NULL,
	`starts_at` text NOT NULL,
	`ends_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `sync_meta` (
	`key` text PRIMARY KEY NOT NULL,
	`value` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `visits` (
	`id` text PRIMARY KEY NOT NULL,
	`type` text NOT NULL,
	`status` text NOT NULL,
	`outcome` text,
	`scheduled_at` text NOT NULL,
	`notes` text,
	`started_at` text,
	`start_latitude` real,
	`start_longitude` real,
	`start_accuracy_meters` real,
	`ended_at` text,
	`end_latitude` real,
	`end_longitude` real,
	`end_accuracy_meters` real,
	`distance_to_customer_meters` real,
	`duration_minutes` integer,
	`photo_url` text,
	`photo_local_uri` text,
	`cancellation_reason` text,
	`seller_id` text NOT NULL,
	`seller_name` text,
	`created_by_id` text NOT NULL,
	`customer_id` text NOT NULL,
	`parent_visit_id` text,
	`sync_status` text DEFAULT 'SYNCED' NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `visits_scheduled_at_idx` ON `visits` (`scheduled_at`);--> statement-breakpoint
CREATE INDEX `visits_customer_id_idx` ON `visits` (`customer_id`);--> statement-breakpoint
CREATE INDEX `visits_status_idx` ON `visits` (`status`);