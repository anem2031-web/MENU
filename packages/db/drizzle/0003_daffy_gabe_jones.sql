ALTER TABLE `products` ADD `is_featured` int DEFAULT 0 NOT NULL;--> statement-breakpoint
CREATE INDEX `products_featured_idx` ON `products` (`is_featured`);