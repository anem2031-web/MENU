ALTER TABLE `cafe_settings` MODIFY COLUMN `background_color` varchar(20) NOT NULL DEFAULT '#F7F1EA';--> statement-breakpoint
ALTER TABLE `cafe_settings` ADD `currency` varchar(10) NOT NULL DEFAULT 'SAR';--> statement-breakpoint
ALTER TABLE `cafe_settings` ADD `default_language` enum('ar','en') NOT NULL DEFAULT 'ar';
