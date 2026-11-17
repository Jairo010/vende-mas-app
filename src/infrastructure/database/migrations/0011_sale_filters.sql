CREATE TABLE `product_fitments` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`product_id` text NOT NULL,
	`make` text NOT NULL,
	`model` text,
	`year_from` integer,
	`year_to` integer
);
--> statement-breakpoint
CREATE INDEX `product_fitments_product_idx` ON `product_fitments` (`product_id`);--> statement-breakpoint
CREATE INDEX `product_fitments_vehicle_idx` ON `product_fitments` (`make`,`model`);--> statement-breakpoint
ALTER TABLE `products` ADD `family` text DEFAULT 'OTHER' NOT NULL;--> statement-breakpoint
ALTER TABLE `products` ADD `position` text;--> statement-breakpoint
ALTER TABLE `products` ADD `material` text;--> statement-breakpoint
ALTER TABLE `products` ADD `filter_type` text;--> statement-breakpoint
ALTER TABLE `products` ADD `viscosity` text;--> statement-breakpoint
ALTER TABLE `products` ADD `oil_type` text;--> statement-breakpoint
ALTER TABLE `products` ADD `presentation` text;--> statement-breakpoint
ALTER TABLE `products` ADD `reference` text;--> statement-breakpoint
CREATE INDEX `products_family_idx` ON `products` (`family`);