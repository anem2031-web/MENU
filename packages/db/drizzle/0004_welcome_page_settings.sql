ALTER TABLE `cafe_settings` ADD `welcome_enabled` int NOT NULL DEFAULT 1;--> statement-breakpoint
ALTER TABLE `cafe_settings` ADD `welcome_logo_key` varchar(500);--> statement-breakpoint
ALTER TABLE `cafe_settings` ADD `welcome_logo_url` varchar(1000);--> statement-breakpoint
ALTER TABLE `cafe_settings` ADD `welcome_title_ar` varchar(180) NOT NULL DEFAULT 'أهلًا وسهلًا بكم';--> statement-breakpoint
ALTER TABLE `cafe_settings` ADD `welcome_title_en` varchar(180) NOT NULL DEFAULT 'Welcome';--> statement-breakpoint
ALTER TABLE `cafe_settings` ADD `welcome_subtitle_ar` varchar(180) NOT NULL DEFAULT 'في قهوة الملقا';--> statement-breakpoint
ALTER TABLE `cafe_settings` ADD `welcome_subtitle_en` varchar(180) NOT NULL DEFAULT 'at Al Malqa Cafe';--> statement-breakpoint
ALTER TABLE `cafe_settings` ADD `welcome_description_ar` text;--> statement-breakpoint
ALTER TABLE `cafe_settings` ADD `welcome_description_en` text;--> statement-breakpoint
ALTER TABLE `cafe_settings` ADD `welcome_button_ar` varchar(120) NOT NULL DEFAULT 'استعرض المنيو';--> statement-breakpoint
ALTER TABLE `cafe_settings` ADD `welcome_button_en` varchar(120) NOT NULL DEFAULT 'View Menu';--> statement-breakpoint
UPDATE `cafe_settings`
SET
  `welcome_logo_key` = `logo_key`,
  `welcome_logo_url` = `logo_url`,
  `welcome_description_ar` = 'نجعل كل زيارة لحظة دافئة ومميزة',
  `welcome_description_en` = 'We make every visit a warm and memorable moment'
WHERE `welcome_logo_key` IS NULL AND `welcome_logo_url` IS NULL;
