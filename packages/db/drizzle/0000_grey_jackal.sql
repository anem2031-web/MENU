CREATE TABLE `cafe_settings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name_ar` varchar(150) NOT NULL DEFAULT 'كوفي الملقا',
	`name_en` varchar(150) NOT NULL DEFAULT 'Al Malqa Cafe',
	`description_ar` text,
	`description_en` text,
	`logo_key` varchar(500),
	`logo_url` varchar(1000),
	`primary_color` varchar(20) NOT NULL DEFAULT '#5A3825',
	`background_color` varchar(20) NOT NULL DEFAULT '#F5EBDD',
	`public_slug` varchar(120) NOT NULL DEFAULT 'al-malqa',
	`is_published` int NOT NULL DEFAULT 1,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `cafe_settings_id` PRIMARY KEY(`id`),
	CONSTRAINT `cafe_settings_public_slug_unique` UNIQUE(`public_slug`)
);
--> statement-breakpoint
CREATE TABLE `categories` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name_ar` varchar(150) NOT NULL,
	`name_en` varchar(150),
	`sort_order` int NOT NULL DEFAULT 0,
	`is_visible` int NOT NULL DEFAULT 1,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `categories_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `products` (
	`id` int AUTO_INCREMENT NOT NULL,
	`category_id` int NOT NULL,
	`name_ar` varchar(200) NOT NULL,
	`name_en` varchar(200),
	`description_ar` text,
	`description_en` text,
	`price` decimal(10,2) NOT NULL,
	`image_key` varchar(500),
	`image_url` varchar(1000),
	`sort_order` int NOT NULL DEFAULT 0,
	`is_visible` int NOT NULL DEFAULT 1,
	`is_available` int NOT NULL DEFAULT 1,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `products_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` int AUTO_INCREMENT NOT NULL,
	`username` varchar(100) NOT NULL,
	`password_hash` varchar(255) NOT NULL,
	`role` enum('owner','admin') NOT NULL DEFAULT 'admin',
	`is_active` int NOT NULL DEFAULT 1,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `users_id` PRIMARY KEY(`id`),
	CONSTRAINT `users_username_unique` UNIQUE(`username`)
);
--> statement-breakpoint
ALTER TABLE `products` ADD CONSTRAINT `products_category_id_categories_id_fk` FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `categories_sort_order_idx` ON `categories` (`sort_order`);--> statement-breakpoint
CREATE INDEX `categories_visible_idx` ON `categories` (`is_visible`);--> statement-breakpoint
CREATE INDEX `products_category_id_idx` ON `products` (`category_id`);--> statement-breakpoint
CREATE INDEX `products_sort_order_idx` ON `products` (`sort_order`);--> statement-breakpoint
CREATE INDEX `products_visible_idx` ON `products` (`is_visible`);