-- ============================================
-- TIGRE BURGER POS - Database Schema
-- ============================================

CREATE DATABASE IF NOT EXISTS tigre_burger_pos
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE tigre_burger_pos;

-- ============================================
-- TABLA: roles
-- ============================================
CREATE TABLE IF NOT EXISTS roles (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(50) NOT NULL UNIQUE,
  description VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ============================================
-- TABLA: usuarios
-- ============================================
CREATE TABLE IF NOT EXISTS usuarios (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(50) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  full_name VARCHAR(150) NOT NULL,
  role_id INT NOT NULL,
  status ENUM('activo', 'inactivo') DEFAULT 'activo',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE RESTRICT,
  INDEX idx_usuarios_role (role_id),
  INDEX idx_usuarios_status (status)
) ENGINE=InnoDB;

-- ============================================
-- TABLA: categorias
-- ============================================
CREATE TABLE IF NOT EXISTS categorias (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description VARCHAR(255),
  icon VARCHAR(50) DEFAULT NULL,
  status ENUM('activo', 'inactivo') DEFAULT 'activo',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_categorias_status (status)
) ENGINE=InnoDB;

-- ============================================
-- TABLA: productos
-- ============================================
CREATE TABLE IF NOT EXISTS productos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  description TEXT,
  image_url VARCHAR(500) DEFAULT NULL,
  category_id INT NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  status ENUM('activo', 'inactivo') DEFAULT 'activo',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (category_id) REFERENCES categorias(id) ON DELETE RESTRICT,
  INDEX idx_productos_category (category_id),
  INDEX idx_productos_status (status),
  INDEX idx_productos_price (price)
) ENGINE=InnoDB;

-- ============================================
-- TABLA: mesas
-- ============================================
CREATE TABLE IF NOT EXISTS mesas (
  id INT AUTO_INCREMENT PRIMARY KEY,
  number INT NOT NULL UNIQUE,
  status ENUM('libre', 'ocupada', 'pendiente_pago') DEFAULT 'libre',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_mesas_status (status)
) ENGINE=InnoDB;

-- ============================================
-- TABLA: metodos_pago
-- ============================================
CREATE TABLE IF NOT EXISTS metodos_pago (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(50) NOT NULL UNIQUE,
  description VARCHAR(255),
  status ENUM('activo', 'inactivo') DEFAULT 'activo',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ============================================
-- TABLA: cajas
-- ============================================
CREATE TABLE IF NOT EXISTS cajas (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  opening_amount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  closing_amount DECIMAL(10,2) DEFAULT NULL,
  cash_sales DECIMAL(10,2) DEFAULT 0.00,
  qr_sales DECIMAL(10,2) DEFAULT 0.00,
  total_sales DECIMAL(10,2) DEFAULT 0.00,
  order_count INT DEFAULT 0,
  status ENUM('abierta', 'cerrada') DEFAULT 'abierta',
  opened_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  closed_at TIMESTAMP NULL,
  FOREIGN KEY (user_id) REFERENCES usuarios(id) ON DELETE RESTRICT,
  INDEX idx_cajas_status (status),
  INDEX idx_cajas_user (user_id),
  INDEX idx_cajas_opened (opened_at)
) ENGINE=InnoDB;

-- ============================================
-- TABLA: ventas
-- ============================================
CREATE TABLE IF NOT EXISTS ventas (
  id INT AUTO_INCREMENT PRIMARY KEY,
  caja_id INT DEFAULT NULL,
  mesa_id INT DEFAULT NULL,
  user_id INT NOT NULL,
  payment_method_id INT DEFAULT NULL,
  sale_type ENUM('mesa', 'llevar') NOT NULL,
  subtotal DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  total DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  status ENUM('activa', 'cerrada', 'cancelada', 'reservada') DEFAULT 'activa',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (caja_id) REFERENCES cajas(id) ON DELETE RESTRICT,
  FOREIGN KEY (mesa_id) REFERENCES mesas(id) ON DELETE SET NULL,
  FOREIGN KEY (user_id) REFERENCES usuarios(id) ON DELETE RESTRICT,
  FOREIGN KEY (payment_method_id) REFERENCES metodos_pago(id) ON DELETE RESTRICT,
  INDEX idx_ventas_caja (caja_id),
  INDEX idx_ventas_mesa (mesa_id),
  INDEX idx_ventas_user (user_id),
  INDEX idx_ventas_type (sale_type),
  INDEX idx_ventas_status (status),
  INDEX idx_ventas_created (created_at)
) ENGINE=InnoDB;

-- ============================================
-- TABLA: venta_pagos (pagos divididos)
-- ============================================
CREATE TABLE IF NOT EXISTS venta_pagos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  sale_id INT NOT NULL,
  payment_method_id INT NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (sale_id) REFERENCES ventas(id) ON DELETE CASCADE,
  FOREIGN KEY (payment_method_id) REFERENCES metodos_pago(id) ON DELETE RESTRICT,
  INDEX idx_venta_pagos_sale (sale_id)
) ENGINE=InnoDB;

-- ============================================
-- TABLA: detalle_ventas
-- ============================================
CREATE TABLE IF NOT EXISTS detalle_ventas (
  id INT AUTO_INCREMENT PRIMARY KEY,
  sale_id INT NOT NULL,
  product_id INT NOT NULL,
  quantity INT NOT NULL DEFAULT 1,
  unit_price DECIMAL(10,2) NOT NULL,
  subtotal DECIMAL(10,2) NOT NULL,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (sale_id) REFERENCES ventas(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES productos(id) ON DELETE RESTRICT,
  INDEX idx_detalle_sale (sale_id),
  INDEX idx_detalle_product (product_id)
) ENGINE=InnoDB;

-- ============================================
-- DATOS INICIALES
-- ============================================

-- Roles
INSERT INTO roles (name, description) VALUES
  ('admin', 'Administrador con acceso completo al sistema'),
  ('cajero', 'Cajero con acceso limitado a ventas y caja');

-- Métodos de pago
INSERT INTO metodos_pago (name, description) VALUES
  ('Efectivo', 'Pago en efectivo'),
  ('QR', 'Pago mediante código QR');

-- Mesas (5 mesas)
INSERT INTO mesas (number, status) VALUES
  (1, 'libre'),
  (2, 'libre'),
  (3, 'libre'),
  (4, 'libre'),
  (5, 'libre');

-- Usuario admin por defecto (password: admin123)
-- La contraseña se cifrará al ejecutar initDatabase.js
