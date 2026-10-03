CREATE DATABASE IF NOT EXISTS pc_builder
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE pc_builder;

CREATE TABLE IF NOT EXISTS categories (
  id VARCHAR(40) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  icon VARCHAR(60) NULL
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS users (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(80) NOT NULL,
  email VARCHAR(190) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('user','admin') NOT NULL DEFAULT 'user',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS products (
  id VARCHAR(100) PRIMARY KEY,
  category_id VARCHAR(40) NOT NULL,
  brand VARCHAR(100) NULL,
  name VARCHAR(200) NOT NULL,
  price DECIMAL(12,2) NOT NULL DEFAULT 0,
  previous_price DECIMAL(12,2) NULL,
  rating DECIMAL(3,2) NULL,
  socket VARCHAR(60) NULL,
  watts INT NULL,
  tier VARCHAR(40) NULL,
  specs TEXT NULL,
  color VARCHAR(20) NULL,
  image_url TEXT NULL,
  change_note VARCHAR(255) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_products_category FOREIGN KEY (category_id) REFERENCES categories(id)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  INDEX idx_products_category (category_id),
  INDEX idx_products_name (name)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS saved_builds (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT UNSIGNED NOT NULL,
  name VARCHAR(150) NOT NULL,
  total_price DECIMAL(12,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_saved_builds_user FOREIGN KEY (user_id) REFERENCES users(id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  INDEX idx_saved_builds_user (user_id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS build_items (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  build_id BIGINT UNSIGNED NOT NULL,
  product_id VARCHAR(100) NOT NULL,
  quantity INT UNSIGNED NOT NULL DEFAULT 1,
  CONSTRAINT fk_build_items_build FOREIGN KEY (build_id) REFERENCES saved_builds(id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_build_items_product FOREIGN KEY (product_id) REFERENCES products(id)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  UNIQUE KEY uq_build_product (build_id, product_id)
) ENGINE=InnoDB;

INSERT INTO categories (id, name, icon) VALUES
 ('cpu','CPU','Cpu'),
 ('gpu','GPU','Monitor'),
 ('motherboard','เมนบอร์ด','CircuitBoard'),
 ('ram','RAM','MemoryStick'),
 ('storage','SSD / HDD','HardDrive'),
 ('psu','Power Supply','Zap'),
 ('case','Case','Box'),
 ('cooler','CPU Cooler','Fan')
ON DUPLICATE KEY UPDATE name=VALUES(name), icon=VALUES(icon);
