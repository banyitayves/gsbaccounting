CREATE DATABASE IF NOT EXISTS gs_busanza_accounting
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE gs_busanza_accounting;

CREATE TABLE IF NOT EXISTS accounting_records (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  record_type ENUM('stock', 'filing', 'payments', 'feeding', 'suppliers', 'approvals') NOT NULL,
  academic_year CHAR(9) NOT NULL,
  fiscal_year CHAR(9) NOT NULL,
  payload JSON NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  INDEX idx_accounting_records_type_created (record_type, created_at),
  INDEX idx_accounting_records_years (academic_year, fiscal_year, record_type, created_at)
) ENGINE=InnoDB;
