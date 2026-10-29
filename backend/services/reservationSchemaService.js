const { pool } = require('../config/database');

const columns = [
  ['customer_name', 'VARCHAR(150) NULL'],
  ['customer_phone', 'VARCHAR(30) NULL'],
  ['payment_preference', "VARCHAR(20) NULL"],
  ['reservation_notes', 'TEXT NULL']
];

async function ensureReservationSchema() {
  for (const [name, definition] of columns) {
    const [rows] = await pool.query(
      `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
       WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'ventas' AND COLUMN_NAME = ?`,
      [name]
    );
    if (!rows.length) {
      await pool.query(`ALTER TABLE ventas ADD COLUMN ${name} ${definition}`);
      console.log(`Columna de reservas creada: ventas.${name}`);
    }
  }
}

async function ensureProductCustomizationSchema() {
  const columns = [
    ['allows_sauces', 'TINYINT(1) NOT NULL DEFAULT 0'],
    ['allows_salad', 'TINYINT(1) NOT NULL DEFAULT 0']
  ];

  let createdCustomizationColumn = false;
  for (const [name, definition] of columns) {
    const [rows] = await pool.query(
      `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
       WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'productos' AND COLUMN_NAME = ?`,
      [name]
    );
    if (!rows.length) {
      await pool.query(`ALTER TABLE productos ADD COLUMN ${name} ${definition}`);
      console.log(`Columna de personalización creada: productos.${name}`);
      createdCustomizationColumn = true;
    }
  }

  // Seed only the menu that existed before these settings were introduced.
  // Later admin choices must stay untouched on every restart.
  if (createdCustomizationColumn) {
    await pool.query('UPDATE productos SET allows_sauces = 1');
    await pool.query(`UPDATE productos p
      JOIN categorias c ON c.id = p.category_id
      SET p.allows_salad = 1
      WHERE LOWER(c.name) IN ('hamburguesas', 'sueltos')`);
  }
}

module.exports = { ensureReservationSchema, ensureProductCustomizationSchema };
