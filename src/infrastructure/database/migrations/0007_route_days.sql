CREATE TABLE `route_days` (
	`weekday` integer NOT NULL,
	`zone_id` text NOT NULL,
	PRIMARY KEY(`weekday`, `zone_id`)
);
