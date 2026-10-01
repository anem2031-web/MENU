DROP INDEX `products_category_id_idx` ON `products`;--> statement-breakpoint
DROP INDEX `products_sort_order_idx` ON `products`;--> statement-breakpoint
DROP INDEX `products_visible_idx` ON `products`;--> statement-breakpoint
CREATE INDEX `products_menu_lookup_idx` ON `products` (`category_id`,`is_visible`,`sort_order`);--> statement-breakpoint
CREATE INDEX `products_available_idx` ON `products` (`is_available`);