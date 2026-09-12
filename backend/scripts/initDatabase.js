const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const fs = require('fs');
const path = require('path');

const initDatabase = async () => {
  let connection;

  try {
    connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      port: process.env.DB_PORT,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD
    });

    console.log('Conectado al servidor MySQL');

    // Create database
    await connection.query(`
      CREATE DATABASE IF NOT EXISTS tigre_burger_pos
      CHARACTER SET utf8mb4
      COLLATE utf8mb4_unicode_ci
    `);
    await connection.query('USE tigre_burger_pos');
    console.log('Base de datos verificada/creada');

    // Create tables one by one (avoid SQL comment issues)
    const tables = [
      `CREATE TABLE IF NOT EXISTS roles (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(50) NOT NULL UNIQUE,
        description VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB`,

      `CREATE TABLE IF NOT EXISTS usuarios (
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
      ) ENGINE=InnoDB`,

      `CREATE TABLE IF NOT EXISTS categorias (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        description VARCHAR(255),
        status ENUM('activo', 'inactivo') DEFAULT 'activo',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_categorias_status (status)
      ) ENGINE=InnoDB`,

      `CREATE TABLE IF NOT EXISTS productos (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(150) NOT NULL,
        description TEXT,
        category_id INT NOT NULL,
        price DECIMAL(10,2) NOT NULL,
        status ENUM('activo', 'inactivo') DEFAULT 'activo',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (category_id) REFERENCES categorias(id) ON DELETE RESTRICT,
        INDEX idx_productos_category (category_id),
        INDEX idx_productos_status (status),
        INDEX idx_productos_price (price)
      ) ENGINE=InnoDB`,

      `CREATE TABLE IF NOT EXISTS mesas (
        id INT AUTO_INCREMENT PRIMARY KEY,
        number INT NOT NULL UNIQUE,
        status ENUM('libre', 'ocupada', 'pendiente_pago') DEFAULT 'libre',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_mesas_status (status)
      ) ENGINE=InnoDB`,

      `CREATE TABLE IF NOT EXISTS metodos_pago (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(50) NOT NULL UNIQUE,
        description VARCHAR(255),
        status ENUM('activo', 'inactivo') DEFAULT 'activo',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB`,

      `CREATE TABLE IF NOT EXISTS cajas (
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
      ) ENGINE=InnoDB`,

      `CREATE TABLE IF NOT EXISTS ventas (
        id INT AUTO_INCREMENT PRIMARY KEY,
        caja_id INT NOT NULL,
        mesa_id INT DEFAULT NULL,
        user_id INT NOT NULL,
        payment_method_id INT NOT NULL,
        sale_type ENUM('mesa', 'llevar') NOT NULL,
        subtotal DECIMAL(10,2) NOT NULL DEFAULT 0.00,
        total DECIMAL(10,2) NOT NULL DEFAULT 0.00,
        status ENUM('activa', 'cerrada', 'cancelada') DEFAULT 'activa',
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
      ) ENGINE=InnoDB`,

      `CREATE TABLE IF NOT EXISTS detalle_ventas (
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
      ) ENGINE=InnoDB`
    ];

    for (const tableSQL of tables) {
      await connection.query(tableSQL);
    }
    console.log('Tablas creadas/verificadas');

    // Insert default data
    await connection.query(`
      INSERT IGNORE INTO roles (name, description) VALUES
        ('admin', 'Administrador con acceso completo al sistema'),
        ('cajero', 'Cajero con acceso limitado a ventas y caja')
    `);

    await connection.query(`
      INSERT IGNORE INTO metodos_pago (name, description) VALUES
        ('Efectivo', 'Pago en efectivo'),
        ('QR', 'Pago mediante código QR')
    `);

    for (let i = 1; i <= 5; i++) {
      await connection.query(
        'INSERT IGNORE INTO mesas (number, status) VALUES (?, ?)',
        [i, 'libre']
      );
    }
    console.log('Datos iniciales insertados');

    // Create users with hashed passwords
    const hashedAdmin = await bcrypt.hash('admin123', 10);
    const [adminRole] = await connection.query("SELECT id FROM roles WHERE name = 'admin'");

    await connection.query(
      `INSERT INTO usuarios (username, password, full_name, role_id, status)
       VALUES (?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE password = VALUES(password)`,
      ['admin', hashedAdmin, 'Administrador', adminRole[0].id, 'activo']
    );

    const hashedCajero = await bcrypt.hash('cajero123', 10);
    const [cajeroRole] = await connection.query("SELECT id FROM roles WHERE name = 'cajero'");

    await connection.query(
      `INSERT INTO usuarios (username, password, full_name, role_id, status)
       VALUES (?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE password = VALUES(password)`,
      ['cajero', hashedCajero, 'Cajero Principal', cajeroRole[0].id, 'activo']
    );

    console.log('Usuarios creados:');
    console.log('  Admin  -> admin / admin123');
    console.log('  Cajero -> cajero / cajero123');

    console.log('\nBase de datos inicializada correctamente');
    process.exit(0);
  } catch (error) {
    console.error('Error al inicializar la base de datos:', error.message);
    process.exit(1);
  } finally {
    if (connection) await connection.end();
  }
};

initDatabase();
