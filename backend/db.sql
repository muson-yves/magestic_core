-- Majestic Core Database
CREATE DATABASE IF NOT EXISTS majestic_core CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE majestic_core;

-- Admin
CREATE TABLE IF NOT EXISTS admin (
  id       INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(100) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL
);

-- Buyers
CREATE TABLE IF NOT EXISTS buyers (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  name       VARCHAR(150) NOT NULL,
  email      VARCHAR(150) NOT NULL UNIQUE,
  password   VARCHAR(255) NOT NULL,
  address    TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Products
CREATE TABLE IF NOT EXISTS products (
  id             INT AUTO_INCREMENT PRIMARY KEY,
  name           VARCHAR(255) NOT NULL,
  description    TEXT,
  price          DECIMAL(10,2) NOT NULL,
  original_price DECIMAL(10,2),
  category       ENUM('cameras','headphones','gaming_pc','laptops','speakers','others') NOT NULL,
  image          VARCHAR(255),
  stock          INT NOT NULL DEFAULT 0,
  featured       TINYINT(1) NOT NULL DEFAULT 0,
  created_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Reviews
CREATE TABLE IF NOT EXISTS reviews (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  product_id INT NOT NULL,
  buyer_id   INT NOT NULL,
  rating     TINYINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment    TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY unique_review (product_id, buyer_id),
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  FOREIGN KEY (buyer_id)   REFERENCES buyers(id)   ON DELETE CASCADE
);

-- Cart
CREATE TABLE IF NOT EXISTS cart (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  buyer_id   INT NOT NULL,
  product_id INT NOT NULL,
  qty        INT NOT NULL DEFAULT 1,
  UNIQUE KEY unique_cart_item (buyer_id, product_id),
  FOREIGN KEY (buyer_id)   REFERENCES buyers(id)   ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

-- Wishlist
CREATE TABLE IF NOT EXISTS wishlist (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  buyer_id   INT NOT NULL,
  product_id INT NOT NULL,
  UNIQUE KEY unique_wishlist_item (buyer_id, product_id),
  FOREIGN KEY (buyer_id)   REFERENCES buyers(id)   ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

-- Orders
CREATE TABLE IF NOT EXISTS orders (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  buyer_id   INT NOT NULL,
  total      DECIMAL(10,2) NOT NULL,
  address    TEXT NOT NULL,
  status     ENUM('pending','processing','shipped','delivered','cancelled') NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (buyer_id) REFERENCES buyers(id) ON DELETE CASCADE
);

-- Order Items
CREATE TABLE IF NOT EXISTS order_items (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  order_id   INT NOT NULL,
  product_id INT,
  name       VARCHAR(255) NOT NULL,
  price      DECIMAL(10,2) NOT NULL,
  qty        INT NOT NULL,
  image      VARCHAR(255),
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
);

-- Product Images (up to 4 extra images per product)
CREATE TABLE IF NOT EXISTS product_images (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  product_id INT NOT NULL,
  filename   VARCHAR(255) NOT NULL,
  sort_order TINYINT NOT NULL DEFAULT 0,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

-- Default admin: username=magestic / password=core123
INSERT INTO admin (username, password)
VALUES ('magestic', '$2a$12$Nx19BZIP0/JQ3MjID.s0oOi659LU8NbxcJkKmGQYBOd/vN.D7.qdy')
ON DUPLICATE KEY UPDATE id=id;
