-- الفئات الرئيسية الجديدة، مع إبقاء الأقسام والأصناف الحالية كما هي.
CREATE TABLE `menu_groups` (
  `id` int AUTO_INCREMENT NOT NULL PRIMARY KEY,
  `name_ar` varchar(150) NOT NULL,
  `name_en` varchar(150),
  `image_key` varchar(500),
  `image_url` varchar(1000),
  `sort_order` int NOT NULL DEFAULT 0,
  `is_visible` int NOT NULL DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `menu_groups_sort_order_idx` (`sort_order`)
);--> statement-breakpoint
ALTER TABLE `categories` ADD COLUMN `menu_group_id` int NULL;--> statement-breakpoint
CREATE INDEX `categories_menu_group_idx` ON `categories` (`menu_group_id`);--> statement-breakpoint
-- وضع الأقسام القديمة مؤقتًا تحت فئة واحدة دون حذف أو تغيير أي صنف.
INSERT INTO `menu_groups` (`name_ar`, `name_en`, `sort_order`, `is_visible`)
SELECT 'القائمة الحالية', 'Existing Menu', 10, 1
WHERE EXISTS (SELECT 1 FROM `categories` LIMIT 1);--> statement-breakpoint
UPDATE `categories`
SET `menu_group_id` = (SELECT `id` FROM `menu_groups` ORDER BY `id` LIMIT 1)
WHERE `menu_group_id` IS NULL;--> statement-breakpoint
ALTER TABLE `categories` ADD CONSTRAINT `categories_menu_group_id_menu_groups_id_fk`
  FOREIGN KEY (`menu_group_id`) REFERENCES `menu_groups` (`id`);
