-- 006_system_settings.sql
-- Create system_settings table for dynamic system feature flags and configurations

CREATE TABLE IF NOT EXISTS `system_settings` (
  `key` VARCHAR(64) NOT NULL PRIMARY KEY,
  `value` TEXT NOT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

INSERT INTO `system_settings` (`key`, `value`)
VALUES ('show_student_rank', 'true')
ON DUPLICATE KEY UPDATE `key` = `key`;
