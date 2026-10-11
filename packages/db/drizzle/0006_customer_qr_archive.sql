CREATE TABLE IF NOT EXISTS `customer_qr` (
  `id` int NOT NULL,
  `token` varchar(32) NOT NULL,
  `stable_url` varchar(1000) NOT NULL,
  `destination_url` varchar(2000) NOT NULL,
  `revision` int NOT NULL DEFAULT 1,
  `created_by` int NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `customer_qr_token_unique` (`token`)
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `customer_qr_history` (
  `id` int NOT NULL AUTO_INCREMENT,
  `qr_id` int NOT NULL,
  `revision` int NOT NULL,
  `previous_url` varchar(2000),
  `destination_url` varchar(2000) NOT NULL,
  `changed_by` int NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `customer_qr_history_revision_unique` (`qr_id`, `revision`),
  CONSTRAINT `customer_qr_history_qr_fk` FOREIGN KEY (`qr_id`) REFERENCES `customer_qr` (`id`)
);
